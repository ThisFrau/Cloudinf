import { auth } from "@/auth"

// Configurar ADMIN_EMAIL en las variables de entorno del proyecto.
// Por seguridad nunca hardcodear en el código fuente.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

export async function getAdminSession() {
  const session = await auth()
  if (!session?.user?.email || !ADMIN_EMAIL) return null
  if (session.user.email !== ADMIN_EMAIL) return null
  return session
}

export async function isAdmin(): Promise<boolean> {
  const s = await getAdminSession()
  return s !== null
}
