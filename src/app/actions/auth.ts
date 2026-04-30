"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function registerUser(formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase().trim()
  const password = formData.get("password") as string
  const confirm = formData.get("confirm") as string
  const callbackUrl = formData.get("callbackUrl") as string || "/dashboard"

  if (!email || !password || !confirm)
    return { error: "Todos los campos son obligatorios." }
  if (!email.includes("@"))
    return { error: "Ingresa un correo electrónico válido." }
  if (password.length < 8)
    return { error: "La contraseña debe tener al menos 8 caracteres." }
  if (!(/[a-zA-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)))
    return { error: "La contraseña debe contener al menos una letra, un número y un carácter especial." }
  if (password !== confirm)
    return { error: "Las contraseñas no coinciden." }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "Ya existe una cuenta con ese correo." }

  const hashed = await bcrypt.hash(password, 10)
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user"
  let username = base
  let count = 1
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${count++}`
  }

  await prisma.user.create({
    data: { email, password: hashed, username, name: username },
  })

  redirect(`/login?registered=1&callbackUrl=${encodeURIComponent(callbackUrl)}`)
}

export async function loginUser() {
  // El login con credenciales se maneja desde el cliente con signIn("credentials")
  return {}
}

export async function logoutUser() {
  const { signOut } = await import("@/auth")
  await signOut({ redirectTo: "/login" })
}

export async function updateEmail(formData: FormData) {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado." }

  const email = (formData.get("email") as string)?.toLowerCase().trim()
  if (!email || !email.includes("@")) return { error: "Ingresá un correo válido." }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && existing.id !== session.user.id) return { error: "Ese correo ya está en uso." }

  await prisma.user.update({ where: { id: session.user.id }, data: { email } })
  return { success: true }
}

export async function updateUsername(formData: FormData) {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado." }

  const username = (formData.get("username") as string)?.toLowerCase().trim().replace(/[^a-z0-9_]/g, "")
  if (!username || username.length < 3) return { error: "El username debe tener al menos 3 caracteres." }
  if (username.length > 30) return { error: "No puede tener más de 30 caracteres." }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing && existing.id !== session.user.id) return { error: "Ese username ya está en uso." }

  await prisma.user.update({ where: { id: session.user.id }, data: { username } })
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado." }

  const current = formData.get("currentPassword") as string
  const next = formData.get("newPassword") as string
  const confirm = formData.get("confirm") as string

  if (!current || !next || !confirm) return { error: "Todos los campos son obligatorios." }
  if (next.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." }
  if (!(/[a-zA-Z]/.test(next) && /[0-9]/.test(next) && /[^a-zA-Z0-9]/.test(next)))
    return { error: "Debe contener al menos una letra, un número y un carácter especial." }
  if (next !== confirm) return { error: "Las contraseñas no coinciden." }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
  if (!user?.password) return { error: "Tu cuenta usa Google. No podés cambiar la contraseña desde acá." }

  const valid = await bcrypt.compare(current, user.password)
  if (!valid) return { error: "La contraseña actual es incorrecta." }

  const hashed = await bcrypt.hash(next, 10)
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })
  return { success: true }
}

export async function deleteAccount() {
  const { auth, signOut } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado." }

  await prisma.user.delete({ where: { id: session.user.id } })
  await signOut({ redirectTo: "/" })
}

export async function claimCardWithSetup(token: string, formData: FormData) {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const card = await prisma.nfcCard.findUnique({ where: { token: token.toUpperCase() } })
  if (!card) return { error: "Tarjeta inválida" }
  if (card.status === 'claimed' && card.userId !== session.user.id) return { error: "Tarjeta ya reclamada" }

  // No otorgar bonus si esta tarjeta ya fue reclamada por este mismo usuario antes
  const alreadyClaimed = card.status === 'claimed' && card.userId === session.user.id

  const name = (formData.get("name") as string)?.trim() || null
  const businessName = (formData.get("businessName") as string)?.trim() || null
  const phone = (formData.get("phone") as string)?.trim() || null
  const rawType = (formData.get("type") as string) || "restaurant"
  const VALID_TYPES = ["restaurant", "bar", "cafe", "store", "other"]
  const type = VALID_TYPES.includes(rawType) ? rawType : "restaurant"

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.nfcCard.update({
      where: { token: token.toUpperCase() },
      data: { status: 'claimed', userId: session.user!.id, claimedAt: now },
    })

    const userUpdates: Record<string, unknown> = {}
    if (name) userUpdates.name = name

    // Solo otorgar bonus si la tarjeta es nueva (no re-claim del mismo usuario)
    if (!alreadyClaimed) {
      // Extender el bonus si ya tiene uno activo; de lo contrario iniciar desde hoy
      const existing = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { nfcProBonusUntil: true },
      })
      const base = existing?.nfcProBonusUntil && existing.nfcProBonusUntil > now
        ? existing.nfcProBonusUntil
        : now
      userUpdates.nfcProBonusUntil = new Date(base.getTime() + 60 * 24 * 60 * 60 * 1000)
    }

    if (Object.keys(userUpdates).length > 0) {
      await tx.user.update({ where: { id: session.user!.id }, data: userUpdates })
    }

    if (businessName || phone) {
      const uid = session.user!.id as string
      await tx.businessConfig.upsert({
        where: { userId: uid },
        create: { enabled: true, businessName, phone, type, userId: uid },
        update: { enabled: true, ...(businessName ? { businessName } : {}), ...(phone ? { phone } : {}), type },
      })
    }
  })

  return { success: true }
}
