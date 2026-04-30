"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getAdminSession } from "@/lib/admin"
import { revalidatePath } from "next/cache"
import { rateLimit } from "@/lib/ratelimit"
import { headers } from "next/headers"

export type CouponContext = "nfc" | "subscription"

export type CouponValidResult = {
  valid: true
  code: string
  discountPct: number
  appliesTo: string
  description: string | null
}

export type CouponInvalidResult = {
  valid: false
  error: string
}

export type ValidateCouponResult = CouponValidResult | CouponInvalidResult

// ─── Validar cupón (sin registrar uso) ────────────────────────────────────────
export async function validateCoupon(
  code: string,
  context: CouponContext
): Promise<ValidateCouponResult> {
  // Rate limit: 10 intentos de validación por IP cada 15 minutos
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!rateLimit(`coupon-validate:${ip}`, 10, 15 * 60 * 1000)) {
    return { valid: false, error: "Demasiados intentos. Esperá 15 minutos e intentá de nuevo." }
  }

  const normalized = code.trim().toUpperCase()
  if (!normalized) return { valid: false, error: "Ingresá un código de cupón." }

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })

  if (!coupon) return { valid: false, error: "El código no existe." }
  if (!coupon.active) return { valid: false, error: "Este cupón está desactivado." }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "Este cupón ya venció." }
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "Este cupón alcanzó su límite de usos." }
  }
  if (coupon.appliesTo !== "all" && coupon.appliesTo !== context) {
    const label = coupon.appliesTo === "nfc" ? "la tarjeta NFC" : "suscripciones"
    return { valid: false, error: `Este cupón solo aplica a ${label}.` }
  }

  return {
    valid: true,
    code: coupon.code,
    discountPct: coupon.discountPct,
    appliesTo: coupon.appliesTo,
    description: coupon.description,
  }
}

// ─── Canjear cupón (registra uso y decrementa disponibilidad) ─────────────────
export async function redeemCoupon(
  code: string,
  context: CouponContext
): Promise<{ success: true; discountPct: number } | { success: false; error: string }> {
  // Rate limit más estricto para canjes: 5 por IP cada 15 minutos
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!rateLimit(`coupon-redeem:${ip}`, 5, 15 * 60 * 1000)) {
    return { success: false, error: "Demasiados intentos de canje. Esperá 15 minutos." }
  }

  const validation = await validateCoupon(code, context)
  if (!validation.valid) return { success: false, error: validation.error }

  const session = await auth()
  const userId = session?.user?.id ?? null

  try {
    await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { code: validation.code } })
      if (!coupon || !coupon.active) throw new Error("Cupón inválido")
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        throw new Error("Sin usos disponibles")

      await tx.coupon.update({
        where: { code: validation.code },
        data: { usedCount: { increment: 1 } },
      })
      await tx.couponUsage.create({
        data: { couponId: coupon.id, userId, context },
      })
    })

    return { success: true, discountPct: validation.discountPct }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al canjear cupón."
    return { success: false, error: msg }
  }
}

// ─── Admin: listar cupones ────────────────────────────────────────────────────
export async function adminListCoupons() {
  if (!(await getAdminSession())) return { error: "No autorizado." }
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  })
  return { coupons }
}

// ─── Admin: crear cupón ───────────────────────────────────────────────────────
export async function adminCreateCoupon(formData: FormData) {
  if (!(await getAdminSession())) return { error: "No autorizado." }

  const code = (formData.get("code") as string)?.trim().toUpperCase()
  const discountPct = parseInt(formData.get("discountPct") as string)
  const maxUsesRaw = (formData.get("maxUses") as string)?.trim()
  const expiresAtRaw = (formData.get("expiresAt") as string)?.trim()
  const appliesTo = (formData.get("appliesTo") as string) || "all"
  const description = (formData.get("description") as string)?.trim() || null
  const active = formData.get("active") !== "false"

  if (!code || code.length < 3) return { error: "El código debe tener al menos 3 caracteres." }
  if (!/^[A-Z0-9_-]+$/.test(code)) return { error: "Solo letras mayúsculas, números, guiones y guiones bajos." }
  if (isNaN(discountPct) || discountPct < 1 || discountPct > 100)
    return { error: "El descuento debe ser entre 1 y 100." }
  if (!["nfc", "subscription", "all"].includes(appliesTo))
    return { error: "Aplica a: 'nfc', 'subscription' o 'all'." }

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw) : null
  if (maxUsesRaw && (isNaN(maxUses!) || maxUses! < 1))
    return { error: "El límite de usos debe ser un número positivo." }

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
  if (expiresAtRaw && isNaN(expiresAt!.getTime()))
    return { error: "Fecha de vencimiento inválida." }

  const existing = await prisma.coupon.findUnique({ where: { code } })
  if (existing) return { error: "Ya existe un cupón con ese código." }

  try {
    const coupon = await prisma.coupon.create({
      data: { code, discountPct, maxUses, expiresAt, appliesTo, description, active },
    })
    revalidatePath("/admin/coupons")
    return { success: true, coupon }
  } catch {
    return { error: "Error al crear cupón." }
  }
}

// ─── Admin: editar cupón ──────────────────────────────────────────────────────
export async function adminUpdateCoupon(id: string, formData: FormData) {
  if (!(await getAdminSession())) return { error: "No autorizado." }

  const discountPct = parseInt(formData.get("discountPct") as string)
  const maxUsesRaw = (formData.get("maxUses") as string)?.trim()
  const expiresAtRaw = (formData.get("expiresAt") as string)?.trim()
  const appliesTo = (formData.get("appliesTo") as string) || "all"
  const description = (formData.get("description") as string)?.trim() || null
  const active = formData.get("active") === "true"

  if (isNaN(discountPct) || discountPct < 1 || discountPct > 100)
    return { error: "El descuento debe ser entre 1 y 100." }

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw) : null
  if (maxUsesRaw && (isNaN(maxUses!) || maxUses! < 1))
    return { error: "Límite de usos inválido." }

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null

  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { discountPct, maxUses, expiresAt, appliesTo, description, active },
    })
    revalidatePath("/admin/coupons")
    return { success: true, coupon }
  } catch {
    return { error: "Error al actualizar cupón." }
  }
}

// ─── Admin: activar / desactivar ──────────────────────────────────────────────
export async function adminToggleCoupon(id: string) {
  if (!(await getAdminSession())) return { error: "No autorizado." }
  try {
    const current = await prisma.coupon.findUnique({ where: { id }, select: { active: true } })
    if (!current) return { error: "Cupón no encontrado." }
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { active: !current.active },
    })
    revalidatePath("/admin/coupons")
    return { success: true, active: coupon.active }
  } catch {
    return { error: "Error al cambiar estado." }
  }
}

// ─── Admin: eliminar cupón ────────────────────────────────────────────────────
export async function adminDeleteCoupon(id: string) {
  if (!(await getAdminSession())) return { error: "No autorizado." }
  try {
    await prisma.coupon.delete({ where: { id } })
    revalidatePath("/admin/coupons")
    return { success: true }
  } catch {
    return { error: "Error al eliminar cupón." }
  }
}
