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

export async function claimCardWithSetup(token: string, formData: FormData) {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const card = await prisma.nfcCard.findUnique({ where: { token: token.toUpperCase() } })
  if (!card) return { error: "Tarjeta inválida" }
  if (card.status === 'claimed' && card.userId !== session.user.id) return { error: "Tarjeta ya reclamada" }

  const name = (formData.get("name") as string)?.trim() || null
  const businessName = (formData.get("businessName") as string)?.trim() || null
  const phone = (formData.get("phone") as string)?.trim() || null
  const rawType = (formData.get("type") as string) || "restaurant"
  const VALID_TYPES = ["restaurant", "bar", "cafe", "store", "other"]
  const type = VALID_TYPES.includes(rawType) ? rawType : "restaurant"

  await prisma.$transaction(async (tx) => {
    await tx.nfcCard.update({
      where: { token: token.toUpperCase() },
      data: { status: 'claimed', userId: session.user!.id },
    })

    if (name) {
      await tx.user.update({ where: { id: session.user!.id }, data: { name } })
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
