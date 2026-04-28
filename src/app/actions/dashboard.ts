"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PLATFORMS } from "@/lib/constants"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/ratelimit"
import {
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
} from "@/lib/email"

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
        socialIconShape: (formData.get("socialIconShape") as string) || undefined,
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

// ─── Update Social Icon Style ──────────────────────────────────────────────────
export async function updateSocialIconShape(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const socialIconShape = (formData.get("socialIconShape") as string) || "rounded"
  const socialIconWidth = (formData.get("socialIconWidth") as string) || "normal"

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { socialIconShape, socialIconWidth },
      select: { username: true }
    })
    revalidatePath("/dashboard")
    if (updated.username) revalidatePath(`/${updated.username}`)
    return { success: true }
  } catch {
    return { error: "Error al actualizar la forma de botones sociales." }
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
  const customImage = (formData.get("customImage") as string) || null
  const platformData = PLATFORMS[platform] || PLATFORMS.other

  try {
    await prisma.link.create({
      data: {
        title,
        url: type === 'header' ? '#' : url,
        platform,
        displayStyle,
        type,
        customImage: displayStyle === 'button' ? customImage : null,
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

// ─── Update Link ───────────────────────────────────────────────────────────────
export async function updateLink(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const title    = formData.get("title") as string
  const url      = formData.get("url") as string
  const platform = (formData.get("platform") as string) || "other"
  const displayStyle = (formData.get("displayStyle") as string) || "auto"
  const type = (formData.get("type") as string) || "link"
  const customImage = (formData.get("customImage") as string) || null
  const platformData = PLATFORMS[platform] || PLATFORMS.other

  try {
    await prisma.link.update({
      where: { id, userId: session.user.id },
      data: {
        title,
        url: type === 'header' ? '#' : url,
        platform,
        displayStyle,
        type,
        customImage: displayStyle === 'button' ? customImage : null,
        icon: platformData.icon,
      },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al actualizar link." }
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

const VALID_BOOKING_STATUSES = ["pending", "confirmed", "cancelled"]

export async function updateBookingStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  if (!VALID_BOOKING_STATUSES.includes(status)) return { error: "Estado inválido" }
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { config: { select: { userId: true } } },
    })
    if (!booking || (booking.config as { userId: string }).userId !== session.user.id)
      return { error: "No autorizado" }
    await prisma.booking.update({ where: { id }, data: { status } })
    revalidatePath("/dashboard")

    const owner = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessConfig: { select: { businessName: true } } },
    })
    const businessName = owner?.businessConfig?.businessName || 'Cloudinf'
    if (status === 'confirmed') {
      sendBookingConfirmedEmail({ to: booking.email, name: booking.name, date: booking.date, time: booking.time, businessName }).catch(() => null)
    } else if (status === 'cancelled') {
      sendBookingCancelledEmail({ to: booking.email, name: booking.name, date: booking.date, time: booking.time, businessName }).catch(() => null)
    }

    return { success: true }
  } catch {
    return { error: "Error al actualizar reserva." }
  }
}

export async function deleteBooking(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { config: { select: { userId: true } } },
    })
    if (!booking || (booking.config as { userId: string }).userId !== session.user.id)
      return { error: "No autorizado" }
    await prisma.booking.delete({ where: { id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al eliminar reserva." }
  }
}

// ─── Contact Message ───────────────────────────────────────────────────────────
export async function sendContactMessage(formData: FormData) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!rateLimit(`contact:${ip}`, 3, 5 * 60 * 1000)) {
    return { error: "Demasiados mensajes. Intentá de nuevo en unos minutos." }
  }

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

// ─── Business Config ───────────────────────────────────────────────────────────
export async function saveBusinessConfig(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const enabled         = formData.get("enabled") === "true"
  const businessName    = (formData.get("businessName") as string) || null
  const type            = (formData.get("type") as string) || "restaurant"
  const address         = (formData.get("address") as string) || null
  const mapsUrl         = (formData.get("mapsUrl") as string) || null
  const hours           = (formData.get("hours") as string) || null
  const phone           = (formData.get("phone") as string) || null
  const menuUrl         = (formData.get("menuUrl") as string) || null
  const wifiName        = (formData.get("wifiName") as string) || null
  const wifiPassword    = (formData.get("wifiPassword") as string) || null
  const reservationsUrl = (formData.get("reservationsUrl") as string) || null

  try {
    await prisma.businessConfig.upsert({
      where: { userId: session.user.id },
      create: {
        enabled, businessName, type, address, mapsUrl, hours, phone, menuUrl, wifiName, wifiPassword, reservationsUrl,
        userId: session.user.id,
      },
      update: {
        enabled, businessName, type, address, mapsUrl, hours, phone, menuUrl, wifiName, wifiPassword, reservationsUrl,
      },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al guardar configuración de negocio." }
  }
}

export async function deleteBusinessConfig() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.businessConfig.delete({ where: { userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "No se encontró un negocio activo para eliminar." }
  }
}

// ─── Extras: Status, PDF, Out-of-Office, AFIP, Instagram, QR ──────────────────
export async function saveExtras(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const statusText = (formData.get("statusText") as string) || null
  const statusEmoji = (formData.get("statusEmoji") as string) || null
  const statusExpiresRaw = formData.get("statusExpiresAt") as string
  const statusExpiresAt = statusExpiresRaw ? new Date(statusExpiresRaw) : null

  const pdfCatalogUrl = (formData.get("pdfCatalogUrl") as string) || null
  const pdfCatalogLabel = (formData.get("pdfCatalogLabel") as string) || null

  const outOfOfficeEnabled = formData.get("outOfOfficeEnabled") === "true"
  const outOfOfficeMsg = (formData.get("outOfOfficeMsg") as string) || null

  const cuit = (formData.get("cuit") as string) || null
  const afipUrl = (formData.get("afipUrl") as string) || null

  const instagramHandle = (formData.get("instagramHandle") as string)?.replace(/^@/, "") || null
  const instagramFeedEnabled = formData.get("instagramFeedEnabled") === "true"

  const qrDynamicUrl = (formData.get("qrDynamicUrl") as string) || null

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        statusText, statusEmoji, statusExpiresAt,
        pdfCatalogUrl, pdfCatalogLabel,
        outOfOfficeEnabled, outOfOfficeMsg,
        cuit, afipUrl,
        instagramHandle, instagramFeedEnabled,
        qrDynamicUrl,
      },
      select: { username: true },
    })
    revalidatePath("/dashboard")
    if (updated.username) revalidatePath(`/${updated.username}`)
    return { success: true }
  } catch {
    return { error: "Error al guardar configuración." }
  }
}

