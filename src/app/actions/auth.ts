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
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." }
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

export async function loginUser(_: FormData) {
  // El login con credenciales se maneja desde el cliente con signIn("credentials")
  return {}
}

export async function logoutUser() {
  const { signOut } = await import("@/auth")
  await signOut({ redirectTo: "/login" })
}
