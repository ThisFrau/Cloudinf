"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PLATFORMS } from "@/lib/constants"

// ─── Update Profile ────────────────────────────────────────────────────────────
export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const name = formData.get("name") as string
  const bio = formData.get("bio") as string
  const avatarUrl = formData.get("avatarUrl") as string
  const username = (formData.get("username") as string)?.toLowerCase().trim()
  const buttonStyle = formData.get("buttonStyle") as string || "default"
  const themeColorRaw = formData.get("themeColor") as string
  const themeColor = themeColorRaw || null
  const layoutStyle = formData.get("layoutStyle") as string || "list"
  const avatarAlign = formData.get("avatarAlign") as string || "center"
  const bannerUrl = (formData.get("bannerUrl") as string) || null
  const vcardEnabled = formData.get("vcardEnabled") === "true"
  const contactFormEnabled = formData.get("contactFormEnabled") === "true"
  const contactFormAskName = formData.get("contactFormAskName") === "true"
  const contactFormAskEmail = formData.get("contactFormAskEmail") === "true"
  const contactFormAskPhone = formData.get("contactFormAskPhone") === "true"
  const contactFormAskMessage = formData.get("contactFormAskMessage") === "true"
  const seoTitle = (formData.get("seoTitle") as string) || null
  const seoDescription = (formData.get("seoDescription") as string) || null
  // Background
  const bgType = (formData.get("bgType") as string) || "default"
  const bgColor = (formData.get("bgColor") as string) || null
  const bgGradient1 = (formData.get("bgGradient1") as string) || null
  const bgGradient2 = (formData.get("bgGradient2") as string) || null
  const bgGradientDir = (formData.get("bgGradientDir") as string) || "135deg"
  const bgImageUrl = (formData.get("bgImageUrl") as string) || null
  // Integrations
  const translateEnabled = formData.get("translateEnabled") === "true"
  const spotifyProfileUrl = (formData.get("spotifyProfileUrl") as string) || null
  const carouselEnabled = formData.get("carouselEnabled") === "true"

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: session.user.id } },
    })
    if (existing) return { error: "Ese username ya está en uso." }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name, bio, avatarUrl, buttonStyle, themeColor, layoutStyle, avatarAlign, bannerUrl,
        vcardEnabled, contactFormEnabled, 
        contactFormAskName, contactFormAskEmail, contactFormAskPhone, contactFormAskMessage,
        seoTitle, seoDescription,
        bgType, bgColor, bgGradient1, bgGradient2, bgGradientDir, bgImageUrl,
        translateEnabled, spotifyProfileUrl, carouselEnabled,
        ...(username ? { username } : {}),
      },
    })
    revalidatePath("/dashboard")
    if (username) revalidatePath(`/${username}`)
    return { success: true }
  } catch {
    return { error: "Error al actualizar perfil." }
  }
}

// ─── Create Link ───────────────────────────────────────────────────────────────
export async function createLink(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const title    = formData.get("title") as string
  const url      = formData.get("url") as string
  const platform = (formData.get("platform") as string) || "other"
  const displayStyle = (formData.get("displayStyle") as string) || "auto"
  const type = (formData.get("type") as string) || "link"
  const platformData = PLATFORMS[platform] || PLATFORMS.other

  try {
    await prisma.link.create({
      data: {
        title,
        url: type === 'header' ? '#' : url,
        platform,
        displayStyle,
        type,
        icon: platformData.icon,
        userId: session.user.id,
      },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al crear link." }
  }
}

// ─── Delete Link ───────────────────────────────────────────────────────────────
export async function deleteLink(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.link.delete({ where: { id, userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al borrar link." }
  }
}

// ─── Reorder Links ─────────────────────────────────────────────────────────────
export async function reorderLinks(ids: string[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await Promise.all(
      ids.map((id, order) =>
        prisma.link.updateMany({ where: { id, userId: session.user!.id }, data: { order } })
      )
    )
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al reordenar." }
  }
}

// ─── Carousel Photos ───────────────────────────────────────────────────────────
export async function addCarouselPhoto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const imageUrl = formData.get("imageUrl") as string
  const caption  = (formData.get("caption") as string) || null

  if (!imageUrl) return { error: "Imagen requerida" }

  try {
    await prisma.carouselPhoto.create({
      data: { imageUrl, caption, userId: session.user.id },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al agregar foto." }
  }
}

export async function deleteCarouselPhoto(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.carouselPhoto.delete({ where: { id, userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al borrar foto." }
  }
}

// ─── Booking Config ────────────────────────────────────────────────────────────
export async function saveBookingConfig(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const title         = (formData.get("title") as string) || "Reservá una reunión"
  const startTime     = (formData.get("startTime") as string) || "09:00"
  const endTime       = (formData.get("endTime") as string) || "17:00"
  const slotDuration  = parseInt(formData.get("slotDuration") as string) || 60
  const days          = formData.getAll("days") as string[]

  try {
    await prisma.bookingConfig.upsert({
      where: { userId: session.user.id },
      create: {
        title, startTime, endTime, slotDuration,
        availableDays: JSON.stringify(days),
        userId: session.user.id,
      },
      update: { title, startTime, endTime, slotDuration, availableDays: JSON.stringify(days) },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al guardar configuración de agenda." }
  }
}

export async function deleteBookingConfig() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.bookingConfig.delete({ where: { userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "No se encontró una agenda activa para eliminar." }
  }
}

export async function updateBookingStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.booking.update({ where: { id }, data: { status } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al actualizar reserva." }
  }
}

export async function deleteBooking(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.booking.delete({ where: { id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al eliminar reserva." }
  }
}

// ─── Contact Message ───────────────────────────────────────────────────────────
export async function sendContactMessage(formData: FormData) {
  const username = formData.get("username") as string
  const name     = (formData.get("name") as string) || null
  const email    = (formData.get("email") as string) || null
  const phone    = (formData.get("phone") as string) || null
  const message  = (formData.get("message") as string) || null

  if (!name && !email && !phone && !message) return { error: "Formulario vacío." }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return { error: "Usuario no encontrado." }

  try {
    await prisma.contactMessage.create({
      data: { name, email, phone, message, userId: user.id },
    })
    return { success: true }
  } catch {
    return { error: "Error al enviar mensaje." }
  }
}

export async function deleteContactMessage(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.contactMessage.delete({ where: { id, userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al eliminar el mensaje." }
  }
}