export async function clearStatus() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { statusText: null, statusEmoji: null, statusExpiresAt: null },
      select: { username: true },
    })
    revalidatePath("/dashboard")
    if (updated.username) revalidatePath(`/${updated.username}`)
    return { success: true }
  } catch {
    return { error: "Error al limpiar estado." }
  }
}

// ─── Modo Campaña ──────────────────────────────────────────────────────────────
export async function saveCampaign(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const enabled = formData.get("enabled") === "true"
  const title = (formData.get("title") as string) || null
  const message = (formData.get("message") as string) || null
  const ctaLabel = (formData.get("ctaLabel") as string) || null
  const ctaUrl = (formData.get("ctaUrl") as string) || null
  const bannerUrl = (formData.get("bannerUrl") as string) || null
  const endsAtRaw = formData.get("endsAt") as string
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null

  try {
    await prisma.campaign.upsert({
      where: { userId: session.user.id },
      create: { enabled, title, message, ctaLabel, ctaUrl, bannerUrl, endsAt, userId: session.user.id },
      update: { enabled, title, message, ctaLabel, ctaUrl, bannerUrl, endsAt },
    })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    revalidatePath("/dashboard")
    if (user?.username) revalidatePath(`/${user.username}`)
    return { success: true }
  } catch {
    return { error: "Error al guardar campaña." }
  }
}

