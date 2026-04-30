export type PlanId = 'free' | 'pro' | 'team'

// ── Precios base (ARS) ────────────────────────────────────────────────────────
export const PLAN_PRICES: Record<PlanId, number> = {
  free: 0,
  pro: 3999,
  team: 6999,
}

export const TEAM_EXTRA_PROFILE_PRICE = 999
export const TEAM_BASE_PROFILES = 6
export const NFC_CARD_PRICE = 44999
export const NFC_PRO_BONUS_DAYS = 60

export const FREE_LINK_LIMIT = 3

// ── Descuentos Team (ordenados de mayor a menor para que se aplique el primero que matchee) ──
const TEAM_DISCOUNTS: { minProfiles: number; pct: number }[] = [
  { minProfiles: 40, pct: 0.20 },
  { minProfiles: 30, pct: 0.10 },
  { minProfiles: 20, pct: 0.05 },
]

export interface TeamPricing {
  profileCount: number
  subtotal: number
  discountPct: number
  discountAmount: number
  total: number
}

export function calculateTeamPrice(profileCount: number): TeamPricing {
  const count = Math.max(TEAM_BASE_PROFILES, profileCount)
  const extras = count - TEAM_BASE_PROFILES
  const subtotal = PLAN_PRICES.team + extras * TEAM_EXTRA_PROFILE_PRICE
  const discountPct = TEAM_DISCOUNTS.find(d => count >= d.minProfiles)?.pct ?? 0
  const discountAmount = Math.round(subtotal * discountPct)
  return {
    profileCount: count,
    subtotal,
    discountPct,
    discountAmount,
    total: subtotal - discountAmount,
  }
}

// ── Plan efectivo: el NFC bonus puede promover a Pro temporariamente ──────────
type PlanUser = {
  plan: string
  planExpiresAt: Date | null
  nfcProBonusUntil: Date | null
}

export function getEffectivePlan(user: PlanUser): PlanId {
  const now = new Date()

  // NFC bonus otorga Pro sin importar el plan actual
  if (user.nfcProBonusUntil && user.nfcProBonusUntil > now) return 'pro'

  // Plan pago vencido → cae a free
  if (user.plan !== 'free' && user.planExpiresAt && user.planExpiresAt <= now) return 'free'

  return user.plan as PlanId
}

export function getNfcBonusStatus(user: PlanUser): {
  active: boolean
  daysLeft: number
  expiresAt: Date | null
} {
  if (!user.nfcProBonusUntil) return { active: false, daysLeft: 0, expiresAt: null }
  const now = new Date()
  const active = user.nfcProBonusUntil > now
  const daysLeft = active
    ? Math.ceil((user.nfcProBonusUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  return { active, daysLeft, expiresAt: user.nfcProBonusUntil }
}

// ── Feature gates ─────────────────────────────────────────────────────────────
export function canAddLink(effectivePlan: PlanId, currentLinkCount: number): boolean {
  if (effectivePlan === 'free') return currentLinkCount < FREE_LINK_LIMIT
  return true
}

export function planHasStats(effectivePlan: PlanId): boolean {
  return effectivePlan !== 'free'
}

export function planHasColorCustomization(effectivePlan: PlanId): boolean {
  return effectivePlan !== 'free'
}

export function planShowsWatermark(effectivePlan: PlanId): boolean {
  return effectivePlan === 'free'
}

// ── Metadata de planes para mostrar en UI ────────────────────────────────────
export const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  team: 'Team',
}

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    '1 perfil',
    'Nombre y foto',
    'Hasta 3 links + WhatsApp',
    'Marca de agua Cloudinf',
    'Sin estadísticas',
    'Sin personalización de colores',
  ],
  pro: [
    '1 perfil',
    'Links ilimitados',
    'Todas las redes sociales',
    'Estadísticas de visitas',
    'Personalización básica de colores',
    'Sin marca de agua',
    '2 meses gratis al activar tarjeta NFC',
  ],
  team: [
    `${TEAM_BASE_PROFILES} perfiles incluidos`,
    `Perfiles adicionales $${TEAM_EXTRA_PROFILE_PRICE.toLocaleString('es-AR')}/mes c/u`,
    '5% dto. desde 20 perfiles',
    '10% dto. desde 30 perfiles',
    '20% dto. desde 40 perfiles',
    'Panel de administración',
    'Todo lo incluido en Pro',
  ],
}