export async function deleteCampaign() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.campaign.delete({ where: { userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "No hay campaña para eliminar." }
  }
}

// ─── Equipo ────────────────────────────────────────────────────────────────────
export async function saveTeamSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  const teamEnabled = formData.get("teamEnabled") === "true"
  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { teamEnabled } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al actualizar." }
  }
}

export async function addTeamMember(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const name = formData.get("name") as string
  const role = (formData.get("role") as string) || null
  const avatarUrl = (formData.get("avatarUrl") as string) || null
  const profileUrl = (formData.get("profileUrl") as string) || null

  if (!name) return { error: "El nombre es requerido." }
  try {
    await prisma.teamMember.create({
      data: { name, role, avatarUrl, profileUrl, userId: session.user.id },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al agregar miembro." }
  }
}

export async function deleteTeamMember(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.teamMember.delete({ where: { id, userId: session.user.id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al eliminar miembro." }
  }
}

// ─── Formulario de presupuesto ─────────────────────────────────────────────────
export async function saveQuoteForm(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const enabled = formData.get("enabled") === "true"
  const title = (formData.get("title") as string) || "Pedí un presupuesto"
  const description = (formData.get("description") as string) || null
  const fieldsRaw = formData.get("fields") as string
  const fields = fieldsRaw || "[]"

  try {
    await prisma.quoteForm.upsert({
      where: { userId: session.user.id },
      create: { enabled, title, description, fields, userId: session.user.id },
      update: { enabled, title, description, fields },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al guardar formulario." }
  }
}

export async function deleteQuoteSubmission(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    const sub = await prisma.quoteSubmission.findUnique({
      where: { id },
      include: { form: { select: { userId: true } } },
    })
    if (!sub || sub.form.userId !== session.user.id) return { error: "No autorizado" }
    await prisma.quoteSubmission.delete({ where: { id } })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al eliminar." }
  }
}

export async function submitQuoteForm(formData: FormData) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!rateLimit(`quote:${ip}`, 3, 10 * 60 * 1000)) {
    return { error: "Demasiados envíos. Intentá en unos minutos." }
  }

  const username = formData.get("username") as string
  const name = (formData.get("name") as string) || null
  const email = (formData.get("email") as string) || null

  const user = await prisma.user.findUnique({
    where: { username },
    include: { quoteForm: true },
  })
  if (!user?.quoteForm?.enabled) return { error: "Formulario no disponible." }

  const fields: string[] = (() => {
    try { return JSON.parse(user.quoteForm.fields) } catch { return [] }
  })()

  const data: Record<string, string> = {}
  for (const f of fields) {
    const val = formData.get(`field_${f}`) as string
    if (val) data[f] = val
  }

  try {
    await prisma.quoteSubmission.create({
      data: {
        formId: user.quoteForm.id,
        name, email,
        data: JSON.stringify(data),
      },
    })
    return { success: true }
  } catch {
    return { error: "Error al enviar." }
  }
}

// ─── Programa de referidos ─────────────────────────────────────────────────────
export async function generateReferralCode() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const code = Math.random().toString(36).substring(2, 9).toUpperCase()
  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: { referralCode: true },
    })
    revalidatePath("/dashboard")
    return { success: true, code: updated.referralCode }
  } catch {
    return { error: "Error al generar código." }
  }
}

// ─── Dashboard de agencia ──────────────────────────────────────────────────────
export async function generateAgencyToken() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const token = Math.random().toString(36).substring(2, 18)
  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { agencyToken: token },
      select: { agencyToken: true },
    })
    revalidatePath("/dashboard")
    return { success: true, token: updated.agencyToken }
  } catch {
    return { error: "Error al generar token." }
  }
}

export async function revokeAgencyToken() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { agencyToken: null },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Error al revocar acceso." }
  }
}
