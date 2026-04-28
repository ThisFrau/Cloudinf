'use client'

import './dashboard.css'
import { useState, useRef, useTransition, useEffect } from 'react'
import {
  updateProfile, createLink, deleteLink, updateLink,
  saveBookingConfig, deleteBookingConfig, updateBookingStatus, deleteBooking,
  deleteContactMessage, saveBusinessConfig, deleteBusinessConfig, updateSocialIconShape,
  saveExtras, clearStatus,
  saveCampaign, deleteCampaign,
  addTeamMember, deleteTeamMember, saveTeamSettings,
  saveQuoteForm, deleteQuoteSubmission,
  generateReferralCode, generateAgencyToken, revokeAgencyToken,
} from '@/app/actions/dashboard'
import { PLATFORMS } from '@/lib/constants'
import Link from 'next/link'
import HoursBuilder from './_components/HoursBuilder'

// === Types ===
type LinkType = { id: string; title: string; url: string; platform: string; icon: string | null; displayStyle: string; type: string; customImage: string | null; clicks: number; order: number }
type CarouselPhotoType = { id: string; imageUrl: string; caption: string | null; order: number }
type BookingType = { id: string; name: string; email: string; date: string; time: string; note: string | null; status: string; createdAt: Date }
type BookingConfigType = { id: string; enabled: boolean; title: string; availableDays: string; startTime: string; endTime: string; slotDuration: number }
type BusinessConfigType = { id: string; enabled: boolean; businessName: string | null; type: string; address: string | null; mapsUrl: string | null; hours: string | null; phone: string | null; menuUrl: string | null; wifiName: string | null; wifiPassword: string | null; reservationsUrl: string | null; }
type ContactMessageType = { id: string; name: string | null; email: string | null; phone: string | null; message: string | null; createdAt: Date }
type CampaignType = { id: string; enabled: boolean; title: string | null; message: string | null; ctaLabel: string | null; ctaUrl: string | null; bannerUrl: string | null; endsAt: Date | null }
type TeamMemberType = { id: string; name: string; role: string | null; avatarUrl: string | null; profileUrl: string | null; order: number }
type QuoteSubmissionType = { id: string; name: string | null; email: string | null; data: string; createdAt: Date }
type QuoteFormType = { id: string; enabled: boolean; title: string; description: string | null; fields: string; submissions: QuoteSubmissionType[] }
type ReferralType = { id: string; referredEmail: string; status: string; createdAt: Date }
type ScanLogType = { id: string; source: string | null; device: string | null; createdAt: Date }
type UserType = {
  id: string; name: string | null; username: string | null; bio: string | null;
  avatarUrl: string | null; image: string | null; buttonStyle: string; socialIconShape: string; socialIconWidth: string; themeColor: string | null;
  layoutStyle: string; avatarAlign: string; bannerUrl: string | null;
  vcardEnabled: boolean; contactFormEnabled: boolean;
  contactFormAskName: boolean; contactFormAskEmail: boolean; contactFormAskPhone: boolean; contactFormAskMessage: boolean;
  seoTitle: string | null; seoDescription: string | null;
  bgType: string; bgColor: string | null; bgGradient1: string | null; bgGradient2: string | null;
  bgGradientDir: string | null; bgImageUrl: string | null;
  translateEnabled: boolean; spotifyProfileUrl: string | null; carouselEnabled: boolean;
  // Plus/Premium extras
  statusText: string | null; statusEmoji: string | null; statusExpiresAt: Date | null;
  pdfCatalogUrl: string | null; pdfCatalogLabel: string | null;
  outOfOfficeEnabled: boolean; outOfOfficeMsg: string | null;
  cuit: string | null; afipUrl: string | null;
  instagramHandle: string | null; instagramFeedEnabled: boolean;
  qrDynamicUrl: string | null;
  teamEnabled: boolean;
  referralCode: string | null;
  agencyToken: string | null;
  links: LinkType[]; carouselPhotos: CarouselPhotoType[];
  bookingConfig: BookingConfigType | null;
  businessConfig: BusinessConfigType | null;
  contactMessages: ContactMessageType[];
  campaign: CampaignType | null;
  teamMembers: TeamMemberType[];
  quoteForm: QuoteFormType | null;
  referrals: ReferralType[];
}

const DAYS = [
  { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' }, { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

type StatsType = { profileViews: number; totalClicks: number; bookingsThisWeek: number; messagesThisMonth: number }

/** Renders a progress bar whose width is set via DOM ref — no inline style in JSX */
function StatBar({ pct }: { pct: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${pct}%`
  }, [pct])
  return <div ref={barRef} className="stat-bar" />
}

export default function DashboardClient({
  user, signOutAction, bookings, stats, scanLogs,
}: {
  user: UserType;
  signOutAction: () => Promise<void>;
  bookings: BookingType[];
  stats: StatsType;
  scanLogs: ScanLogType[];
}) {
  const [activeTab, setActiveTab] = useState<'profile'|'links'|'business'|'booking'|'inbox'|'stats'>('profile')
  const [showPreview, setShowPreview] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatarUrl || user.image || '')
  const [profileMsg, setProfileMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [linkMsg, setLinkMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [businessMsg, setBusinessMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [bookingMsg, setBookingMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp')
  const [bgType, setBgType] = useState(user.bgType || 'default')
  const [showQR, setShowQR] = useState(false)
  const [qrMode, setQrMode] = useState<'profile' | 'custom'>(user.qrDynamicUrl ? 'custom' : 'profile')
  const [contactFormEnabled, setContactFormEnabled] = useState(user.contactFormEnabled)
  const [iconShape, setIconShape] = useState(user.socialIconShape || 'rounded')
  const [iconWidth, setIconWidth] = useState(user.socialIconWidth || 'normal')
  const [isPending, startTransition] = useTransition()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Link editing state
  const [editingLink, setEditingLink] = useState<LinkType | null>(null)
  const [selectedDisplayStyle, setSelectedDisplayStyle] = useState('auto')
  const [customImagePreview, setCustomImagePreview] = useState<string>('')
  const customImageRef = useRef<HTMLInputElement>(null)

  // Herramientas tab state
  const [extrasMsg, setExtrasMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [campaignMsg, setCampaignMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [teamMsg, setTeamMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [quoteMsg, setQuoteMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [quoteFields, setQuoteFields] = useState<string[]>(() => {
    try { return JSON.parse(user.quoteForm?.fields || '[]') } catch { return [] }
  })
  const [newField, setNewField] = useState('')
  const [referralCode, setReferralCode] = useState<string>(user.referralCode || '')
  const [agencyToken, setAgencyToken] = useState<string>(user.agencyToken || '')
  const teamAvatarRef = useRef<HTMLInputElement>(null)
  const [teamAvatarPreview, setTeamAvatarPreview] = useState<string>('')
  const campaignBannerRef = useRef<HTMLInputElement>(null)
  const [campaignBannerPreview, setCampaignBannerPreview] = useState<string>(user.campaign?.bannerUrl || '')

  // Image upload state
  const [bgImagePreview, setBgImagePreview] = useState<string>(user.bgImageUrl || '')
  const [bannerPreview, setBannerPreview] = useState<string>(user.bannerUrl || '')
  const [menuPreview, setMenuPreview] = useState<string>('')
  const bgImageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const menuInputRef = useRef<HTMLInputElement>(null)

  // Fluid tabs sliding animation state
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [sliderStyle, setSliderStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 })

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector('.tab-active-marker') as HTMLElement
      if (activeEl) {
        setSliderStyle({
          left: activeEl.offsetLeft,
          top: activeEl.offsetTop,
          width: activeEl.offsetWidth,
          height: activeEl.offsetHeight,
          opacity: 1
        })
      }
    }
  }, [activeTab])

  const activeDays: string[] = (() => {
    try { return JSON.parse(user.bookingConfig?.availableDays || '["mon","tue","wed","thu","fri"]') } catch { return ['mon','tue','wed','thu','fri'] }
  })()
  const [selectedDays, setSelectedDays] = useState<string[]>(activeDays)

  function readFileAsDataURL(file: File, maxMB: number, onSuccess: (url: string) => void, onError: (msg: string) => void) {
    if (file.size > maxMB * 1024 * 1024) { onError(`La imagen debe pesar menos de ${maxMB}MB.`); return }
    const reader = new FileReader()
    reader.onload = () => onSuccess(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataURL(file, 2, setAvatarPreview, (msg) => setProfileMsg({ ok: false, text: msg }))
  }

  function handleBgImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataURL(file, 5, setBgImagePreview, (msg) => setProfileMsg({ ok: false, text: msg }))
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataURL(file, 4, setBannerPreview, (msg) => setProfileMsg({ ok: false, text: msg }))
  }

  function handleMenuFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataURL(file, 4, setMenuPreview, (msg) => setBusinessMsg({ ok: false, text: msg }))
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setProfileMsg(null)
    const fd = new FormData(e.currentTarget)
    if (avatarPreview) fd.set('avatarUrl', avatarPreview)
    if (bgImagePreview) fd.set('bgImageUrl', bgImagePreview)
    if (bannerPreview) fd.set('bannerUrl', bannerPreview)
    startTransition(async () => {
      const result = await updateProfile(fd)
      if (result?.error) setProfileMsg({ ok: false, text: result.error })
      else setProfileMsg({ ok: true, text: '✅ Perfil guardado.' })
    })
  }

  async function handleAddLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLinkMsg(null)
    const fd = new FormData(e.currentTarget)
    if (customImagePreview) fd.set('customImage', customImagePreview)
    startTransition(async () => {
      const result = await createLink(fd)
      if (result?.error) setLinkMsg({ ok: false, text: result.error })
      else {
        setLinkMsg({ ok: true, text: '✅ Enlace añadido.' })
        ;(e.target as HTMLFormElement).reset()
        setSelectedPlatform('whatsapp')
        setSelectedDisplayStyle('auto')
        setCustomImagePreview('')
      }
    })
  }

  async function handleUpdateLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLinkMsg(null)
    const fd = new FormData(e.currentTarget)
    if (customImagePreview) fd.set('customImage', customImagePreview)
    startTransition(async () => {
      if (!editingLink) return
      const result = await updateLink(editingLink.id, fd)
      if (result?.error) setLinkMsg({ ok: false, text: result.error })
      else {
        setLinkMsg({ ok: true, text: '✅ Enlace actualizado.' })
        setEditingLink(null)
        setSelectedPlatform('whatsapp')
        setSelectedDisplayStyle('auto')
        setCustomImagePreview('')
      }
    })
  }

  function handleEditLink(link: LinkType) {
    setEditingLink(link)
    setSelectedPlatform(link.platform)
    setSelectedDisplayStyle(link.displayStyle)
    setCustomImagePreview(link.customImage || '')
    const container = document.querySelector('.add-link-form')
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function cancelEditLink() {
    setEditingLink(null)
    setSelectedPlatform('whatsapp')
    setSelectedDisplayStyle('auto')
    setCustomImagePreview('')
    setLinkMsg(null)
  }

  async function handleDeleteLink(id: string) {
    startTransition(async () => { await deleteLink(id) })
  }

  async function handleUpdateIconShape(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLinkMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateSocialIconShape(fd)
      if (result?.error) setLinkMsg({ ok: false, text: result.error })
      else setLinkMsg({ ok: true, text: '✅ Forma de logos guardada.' })
    })
  }

  async function handleSaveBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBookingMsg(null)
    const fd = new FormData(e.currentTarget)
    selectedDays.forEach(d => fd.append('days', d))
    startTransition(async () => {
      const result = await saveBookingConfig(fd)
      if (result?.error) setBookingMsg({ ok: false, text: result.error })
      else setBookingMsg({ ok: true, text: '✅ Agenda guardada.' })
    })
  }

  async function handleBookingStatus(id: string, status: string) {
    startTransition(async () => { await updateBookingStatus(id, status) })
  }

  async function handleDeleteBooking(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
      startTransition(async () => { await deleteBooking(id) })
    }
  }

  async function handleDeleteMessage(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
      startTransition(async () => { await deleteContactMessage(id) })
    }
  }

  async function handleDeleteBookingConfig() {
    if (confirm('¿Eliminar la agenda? Esto también borrará todas las reservas activas.')) {
      startTransition(async () => { await deleteBookingConfig() })
    }
  }

  async function handleSaveBusiness(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusinessMsg(null)
    const fd = new FormData(e.currentTarget)
    if (menuPreview) fd.set('menuUrl', menuPreview)
    startTransition(async () => {
      const result = await saveBusinessConfig(fd)
      if (result?.error) setBusinessMsg({ ok: false, text: result.error })
      else setBusinessMsg({ ok: true, text: '✅ Configuración guardada.' })
    })
  }

  async function handleDeleteBusinessConfig() {
    if (confirm('¿Desactivar y borrar la configuración de tu negocio?')) {
      startTransition(async () => { await deleteBusinessConfig() })
    }
  }

  const currentPlatform = PLATFORMS[selectedPlatform] || PLATFORMS.other
  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: 'fa-user', cls: 'tab-profile' },
    { id: 'links', label: 'Mis Links', icon: 'fa-link', cls: 'tab-links' },
    { id: 'business', label: 'Mi Negocio', icon: 'fa-store', cls: 'tab-business' },
    { id: 'booking', label: 'Agenda', icon: 'fa-calendar', cls: 'tab-booking' },
    { id: 'inbox', label: 'Mensajes', icon: 'fa-envelope', cls: 'tab-inbox' },
    { id: 'stats', label: 'Estadísticas', icon: 'fa-chart-simple', cls: 'tab-stats' },
  ] as const

  return (
    <main className="container max-w-1000">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="name">Panel de {user.username}</h1>
        <div className="dashboard-actions dashboard-actions-row flex-wrap-center">
          <button type="button" aria-label="Mostrar código QR" title="Mostrar código QR" onClick={() => setShowQR(true)} className="btn-secondary-sm">
            <i className="fa-solid fa-qrcode"></i>
          </button>
          <button type="button" aria-label="Vista previa del perfil" title="Vista previa del perfil" onClick={() => setShowPreview(true)} className="btn-secondary-sm">
            <i className="fa-solid fa-mobile-screen"></i>
          </button>
          <Link href="/tienda" className="btn-store btn-auto-width" title="Ir a la Tienda NFC">
            <i className="fa-solid fa-store"></i>
            <span>Tienda</span>
          </Link>
          <Link href={`/${user.username}`} target="_blank" className="btn-primary text-none-pad btn-auto-width">
            Ver Perfil
          </Link>
          <form action={signOutAction} className="form-inline">
            <button type="submit" className="btn-danger btn-auto-width">Salir</button>
          </form>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-content text-center" onClick={e => e.stopPropagation()}>
            <h2 className="mb-1rem">Tu Código QR</h2>
            <p className="bio mb-1rem">Este QR siempre es el mismo — el destino se cambia desde <strong>Mi Perfil</strong>.</p>
            <div className="qr-box mb-1rem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="qr-img"
                crossOrigin="anonymous"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=000000&bgcolor=ffffff&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/qr/${user.username}`)}`}
                alt="QR Code" width="250" height="250"
              />
            </div>
            <div className="qr-download-btns mb-1rem">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const img = document.getElementById('qr-img') as HTMLImageElement
                  const canvas = document.createElement('canvas')
                  canvas.width = 400; canvas.height = 400
                  const ctx = canvas.getContext('2d')
                  if (!ctx || !img) return
                  ctx.fillStyle = '#ffffff'
                  ctx.fillRect(0, 0, 400, 400)
                  ctx.drawImage(img, 0, 0, 400, 400)
                  const a = document.createElement('a')
                  a.href = canvas.toDataURL('image/png')
                  a.download = `qr-${user.username}.png`
                  a.click()
                }}
              >
                <i className="fa-solid fa-download mr-4px"></i> PNG
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const img = document.getElementById('qr-img') as HTMLImageElement
                  const canvas = document.createElement('canvas')
                  canvas.width = 400; canvas.height = 400
                  const ctx = canvas.getContext('2d')
                  if (!ctx || !img) return
                  ctx.fillStyle = '#ffffff'
                  ctx.fillRect(0, 0, 400, 400)
                  ctx.drawImage(img, 0, 0, 400, 400)
                  const a = document.createElement('a')
                  a.href = canvas.toDataURL('image/jpeg', 0.95)
                  a.download = `qr-${user.username}.jpg`
                  a.click()
                }}
              >
                <i className="fa-solid fa-download mr-4px"></i> JPG
              </button>
            </div>
            <button type="button" className="btn-danger w-full" onClick={() => setShowQR(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h2>Vista Previa del Perfil</h2>
              <button type="button" aria-label="Cerrar vista previa" title="Cerrar" className="btn-danger" onClick={() => setShowPreview(false)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="preview-phone-frame">
              <iframe
                src={`/${user.username}`}
                title="Vista previa del perfil"
                className="preview-iframe"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .tab-slider-dynamic {
            left: ${sliderStyle.left}px;
            top: ${sliderStyle.top}px;
            width: ${sliderStyle.width}px;
            height: ${sliderStyle.height}px;
            opacity: ${sliderStyle.opacity};
            transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
          }
        `
      }} />
      <div className="dashboard-tabs" ref={tabsContainerRef}>
        <div className="tab-slider tab-slider-dynamic" />
        {tabs.map(tab => (
          <button
            key={tab.id}
            aria-label={tab.label}
            title={tab.label}
            className={`tab-btn ${tab.cls} ${activeTab === tab.id ? 'tab-active-marker' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-tab-content">

        {/* ══════════════ TAB: MI PERFIL ══════════════ */}
        {activeTab === 'profile' && (
          <>
          <div className="dashboard-grid-2">
            <div>
            <div className="form-container">
              <h2 className="mb-1rem">Tus Datos</h2>
              <form onSubmit={handleProfileSubmit}>
                {/* Avatar */}
                <div className="avatar-upload-section">
                  <div className="avatar-upload-preview" onClick={() => avatarInputRef.current?.click()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="avatar-upload-img" />
                    <div className="avatar-upload-overlay"><i className="fa-solid fa-camera"></i><span>Cambiar foto</span></div>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} hidden title="Subir foto" />
                  <p className="avatar-hint">
                    Haz clic para subir desde tu dispositivo<br />
                    <small className="opacity-70">Recomendado: 500x500 px (Formato 1:1)</small>
                  </p>
                </div>

                <div className="input-group">
                  <label htmlFor="name">Nombre</label>
                  <input id="name" name="name" type="text" defaultValue={user.name || ''} placeholder="Tu Nombre" required />
                </div>
                <div className="input-group">
                  <label htmlFor="bio">Biografía</label>
                  <textarea id="bio" name="bio" rows={3} defaultValue={user.bio || ''} placeholder="Ej. Desarrollador Web | Creador Digital" />
                </div>
                <div className="input-group">
                  <label htmlFor="username">Username público</label>
                  <input id="username" name="username" type="text" defaultValue={user.username || ''} placeholder="ej. juanperez" />
                </div>

                {profileMsg && <p className={profileMsg.ok ? 'text-success' : 'text-error'}>{profileMsg.text}</p>}
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Datos'}</button>
              </form>
            </div>

            {/* ── QR Dinámico ─────────────────────────────────────────────── */}
            <div className="form-container mt-1rem">
              <h2 className="mb-05rem">QR Dinámico <span className="plan-badge-premium">PREMIUM</span></h2>
              <p className="bio mb-1rem">
                Tu QR siempre es el mismo y nunca cambia — podés pegarlo en cualquier lado.
                Solo cambia el destino al que redirige.
              </p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                if (qrMode === 'profile') fd.set('qrDynamicUrl', '')
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ Destino del QR actualizado.' })
                })
              }}>
                <input type="hidden" name="statusText" value={user.statusText || ''} />
                <input type="hidden" name="statusEmoji" value={user.statusEmoji || ''} />
                <input type="hidden" name="statusExpiresAt" value={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                <input type="hidden" name="pdfCatalogUrl" value={user.pdfCatalogUrl || ''} />
                <input type="hidden" name="pdfCatalogLabel" value={user.pdfCatalogLabel || ''} />
                <input type="hidden" name="outOfOfficeEnabled" value={String(user.outOfOfficeEnabled)} />
                <input type="hidden" name="outOfOfficeMsg" value={user.outOfOfficeMsg || ''} />
                <input type="hidden" name="cuit" value={user.cuit || ''} />
                <input type="hidden" name="afipUrl" value={user.afipUrl || ''} />
                <input type="hidden" name="instagramHandle" value={user.instagramHandle || ''} />
                <input type="hidden" name="instagramFeedEnabled" value={String(user.instagramFeedEnabled)} />

                <div className="input-group mb-1rem">
                  <label>¿A dónde redirige tu QR?</label>
                </div>
                <div className="qr-mode-picker">
                  <button type="button" className={`qr-mode-option${qrMode === 'profile' ? ' qr-mode-selected' : ''}`} onClick={() => setQrMode('profile')}>
                    <i className="fa-solid fa-user" />
                    Mi perfil
                  </button>
                  <button type="button" className={`qr-mode-option${qrMode === 'custom' ? ' qr-mode-selected' : ''}`} onClick={() => setQrMode('custom')}>
                    <i className="fa-solid fa-link" />
                    URL personalizada
                  </button>
                </div>

                {qrMode === 'custom' && (
                  <div className="input-group">
                    <label htmlFor="qrDynamicUrl">URL de destino</label>
                    <input id="qrDynamicUrl" name="qrDynamicUrl" type="url" defaultValue={user.qrDynamicUrl || ''} placeholder="https://..." />
                  </div>
                )}
                {qrMode === 'profile' && (
                  <input type="hidden" name="qrDynamicUrl" value="" />
                )}

                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar Destino QR</button>
              </form>
            </div>
            </div>

            <div className="form-container">
              <h2 className="mb-1rem">Apariencia & Extras</h2>
              <form onSubmit={handleProfileSubmit}>
                {/* Hidden fields to preserve basic data */}
                <input type="hidden" name="name" value={user.name || ''} />
                <input type="hidden" name="bio" value={user.bio || ''} />
                <input type="hidden" name="username" value={user.username || ''} />

                <div className="section-divider"><span>Diseño Visual</span></div>

                <div className="input-group">
                  <label>Banner de Portada</label>
                  <div
                    className="bg-image-picker"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerPreview} alt="Banner" className="image-picker-preview image-cover" />
                    )}
                    {bannerPreview
                      ? <div className="bg-image-overlay"><i className="fa-solid fa-pencil"></i><span>Cambiar banner</span></div>
                      : <div className="bg-image-placeholder"><i className="fa-solid fa-image"></i><span>Subir banner</span></div>
                    }
                  </div>
                  <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerFileChange} hidden title="Subir banner de portada" />
                  <p className="avatar-hint mt-05rem text-center w-full">
                    <small className="opacity-70">Recomendado: 1200x400 px (Formato panorámico)</small>
                  </p>
                  {bannerPreview && (
                    <button type="button" className="btn-danger btn-remove-image mt-05rem" onClick={() => setBannerPreview('')}>
                      <i className="fa-solid fa-trash mr-4px"></i> Quitar banner
                    </button>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="avatarAlign">Posición de Foto (Avatar)</label>
                  <select id="avatarAlign" name="avatarAlign" className="platform-select text-black" defaultValue={user.avatarAlign || 'center'}>
                    <option value="left">Alineado a la Izquierda</option>
                    <option value="center">Centrado (Por Defecto)</option>
                    <option value="right">Alineado a la Derecha</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="layoutStyle">Diseño del Perfil</label>
                  <select id="layoutStyle" name="layoutStyle" className="platform-select text-black" defaultValue={user.layoutStyle || 'list'}>
                    <option value="list">Lista Clásica</option>
                    <option value="bento">Grilla Bento</option>
                    <option value="cards">Tarjetas Deslizables</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="buttonStyle">Estilo de Botones</label>
                  <select id="buttonStyle" name="buttonStyle" className="platform-select text-black" defaultValue={user.buttonStyle || 'default'}>
                    <option value="default">Cristal Frosted</option>
                    <option value="liquid_glass">Liquid Glass</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="themeColor">Color de Resplandor</label>
                  <div className="color-picker-wrapper">
                    <input id="themeColor" name="themeColor" type="color" className="color-picker-input" defaultValue={user.themeColor || '#A855F7'} />
                    <span className="bio text-sm">Color de luz en botones</span>
                  </div>
                </div>

                <div className="section-divider"><span>Fondo del Perfil</span></div>
                <div className="input-group">
                  <label htmlFor="bgType">Tipo de Fondo</label>
                  <select id="bgType" name="bgType" className="platform-select text-black" value={bgType} onChange={e => setBgType(e.target.value)}>
                    <option value="default">Por defecto (Oscuro)</option>
                    <option value="solid">Color Sólido</option>
                    <option value="gradient">Degradado</option>
                    <option value="image">Imagen de fondo</option>
                  </select>
                </div>
                {bgType === 'solid' && (
                  <div className="input-group">
                    <label htmlFor="bgColor">Color de Fondo</label>
                    <input id="bgColor" name="bgColor" type="color" className="color-picker-input" defaultValue={user.bgColor || '#0B0E14'} />
                  </div>
                )}
                {bgType === 'gradient' && (
                  <>
                    <div className="input-group">
                      <label>Colores del Degradado</label>
                      <div className="color-picker-wrapper">
                        <input name="bgGradient1" type="color" title="Color degradado 1" aria-label="Color degradado 1" className="color-picker-input" defaultValue={user.bgGradient1 || '#A855F7'} />
                        <input name="bgGradient2" type="color" title="Color degradado 2" aria-label="Color degradado 2" className="color-picker-input" defaultValue={user.bgGradient2 || '#EC4899'} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="bgGradientDir">Dirección</label>
                      <select id="bgGradientDir" name="bgGradientDir" className="platform-select text-black" defaultValue={user.bgGradientDir || '135deg'}>
                        <option value="to bottom">↓ Vertical</option>
                        <option value="to right">→ Horizontal</option>
                        <option value="135deg">↘ Diagonal</option>
                        <option value="to top right">↗ Diagonal inversa</option>
                      </select>
                    </div>
                  </>
                )}
                {bgType === 'image' && (
                  <div className="input-group">
                    <label>Imagen de Fondo</label>
                    <div
                      className="bg-image-picker"
                      onClick={() => bgImageInputRef.current?.click()}
                    >
                      {bgImagePreview && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={bgImagePreview} alt="Fondo" className="image-picker-preview" />
                      )}
                      {bgImagePreview
                        ? <div className="bg-image-overlay"><i className="fa-solid fa-pencil"></i><span>Cambiar</span></div>
                        : <div className="bg-image-placeholder"><i className="fa-solid fa-image"></i><span>Subir imagen de fondo</span></div>
                      }
                    </div>
                    <input ref={bgImageInputRef} type="file" accept="image/*" onChange={handleBgImageFileChange} hidden title="Subir imagen de fondo" />
                    <p className="avatar-hint mt-05rem text-center w-full">
                      <small className="opacity-70">Recomendado: 1080x1920 px (Formato retrato)</small>
                    </p>
                    {bgImagePreview && (
                      <button type="button" className="btn-danger btn-remove-image" onClick={() => setBgImagePreview('')}>
                        <i className="fa-solid fa-trash mr-4px"></i> Quitar imagen
                      </button>
                    )}
                  </div>
                )}

                <div className="section-divider"><span>SEO</span></div>
                <div className="input-group">
                  <label htmlFor="seoTitle">Título de la Página</label>
                  <input id="seoTitle" name="seoTitle" type="text" defaultValue={user.seoTitle || ''} placeholder="Ej. Juan Pérez | Portafolio" />
                </div>
                <div className="input-group">
                  <label htmlFor="seoDescription">Descripción</label>
                  <input id="seoDescription" name="seoDescription" type="text" defaultValue={user.seoDescription || ''} placeholder="Para Google y WhatsApp" />
                </div>

                <div className="section-divider"><span>Integraciones</span></div>
                <div className="input-group">
                  <label htmlFor="spotifyProfileUrl">URL de Perfil de Spotify (artista/playlist)</label>
                  <input id="spotifyProfileUrl" name="spotifyProfileUrl" type="text" defaultValue={user.spotifyProfileUrl || ''} placeholder="https://open.spotify.com/artist/..." />
                </div>
                <div className="checkbox-row mt-10px">
                  <input type="checkbox" id="contactFormEnabled" name="contactFormEnabled" checked={contactFormEnabled} onChange={e => setContactFormEnabled(e.target.checked)} value="true" />
                  <label htmlFor="contactFormEnabled">Activar buzón de mensajes (Formulario de Contacto)</label>
                </div>
                {contactFormEnabled && (
                  <div className="contact-fields-config mt-05rem contact-fields-wrapper">
                    <small className="bio text-sm">¿Qué datos quieres pedirle al visitante?</small>
                    <div className="checkbox-row">
                      <input type="checkbox" id="contactFormAskName" name="contactFormAskName" defaultChecked={user.contactFormAskName} value="true" />
                      <label htmlFor="contactFormAskName" className="text-sm">Nombre</label>
                    </div>
                    <div className="checkbox-row">
                      <input type="checkbox" id="contactFormAskEmail" name="contactFormAskEmail" defaultChecked={user.contactFormAskEmail} value="true" />
                      <label htmlFor="contactFormAskEmail" className="text-sm">Email</label>
                    </div>
                    <div className="checkbox-row">
                      <input type="checkbox" id="contactFormAskPhone" name="contactFormAskPhone" defaultChecked={user.contactFormAskPhone} value="true" />
                      <label htmlFor="contactFormAskPhone" className="text-sm">Teléfono o WhatsApp</label>
                    </div>
                    <div className="checkbox-row">
                      <input type="checkbox" id="contactFormAskMessage" name="contactFormAskMessage" defaultChecked={user.contactFormAskMessage} value="true" />
                      <label htmlFor="contactFormAskMessage" className="text-sm">Mensaje/Comentario</label>
                    </div>
                  </div>
                )}

                <div className="mt-1rem">
                  {profileMsg && <p className={profileMsg.ok ? 'text-success' : 'text-error'}>{profileMsg.text}</p>}
                  <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Apariencia'}</button>
                </div>
              </form>
            </div>
          </div>

          </>
        )}

        {/* ══════════════ TAB: MIS LINKS ══════════════ */}
        {activeTab === 'links' && (
          <div className="dashboard-grid-2">
            <div>
              <div className="form-container mb-1rem">
                <h2 className="mb-1rem">Forma de Logos Sociales</h2>
                <p className="bio mb-1rem">Elige cómo se verán los botones configurados como &ldquo;Ícono (Solo logo)&rdquo;.</p>
                <form onSubmit={handleUpdateIconShape}>
                  <div className="input-group">
                    <label htmlFor="socialIconShape">Forma</label>
                    <div className="shape-form-group">
                      <select id="socialIconShape" name="socialIconShape" aria-label="Forma visual" className="platform-select text-black w-full" value={iconShape} onChange={e => setIconShape(e.target.value)}>
                        <option value="circle">Círculo</option>
                        <option value="rounded">Bordes Redondeados</option>
                        <option value="square">Cuadrado</option>
                      </select>

                      <select id="socialIconWidth" name="socialIconWidth" aria-label="Largo visual" className="platform-select text-black w-full" value={iconWidth} onChange={e => setIconWidth(e.target.value)}>
                        <option value="normal">Largo: Normal</option>
                        <option value="medium">Largo: Medio</option>
                        <option value="wide">Largo: Largo</option>
                      </select>
                      
                      {/* Vista previa */}
                      <div className="bg-black border-rgba-white-15 rounded-12px shape-preview-box">
                        <div className="social-icons mb-0 shape-preview-icons">
                          <div className={`icon-link icon-shape-${iconShape} icon-width-${iconWidth} ${user.buttonStyle === 'liquid_glass' ? 'btn-liquid-glass' : ''} shrink-0`} data-platform="instagram">
                            <i className="fa-brands fa-instagram"></i>
                          </div>
                          <div className={`icon-link icon-shape-${iconShape} icon-width-${iconWidth} ${user.buttonStyle === 'liquid_glass' ? 'btn-liquid-glass' : ''} shrink-0`} data-platform="whatsapp">
                            <i className="fa-brands fa-whatsapp"></i>
                          </div>
                          <div className={`icon-link icon-shape-${iconShape} icon-width-${iconWidth} ${user.buttonStyle === 'liquid_glass' ? 'btn-liquid-glass' : ''} shrink-0`} data-platform="youtube">
                            <i className="fa-brands fa-youtube"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Forma'}</button>
                </form>
              </div>

              <div className="form-container">
                <h2 className="mb-1rem">{editingLink ? "Editar Enlace" : "Añadir Enlace"}</h2>
                <form onSubmit={editingLink ? handleUpdateLink : handleAddLink} className="add-link-form" key={editingLink ? editingLink.id : 'new-link'}>
                <div className="input-group">
                  <label htmlFor="link-type">Tipo de elemento</label>
                  <select id="link-type" name="type" aria-label="Tipo de elemento" title="Tipo de elemento" className="platform-select text-black" defaultValue={editingLink ? editingLink.type : "link"}>
                    <option value="link">Enlace Normal</option>
                    <option value="header">Título / Separador</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="platform">Plataforma</label>
                  <div className="platform-picker">
                    <div className="platform-icon-preview" data-platform={selectedPlatform}>
                      <i className={currentPlatform.icon}></i>
                    </div>
                    <select id="platform" name="platform" className="platform-select" value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)}>
                      {Object.entries(PLATFORMS).map(([key, p]) => (
                        <option key={key} value={key} className="text-black">{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="title-link">Título del botón</label>
                  <input id="title-link" name="title" type="text"
                    defaultValue={editingLink ? editingLink.title : ''}
                    placeholder={selectedPlatform === 'whatsapp' ? 'Ej. Escríbeme por WhatsApp' : 'Ej. Mi Canal de YouTube'}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="url-link">URL de destino</label>
                  <input id="url-link" name="url" type="text"
                    defaultValue={editingLink && editingLink.type !== 'header' ? editingLink.url : ''}
                    placeholder={selectedPlatform === 'whatsapp' ? 'https://wa.me/549...' : selectedPlatform === 'email' ? 'mailto:tu@email.com' : 'https://...'}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="displayStyle">Ver el enlace como</label>
                  <select
                    id="displayStyle"
                    name="displayStyle"
                    aria-label="Estilo de visualización"
                    title="Estilo de visualización"
                    className="platform-select text-black"
                    value={selectedDisplayStyle}
                    onChange={e => { setSelectedDisplayStyle(e.target.value); if (e.target.value !== 'button') setCustomImagePreview('') }}
                  >
                    <option value="auto">Automático</option>
                    <option value="button">Barra con Texto</option>
                    <option value="icon">Ícono (Solo logo)</option>
                    <option value="rich">Incrustado (YouTube/Spotify)</option>
                  </select>
                </div>

                {selectedDisplayStyle === 'button' && (
                  <div className="input-group">
                    <label>Foto personalizada (opcional)</label>
                    <div
                      className="bg-image-picker link-custom-img-picker"
                      onClick={() => customImageRef.current?.click()}
                    >
                      {customImagePreview
                        ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={customImagePreview} alt="Preview" className="image-picker-preview image-picker-preview-cover" />
                        )
                        : <div className="bg-image-placeholder"><i className="fa-solid fa-image"></i><span>Subir foto para el botón</span></div>
                      }
                      {customImagePreview && (
                        <div className="bg-image-overlay"><i className="fa-solid fa-pencil"></i><span>Cambiar</span></div>
                      )}
                    </div>
                    <input
                      ref={customImageRef}
                      type="file"
                      accept="image/*"
                      hidden
                      title="Subir foto personalizada"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        readFileAsDataURL(file, 2, setCustomImagePreview, msg => setLinkMsg({ ok: false, text: msg }))
                      }}
                    />
                    {customImagePreview && (
                      <button type="button" className="btn-danger btn-remove-image mt-05rem" onClick={() => setCustomImagePreview('')}>
                        <i className="fa-solid fa-trash mr-4px"></i> Quitar foto
                      </button>
                    )}
                  </div>
                )}
                {linkMsg && <p className={linkMsg.ok ? 'text-success' : 'text-error'}>{linkMsg.text}</p>}
                <div className="dashboard-actions-row flex-wrap-center mt-05rem">
                  <button type="submit" className="btn-primary btn-flex-1 btn-platform-submit" data-platform={selectedPlatform} disabled={isPending}>
                    <i className={currentPlatform.icon + ' mr-8px'}></i>
                    {isPending ? 'Guardando...' : (editingLink ? 'Actualizar Enlace' : `Añadir ${currentPlatform.label}`)}
                  </button>
                  {editingLink && (
                    <button type="button" className="btn-danger" onClick={cancelEditLink} disabled={isPending}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

            <div className="form-container">
              <h3 className="link-list-title mb-1rem">Links Actuales ({user.links.length})</h3>
              {user.links.length === 0 && <p className="bio">No has agregado enlaces todavía.</p>}
              <div className="link-list">
                {user.links.sort((a, b) => a.order - b.order).map(link => {
                  const platform = PLATFORMS[link.platform] || PLATFORMS.other
                  return (
                    <div key={link.id} className="link-item-dashboard">
                      <div className="link-item-icon" data-platform={link.platform}>
                        {link.type === 'header' ? <i className="fa-solid fa-heading"></i> : <i className={platform.icon}></i>}
                      </div>
                      <div className="link-item-info">
                        <strong className="link-item-title">{link.type === 'header' ? `[Título] ${link.title}` : link.title}</strong>
                        <small className="bio link-item-url">
                          {link.type === 'header' ? 'Separador visual' : link.url}
                          {link.type !== 'header' && <span className="ml-8px text-xs"><i className="fa-solid fa-chart-simple mr-4px"></i>{link.clicks} clics</span>}
                        </small>
                      </div>
                      <div className="dashboard-actions">
                        <button type="button" className="btn-secondary-sm" onClick={() => handleEditLink(link)} disabled={isPending} title="Editar">
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button type="button" className="btn-danger-sm" onClick={() => handleDeleteLink(link.id)} disabled={isPending} title="Eliminar">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: MI NEGOCIO ══════════════ */}
        {activeTab === 'business' && (
          <div className="dashboard-grid-2">
            <div className="form-container">
              <h2 className="mb-1rem">Datos del Negocio</h2>
              <p className="bio mb-1rem">Configura este apartado para destacar tu bar, restaurante o local comercial en el perfil.</p>
              <form onSubmit={handleSaveBusiness}>
                <div className="checkbox-row mb-1rem">
                  <input type="checkbox" id="business-enabled" name="enabled" defaultChecked={user.businessConfig?.enabled} value="true" />
                  <label htmlFor="business-enabled"><strong>Activar apariencia de Negocio</strong></label>
                </div>

                <div className="input-group">
                  <label htmlFor="businessName">Nombre del Local</label>
                  <input id="businessName" name="businessName" type="text" defaultValue={user.businessConfig?.businessName || ''} placeholder="Ej. El Buen Sabor" />
                </div>
                
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="b-type">Rubro</label>
                    <select id="b-type" name="type" className="platform-select text-black" defaultValue={user.businessConfig?.type || 'restaurant'}>
                      <option value="restaurant">Restaurante</option>
                      <option value="bar">Bar / Cervecería</option>
                      <option value="cafe">Cafetería</option>
                      <option value="store">Tienda</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="b-phone">Teléfono / WhatsApp</label>
                    <input id="b-phone" name="phone" type="tel" defaultValue={user.businessConfig?.phone || ''} placeholder="+54 9 11..." />
                  </div>
                </div>

                <div className="section-divider"><span>Menú & Reservas</span></div>
                <div className="input-group">
                  <label>Menú Digital</label>
                  <div className="flex-wrap-center gap-10px mb-05rem">
                    <button type="button" className="btn-secondary-sm" onClick={() => menuInputRef.current?.click()}>
                      <i className="fa-solid fa-upload mr-4px"></i> Subir como Imagen
                    </button>
                  </div>
                  <input ref={menuInputRef} type="file" accept="image/*" onChange={handleMenuFileChange} hidden title="Subir imagen de menú" aria-label="Subir imagen de menú" />
                  
                  {menuPreview || (user.businessConfig?.menuUrl && user.businessConfig.menuUrl.startsWith('data:image/')) ? (
                    <div className="bg-image-picker menu-image-picker">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={menuPreview || user.businessConfig?.menuUrl || ''} alt="Menu Preview" className="rounded-8px menu-image-preview" />
                      <button type="button" className="btn-danger w-full mt-10px" onClick={() => {
                        setMenuPreview('')
                        // Reset the hidden/original field if it was a data url
                        const el = document.getElementById('menuUrl') as HTMLInputElement
                        if (el) el.value = ''
                      }}>
                        <i className="fa-solid fa-trash mr-4px"></i> Quitar imagen de menú
                      </button>
                    </div>
                  ) : (
                    <>
                      <label htmlFor="menuUrl" className="text-secondary text-sm">O pega un link a tu Menú PDF/Web:</label>
                      <input id="menuUrl" name="menuUrl" type="url" defaultValue={user.businessConfig?.menuUrl || ''} placeholder="https://..." />
                    </>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="reservationsUrl">Link de Reservas Externo (Opcional si usas la Agenda nativa)</label>
                  <input id="reservationsUrl" name="reservationsUrl" type="url" defaultValue={user.businessConfig?.reservationsUrl || ''} placeholder="https://app.com/reserva..." />
                </div>

                <div className="section-divider"><span>Ubicación y Horarios</span></div>
                <div className="input-group">
                  <label htmlFor="address">Dirección Pública</label>
                  <input id="address" name="address" type="text" defaultValue={user.businessConfig?.address || ''} placeholder="Av. Corrientes 123, CABA" />
                </div>
                <div className="input-group">
                  <label htmlFor="mapsUrl">Link a Google Maps de la ubicación</label>
                  <input id="mapsUrl" name="mapsUrl" type="url" defaultValue={user.businessConfig?.mapsUrl || ''} placeholder="https://maps.google.com/..." />
                </div>
                <div className="input-group">
                  <HoursBuilder name="hours" defaultValue={user.businessConfig?.hours || ''} />
                </div>

                <div className="section-divider"><span>Wi-Fi Gratuito para Clientes</span></div>
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="wifiName">Red Wi-Fi</label>
                    <input id="wifiName" name="wifiName" type="text" defaultValue={user.businessConfig?.wifiName || ''} placeholder="Local-Wifi" />
                  </div>
                  <div className="input-group">
                    <label htmlFor="wifiPassword">Contraseña</label>
                    <input id="wifiPassword" name="wifiPassword" type="text" defaultValue={user.businessConfig?.wifiPassword || ''} placeholder="clave123" />
                  </div>
                </div>

                {businessMsg && <p className={businessMsg.ok ? 'text-success' : 'text-error'}>{businessMsg.text}</p>}
                <div className="dashboard-actions-row flex-wrap-center mt-1rem">
                  <button type="submit" className="btn-primary btn-flex-1" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Datos de Negocio'}</button>
                  {user.businessConfig && (
                    <button type="button" className="btn-danger" onClick={handleDeleteBusinessConfig} disabled={isPending} title="Borrar configuración de negocio" aria-label="Borrar configuración de negocio">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="form-container">
               <h3 className="link-list-title mb-1rem">Vista Previa</h3>
               <p className="bio text-sm mb-1rem">Al activar &ldquo;Mi Negocio&rdquo;, tu perfil resaltará inteligentemente a tus visitantes herramientas como el menú, mapa y wifi antes de los enlaces convencionales.</p>
               <div className="link-list mt-1rem">
                 <div className="booking-card text-center opacity-80 biz-preview-menu">
                    <i className="fa-solid fa-utensils mb-05rem text-xl biz-preview-utensils"></i>
                    <h4>Menú Digital</h4>
                    <p className="bio text-xs mt-05rem">Destacado automático con llamada a la acción</p>
                 </div>
                 <div className="booking-card text-center opacity-80 biz-preview-wifi">
                    <i className="fa-solid fa-wifi mb-05rem text-xl biz-preview-wifi-icon"></i>
                    <h4>Fi-Wi a un toque</h4>
                    <p className="bio text-xs mt-05rem">Los visitantes podrán copiar clave fácilmente en la mesa</p>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: AGENDA ══════════════ */}
        {activeTab === 'booking' && (
          <div className="dashboard-grid-2">
            <div className="form-container">
              <h2 className="mb-1rem">Configurar Agenda</h2>
              <p className="bio mb-1rem">Permite que tus visitantes reserven un horario contigo directamente desde tu perfil.</p>
              <form onSubmit={handleSaveBooking}>
                <div className="input-group">
                  <label htmlFor="booking-title">Título de la sección</label>
                  <input id="booking-title" name="title" type="text" defaultValue={user.bookingConfig?.title || 'Reservá una reunión'} required />
                </div>
                <div className="input-group">
                  <label>Días disponibles</label>
                  <div className="days-grid">
                    {DAYS.map(day => (
                      <button
                        key={day.key}
                        type="button"
                        className={`day-btn ${selectedDays.includes(day.key) ? 'day-active' : ''}`}
                        onClick={() => setSelectedDays(prev => prev.includes(day.key) ? prev.filter(d => d !== day.key) : [...prev, day.key])}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="startTime">Hora inicio</label>
                    <input id="startTime" name="startTime" type="time" defaultValue={user.bookingConfig?.startTime || '09:00'} />
                  </div>
                  <div className="input-group">
                    <label htmlFor="endTime">Hora fin</label>
                    <input id="endTime" name="endTime" type="time" defaultValue={user.bookingConfig?.endTime || '17:00'} />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="slotDuration">Duración por turno (minutos)</label>
                  <select id="slotDuration" name="slotDuration" className="platform-select text-black" defaultValue={user.bookingConfig?.slotDuration || 60}>
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
                {bookingMsg && <p className={bookingMsg.ok ? 'text-success' : 'text-error'}>{bookingMsg.text}</p>}
                <div className="dashboard-actions-row flex-wrap-center mt-05rem">
                  <button type="submit" className="btn-primary btn-flex-1" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Configuración'}</button>
                  {user.bookingConfig && (
                    <button type="button" className="btn-danger" disabled={isPending} onClick={handleDeleteBookingConfig} title="Eliminar agenda">
                      <i className="fa-solid fa-trash mr-4px"></i> Eliminar Agenda
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="form-container">
              <h3 className="link-list-title mb-1rem">Reservas Recibidas ({bookings.length})</h3>
              {bookings.length === 0 && <p className="bio">Todavía no hay reservas.</p>}
              <div className="link-list">
                {bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <strong>{booking.name}</strong>
                      <div className="dashboard-actions">
                        <span className={`booking-badge booking-${booking.status}`}>{booking.status}</span>
                        <button type="button" className="btn-danger-sm p-02-06rem" onClick={() => handleDeleteBooking(booking.id)} disabled={isPending} title="Eliminar reserva">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <p className="bio text-sm">{booking.email}</p>
                    <p className="booking-time"><i className="fa-solid fa-calendar mr-4px"></i>{booking.date} · {booking.time}</p>
                    {booking.note && <p className="bio text-sm text-italic">&quot;{booking.note}&quot;</p>}
                    {booking.status === 'pending' && (
                      <div className="booking-actions mt-05rem">
                        <button type="button" className="btn-confirm" onClick={() => handleBookingStatus(booking.id, 'confirmed')} disabled={isPending}>
                          <i className="fa-solid fa-check"></i> Confirmar
                        </button>
                        <button type="button" className="btn-danger-sm" onClick={() => handleBookingStatus(booking.id, 'cancelled')} disabled={isPending}>
                          <i className="fa-solid fa-times"></i> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ESTADÍSTICAS ══════════════ */}
        {activeTab === 'stats' && (
          <div className="form-container">
            <h2 className="mb-1rem">Estadísticas del Perfil</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <i className="fa-solid fa-eye stat-icon"></i>
                <div className="stat-value">{stats.profileViews.toLocaleString('es-AR')}</div>
                <div className="stat-label">Vistas totales</div>
              </div>
              <div className="stat-card">
                <i className="fa-solid fa-chart-simple stat-icon"></i>
                <div className="stat-value">{stats.totalClicks.toLocaleString('es-AR')}</div>
                <div className="stat-label">Clicks en links</div>
              </div>
              <div className="stat-card">
                <i className="fa-solid fa-calendar-check stat-icon"></i>
                <div className="stat-value">{stats.bookingsThisWeek}</div>
                <div className="stat-label">Reservas esta semana</div>
              </div>
              <div className="stat-card">
                <i className="fa-solid fa-envelope stat-icon"></i>
                <div className="stat-value">{stats.messagesThisMonth}</div>
                <div className="stat-label">Mensajes este mes</div>
              </div>
            </div>

            {user.links.length > 0 && (
              <>
                <h3 className="mt-2rem mb-1rem">Clicks por Link</h3>
                <div className="link-list">
                  {[...user.links]
                    .filter(l => l.type !== 'header')
                    .sort((a, b) => b.clicks - a.clicks)
                    .map(link => {
                      const maxClicks = Math.max(...user.links.map(l => l.clicks), 1)
                      const pct = Math.round((link.clicks / maxClicks) * 100)
                      return (
                        <div key={link.id} className="stat-link-row">
                          <span className="stat-link-title">{link.title}</span>
                          <div className="stat-bar-wrapper">
                            <StatBar pct={pct} />
                          </div>
                          <span className="stat-link-count">{link.clicks}</span>
                        </div>
                      )
                    })}
                </div>
              </>
            )}

            {/* Historial de escaneos */}
            <h3 className="mt-2rem mb-1rem">Historial de Escaneos (últimos 30 días)</h3>
            {scanLogs.length === 0
              ? <p className="bio">Sin escaneos registrados aún.</p>
              : (
                <div className="link-list">
                  {scanLogs.map(log => (
                    <div key={log.id} className="booking-card scan-log-card">
                      <div className="booking-header">
                        <span>
                          <i className={`fa-solid ${log.source === 'qr' ? 'fa-qrcode' : log.source === 'nfc' ? 'fa-wifi' : 'fa-globe'} mr-4px`}></i>
                          {log.source === 'qr' ? 'Escaneó QR' : log.source === 'nfc' ? 'Tocó NFC' : 'Visita directa'}
                        </span>
                        <small className="bio">{new Date(log.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                      <p className="bio text-sm">
                        <i className="fa-solid fa-mobile-screen mr-4px"></i>
                        {log.device === 'mobile' ? 'Celular' : log.device === 'desktop' ? 'Computadora' : 'Dispositivo desconocido'}
                      </p>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ══════════════ TAB: MENSAJES (placeholder for removed herramientas) ══════════════ */}
        {false && (
          <div>

            {/* ── Estado temporal ─────────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Estado Temporal <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Mostrá un mensaje corto en tu perfil que desaparece solo al vencer.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ Estado guardado.' })
                })
              }}>
                <input type="hidden" name="pdfCatalogUrl" value={user.pdfCatalogUrl || ''} />
                <input type="hidden" name="pdfCatalogLabel" value={user.pdfCatalogLabel || ''} />
                <input type="hidden" name="outOfOfficeEnabled" value={String(user.outOfOfficeEnabled)} />
                <input type="hidden" name="outOfOfficeMsg" value={user.outOfOfficeMsg || ''} />
                <input type="hidden" name="cuit" value={user.cuit || ''} />
                <input type="hidden" name="afipUrl" value={user.afipUrl || ''} />
                <input type="hidden" name="instagramHandle" value={user.instagramHandle || ''} />
                <input type="hidden" name="instagramFeedEnabled" value={String(user.instagramFeedEnabled)} />
                <input type="hidden" name="qrDynamicUrl" value={user.qrDynamicUrl || ''} />
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="statusEmoji">Emoji</label>
                    <input id="statusEmoji" name="statusEmoji" type="text" defaultValue={user.statusEmoji || '💬'} maxLength={4} placeholder="💬" />
                  </div>
                  <div className="input-group">
                    <label htmlFor="statusText">Mensaje de estado</label>
                    <input id="statusText" name="statusText" type="text" defaultValue={user.statusText || ''} placeholder="Ej: De vacaciones hasta el lunes" maxLength={80} />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="statusExpiresAt">Vence el (opcional)</label>
                  <input id="statusExpiresAt" name="statusExpiresAt" type="datetime-local" defaultValue={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                </div>
                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <div className="dashboard-actions-row flex-wrap-center">
                  <button type="submit" className="btn-primary btn-flex-1" disabled={isPending}>Guardar Estado</button>
                  {user.statusText && (
                    <button type="button" className="btn-danger" disabled={isPending} onClick={() => startTransition(async () => { await clearStatus(); setExtrasMsg({ ok: true, text: '✅ Estado limpiado.' }) })}>
                      Limpiar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ── PDF / Catálogo descargable ───────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">PDF / Catálogo Descargable <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Agregá un botón de descarga en tu perfil (CV, catálogo, menú PDF, presupuesto tipo).</p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ PDF guardado.' })
                })
              }}>
                <input type="hidden" name="statusText" value={user.statusText || ''} />
                <input type="hidden" name="statusEmoji" value={user.statusEmoji || ''} />
                <input type="hidden" name="statusExpiresAt" value={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                <input type="hidden" name="outOfOfficeEnabled" value={String(user.outOfOfficeEnabled)} />
                <input type="hidden" name="outOfOfficeMsg" value={user.outOfOfficeMsg || ''} />
                <input type="hidden" name="cuit" value={user.cuit || ''} />
                <input type="hidden" name="afipUrl" value={user.afipUrl || ''} />
                <input type="hidden" name="instagramHandle" value={user.instagramHandle || ''} />
                <input type="hidden" name="instagramFeedEnabled" value={String(user.instagramFeedEnabled)} />
                <input type="hidden" name="qrDynamicUrl" value={user.qrDynamicUrl || ''} />
                <div className="input-group">
                  <label htmlFor="pdfCatalogUrl">URL del PDF (Google Drive, Dropbox, etc.)</label>
                  <input id="pdfCatalogUrl" name="pdfCatalogUrl" type="url" defaultValue={user.pdfCatalogUrl || ''} placeholder="https://drive.google.com/..." />
                </div>
                <div className="input-group">
                  <label htmlFor="pdfCatalogLabel">Texto del botón</label>
                  <input id="pdfCatalogLabel" name="pdfCatalogLabel" type="text" defaultValue={user.pdfCatalogLabel || ''} placeholder="Ej: Descargar Catálogo 2025" />
                </div>
                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar PDF</button>
              </form>
            </div>

            {/* ── Fuera de horario ────────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Modo Fuera de Horario <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Activá un aviso visible en tu perfil cuando no estés disponible.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ Guardado.' })
                })
              }}>
                <input type="hidden" name="statusText" value={user.statusText || ''} />
                <input type="hidden" name="statusEmoji" value={user.statusEmoji || ''} />
                <input type="hidden" name="statusExpiresAt" value={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                <input type="hidden" name="pdfCatalogUrl" value={user.pdfCatalogUrl || ''} />
                <input type="hidden" name="pdfCatalogLabel" value={user.pdfCatalogLabel || ''} />
                <input type="hidden" name="cuit" value={user.cuit || ''} />
                <input type="hidden" name="afipUrl" value={user.afipUrl || ''} />
                <input type="hidden" name="instagramHandle" value={user.instagramHandle || ''} />
                <input type="hidden" name="instagramFeedEnabled" value={String(user.instagramFeedEnabled)} />
                <input type="hidden" name="qrDynamicUrl" value={user.qrDynamicUrl || ''} />
                <div className="checkbox-row mb-1rem">
                  <input type="checkbox" id="outOfOfficeEnabled" name="outOfOfficeEnabled" defaultChecked={user.outOfOfficeEnabled} value="true" />
                  <label htmlFor="outOfOfficeEnabled"><strong>Activar aviso de fuera de horario</strong></label>
                </div>
                <div className="input-group">
                  <label htmlFor="outOfOfficeMsg">Mensaje personalizado</label>
                  <input id="outOfOfficeMsg" name="outOfOfficeMsg" type="text" defaultValue={user.outOfOfficeMsg || ''} placeholder="Ej: Vuelvo el lunes a las 9hs" />
                </div>
                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar</button>
              </form>
            </div>

            {/* ── AFIP / Facturación ───────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">AFIP / Facturación <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Mostrá tu CUIT y un botón para pedir factura en tu perfil.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ Guardado.' })
                })
              }}>
                <input type="hidden" name="statusText" value={user.statusText || ''} />
                <input type="hidden" name="statusEmoji" value={user.statusEmoji || ''} />
                <input type="hidden" name="statusExpiresAt" value={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                <input type="hidden" name="pdfCatalogUrl" value={user.pdfCatalogUrl || ''} />
                <input type="hidden" name="pdfCatalogLabel" value={user.pdfCatalogLabel || ''} />
                <input type="hidden" name="outOfOfficeEnabled" value={String(user.outOfOfficeEnabled)} />
                <input type="hidden" name="outOfOfficeMsg" value={user.outOfOfficeMsg || ''} />
                <input type="hidden" name="instagramHandle" value={user.instagramHandle || ''} />
                <input type="hidden" name="instagramFeedEnabled" value={String(user.instagramFeedEnabled)} />
                <input type="hidden" name="qrDynamicUrl" value={user.qrDynamicUrl || ''} />
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="cuit">CUIT</label>
                    <input id="cuit" name="cuit" type="text" defaultValue={user.cuit || ''} placeholder="20-12345678-9" maxLength={14} />
                  </div>
                  <div className="input-group">
                    <label htmlFor="afipUrl">Link a facturación online (opcional)</label>
                    <input id="afipUrl" name="afipUrl" type="url" defaultValue={user.afipUrl || ''} placeholder="https://..." />
                  </div>
                </div>
                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar AFIP</button>
              </form>
            </div>

            {/* ── Instagram ───────────────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Instagram en el Perfil <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Mostrá tu handle de Instagram y activá la sección de Instagram en tu perfil.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ Guardado.' })
                })
              }}>
                <input type="hidden" name="statusText" value={user.statusText || ''} />
                <input type="hidden" name="statusEmoji" value={user.statusEmoji || ''} />
                <input type="hidden" name="statusExpiresAt" value={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                <input type="hidden" name="pdfCatalogUrl" value={user.pdfCatalogUrl || ''} />
                <input type="hidden" name="pdfCatalogLabel" value={user.pdfCatalogLabel || ''} />
                <input type="hidden" name="outOfOfficeEnabled" value={String(user.outOfOfficeEnabled)} />
                <input type="hidden" name="outOfOfficeMsg" value={user.outOfOfficeMsg || ''} />
                <input type="hidden" name="cuit" value={user.cuit || ''} />
                <input type="hidden" name="afipUrl" value={user.afipUrl || ''} />
                <input type="hidden" name="qrDynamicUrl" value={user.qrDynamicUrl || ''} />
                <div className="input-group">
                  <label htmlFor="instagramHandle">Tu @usuario de Instagram</label>
                  <input id="instagramHandle" name="instagramHandle" type="text" defaultValue={user.instagramHandle || ''} placeholder="tuusuario (sin @)" />
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="instagramFeedEnabled" name="instagramFeedEnabled" defaultChecked={user.instagramFeedEnabled} value="true" />
                  <label htmlFor="instagramFeedEnabled">Mostrar sección de Instagram en el perfil</label>
                </div>
                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <button type="submit" className="btn-primary w-full mt-05rem" disabled={isPending}>Guardar Instagram</button>
              </form>
            </div>

            {/* ── QR Dinámico ─────────────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">QR Dinámico <span className="plan-badge-premium">PREMIUM</span></h2>
              <p className="bio mb-1rem">
                Tu QR siempre apunta a <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/qr/{user.username}</strong>.
                Cambiá el destino desde acá sin reimprimir nada.
              </p>
              <form onSubmit={async e => {
                e.preventDefault(); setExtrasMsg(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const r = await saveExtras(fd)
                  if (r?.error) setExtrasMsg({ ok: false, text: r.error })
                  else setExtrasMsg({ ok: true, text: '✅ Destino del QR actualizado.' })
                })
              }}>
                <input type="hidden" name="statusText" value={user.statusText || ''} />
                <input type="hidden" name="statusEmoji" value={user.statusEmoji || ''} />
                <input type="hidden" name="statusExpiresAt" value={user.statusExpiresAt ? new Date(user.statusExpiresAt).toISOString().slice(0,16) : ''} />
                <input type="hidden" name="pdfCatalogUrl" value={user.pdfCatalogUrl || ''} />
                <input type="hidden" name="pdfCatalogLabel" value={user.pdfCatalogLabel || ''} />
                <input type="hidden" name="outOfOfficeEnabled" value={String(user.outOfOfficeEnabled)} />
                <input type="hidden" name="outOfOfficeMsg" value={user.outOfOfficeMsg || ''} />
                <input type="hidden" name="cuit" value={user.cuit || ''} />
                <input type="hidden" name="afipUrl" value={user.afipUrl || ''} />
                <input type="hidden" name="instagramHandle" value={user.instagramHandle || ''} />
                <input type="hidden" name="instagramFeedEnabled" value={String(user.instagramFeedEnabled)} />
                <div className="input-group">
                  <label htmlFor="qrDynamicUrl">URL de destino del QR (vacío = tu perfil)</label>
                  <input id="qrDynamicUrl" name="qrDynamicUrl" type="url" defaultValue={user.qrDynamicUrl || ''} placeholder="https://..." />
                </div>
                {extrasMsg && <p className={extrasMsg.ok ? 'text-success' : 'text-error'}>{extrasMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar Destino QR</button>
              </form>
            </div>

            {/* ── Modo Campaña ────────────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Modo Campaña <span className="plan-badge-premium">PREMIUM</span></h2>
              <p className="bio mb-1rem">Activá un banner de promoción temporal en tu perfil. Se apaga solo al vencer.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setCampaignMsg(null)
                const fd = new FormData(e.currentTarget)
                if (campaignBannerPreview) fd.set('bannerUrl', campaignBannerPreview)
                startTransition(async () => {
                  const r = await saveCampaign(fd)
                  if (r?.error) setCampaignMsg({ ok: false, text: r.error })
                  else setCampaignMsg({ ok: true, text: '✅ Campaña guardada.' })
                })
              }}>
                <div className="checkbox-row mb-1rem">
                  <input type="checkbox" id="campaign-enabled" name="enabled" defaultChecked={user.campaign?.enabled} value="true" />
                  <label htmlFor="campaign-enabled"><strong>Activar campaña</strong></label>
                </div>
                <div className="input-group">
                  <label htmlFor="campaign-title">Título de la campaña</label>
                  <input id="campaign-title" name="title" type="text" defaultValue={user.campaign?.title || ''} placeholder="Ej: ¡50% OFF esta semana!" />
                </div>
                <div className="input-group">
                  <label htmlFor="campaign-message">Mensaje</label>
                  <textarea id="campaign-message" name="message" rows={2} defaultValue={user.campaign?.message || ''} placeholder="Descripción de la promo..." />
                </div>
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="campaign-ctaLabel">Texto del botón</label>
                    <input id="campaign-ctaLabel" name="ctaLabel" type="text" defaultValue={user.campaign?.ctaLabel || ''} placeholder="Ver oferta" />
                  </div>
                  <div className="input-group">
                    <label htmlFor="campaign-ctaUrl">Link del botón</label>
                    <input id="campaign-ctaUrl" name="ctaUrl" type="url" defaultValue={user.campaign?.ctaUrl || ''} placeholder="https://..." />
                  </div>
                </div>
                <div className="input-group">
                  <label>Imagen de campaña (opcional)</label>
                  <div className="bg-image-picker bg-image-picker-sm" onClick={() => campaignBannerRef.current?.click()}>
                    {campaignBannerPreview
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={campaignBannerPreview} alt="Banner" className="image-picker-preview image-cover" />
                      : <div className="bg-image-placeholder"><i className="fa-solid fa-image"></i><span>Subir imagen</span></div>
                    }
                    {campaignBannerPreview && <div className="bg-image-overlay"><i className="fa-solid fa-pencil"></i></div>}
                  </div>
                  <input ref={campaignBannerRef} type="file" accept="image/*" hidden title="Banner campaña" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return
                    readFileAsDataURL(file, 3, setCampaignBannerPreview, msg => setCampaignMsg({ ok: false, text: msg }))
                  }} />
                  {campaignBannerPreview && <button type="button" className="btn-danger btn-remove-image mt-05rem" onClick={() => setCampaignBannerPreview('')}><i className="fa-solid fa-trash mr-4px"></i> Quitar</button>}
                </div>
                <div className="input-group">
                  <label htmlFor="campaign-endsAt">Vence el (opcional)</label>
                  <input id="campaign-endsAt" name="endsAt" type="datetime-local" defaultValue={user.campaign?.endsAt ? new Date(user.campaign.endsAt).toISOString().slice(0,16) : ''} />
                </div>
                {campaignMsg && <p className={campaignMsg.ok ? 'text-success' : 'text-error'}>{campaignMsg.text}</p>}
                <div className="dashboard-actions-row flex-wrap-center">
                  <button type="submit" className="btn-primary btn-flex-1" disabled={isPending}>Guardar Campaña</button>
                  {user.campaign && (
                    <button type="button" className="btn-danger" disabled={isPending} title="Eliminar campaña" aria-label="Eliminar campaña" onClick={() => { if (confirm('¿Eliminar la campaña?')) startTransition(async () => { await deleteCampaign(); setCampaignMsg({ ok: true, text: '✅ Campaña eliminada.' }) }) }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ── Equipo ──────────────────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Perfiles de Equipo <span className="plan-badge-premium">PREMIUM</span></h2>
              <p className="bio mb-1rem">Mostrá a los miembros de tu equipo en el perfil. Cada uno puede tener su propio link.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setTeamMsg(null)
                const fd = new FormData(e.currentTarget)
                fd.set('teamEnabled', 'true')
                startTransition(async () => {
                  const r = await saveTeamSettings(fd)
                  if (r?.error) setTeamMsg({ ok: false, text: r.error })
                  else setTeamMsg({ ok: true, text: '✅ Guardado.' })
                })
              }}>
                <div className="checkbox-row mb-1rem">
                  <input type="checkbox" id="teamEnabled" name="teamEnabled" defaultChecked={user.teamEnabled} value="true" />
                  <label htmlFor="teamEnabled"><strong>Mostrar sección de equipo en el perfil</strong></label>
                </div>
                {teamMsg && <p className={teamMsg.ok ? 'text-success' : 'text-error'}>{teamMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar Visibilidad</button>
              </form>

              <div className="section-divider mt-1rem"><span>Agregar miembro</span></div>
              <form onSubmit={async e => {
                e.preventDefault(); setTeamMsg(null)
                const fd = new FormData(e.currentTarget)
                if (teamAvatarPreview) fd.set('avatarUrl', teamAvatarPreview)
                startTransition(async () => {
                  const r = await addTeamMember(fd)
                  if (r?.error) setTeamMsg({ ok: false, text: r.error })
                  else {
                    setTeamMsg({ ok: true, text: '✅ Miembro agregado.' })
                    setTeamAvatarPreview('')
                    ;(e.target as HTMLFormElement).reset()
                  }
                })
              }}>
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="team-name">Nombre</label>
                    <input id="team-name" name="name" type="text" placeholder="Ej: Laura García" required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="team-role">Rol</label>
                    <input id="team-role" name="role" type="text" placeholder="Ej: Diseñadora" />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="team-profileUrl">Link al perfil (Cloudinf u otra web)</label>
                  <input id="team-profileUrl" name="profileUrl" type="url" placeholder="https://cloudinf.com/..." />
                </div>
                <div className="input-group">
                  <label>Foto del miembro</label>
                  <div className="bg-image-picker bg-image-picker-xs" onClick={() => teamAvatarRef.current?.click()}>
                    {teamAvatarPreview
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={teamAvatarPreview} alt="Avatar" className="image-picker-preview image-picker-preview-avatar" />
                      : <div className="bg-image-placeholder"><i className="fa-solid fa-user"></i><span>Foto</span></div>
                    }
                  </div>
                  <input ref={teamAvatarRef} type="file" accept="image/*" hidden title="Foto del miembro" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return
                    readFileAsDataURL(file, 2, setTeamAvatarPreview, msg => setTeamMsg({ ok: false, text: msg }))
                  }} />
                </div>
                {teamMsg && <p className={teamMsg.ok ? 'text-success' : 'text-error'}>{teamMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Agregar al Equipo</button>
              </form>

              {user.teamMembers.length > 0 && (
                <div className="link-list mt-1rem">
                  {user.teamMembers.map(m => (
                    <div key={m.id} className="link-item-dashboard">
                      <div className="link-item-icon team-member-list-icon">
                        {m.avatarUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={m.avatarUrl} alt={m.name} className="image-picker-preview image-picker-preview-avatar" width={32} height={32} />
                          : <i className="fa-solid fa-user"></i>
                        }
                      </div>
                      <div className="link-item-info">
                        <strong className="link-item-title">{m.name}</strong>
                        <small className="bio link-item-url">{m.role || 'Sin rol'}</small>
                      </div>
                      <button type="button" className="btn-danger-sm" disabled={isPending} onClick={() => { if (confirm(`¿Eliminar a ${m.name}?`)) startTransition(async () => { await deleteTeamMember(m.id) }) }} title="Eliminar">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Formulario de presupuesto ────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Formulario de Presupuesto <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Creá un formulario personalizable para que tus clientes pidan un presupuesto desde tu perfil.</p>
              <form onSubmit={async e => {
                e.preventDefault(); setQuoteMsg(null)
                const fd = new FormData(e.currentTarget)
                fd.set('fields', JSON.stringify(quoteFields))
                startTransition(async () => {
                  const r = await saveQuoteForm(fd)
                  if (r?.error) setQuoteMsg({ ok: false, text: r.error })
                  else setQuoteMsg({ ok: true, text: '✅ Formulario guardado.' })
                })
              }}>
                <div className="checkbox-row mb-1rem">
                  <input type="checkbox" id="quoteEnabled" name="enabled" defaultChecked={user.quoteForm?.enabled} value="true" />
                  <label htmlFor="quoteEnabled"><strong>Activar formulario de presupuesto</strong></label>
                </div>
                <div className="grid-2-cols">
                  <div className="input-group">
                    <label htmlFor="quoteTitle">Título</label>
                    <input id="quoteTitle" name="title" type="text" defaultValue={user.quoteForm?.title || 'Pedí un presupuesto'} />
                  </div>
                  <div className="input-group">
                    <label htmlFor="quoteDesc">Descripción (opcional)</label>
                    <input id="quoteDesc" name="description" type="text" defaultValue={user.quoteForm?.description || ''} placeholder="Completá este formulario..." />
                  </div>
                </div>
                <div className="input-group">
                  <label>Preguntas del formulario</label>
                  <div className="link-list mb-05rem">
                    {quoteFields.map((f, i) => (
                      <div key={i} className="link-item-dashboard">
                        <div className="link-item-icon"><i className="fa-solid fa-list"></i></div>
                        <div className="link-item-info"><strong className="link-item-title">{f}</strong></div>
                        <button type="button" className="btn-danger-sm" onClick={() => setQuoteFields(prev => prev.filter((_, j) => j !== i))} title="Quitar pregunta"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    ))}
                  </div>
                  <div className="dashboard-actions-row flex-wrap-center">
                    <input
                      type="text"
                      aria-label="Nueva pregunta del formulario"
                      className="btn-flex-1 input-inline-ghost"
                      value={newField}
                      onChange={e => setNewField(e.target.value)}
                      placeholder="Ej: Tipo de trabajo"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newField.trim()) { setQuoteFields(p => [...p, newField.trim()]); setNewField('') } } }}
                    />
                    <button
                      type="button"
                      aria-label="Agregar pregunta"
                      title="Agregar pregunta"
                      className="btn-secondary-sm"
                      onClick={() => { if (newField.trim()) { setQuoteFields(p => [...p, newField.trim()]); setNewField('') } }}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                  <small className="bio text-sm mt-05rem">Siempre se pedirá nombre y email. Agregá preguntas específicas (zona, presupuesto estimado, tipo de trabajo, etc.).</small>
                </div>
                {quoteMsg && <p className={quoteMsg.ok ? 'text-success' : 'text-error'}>{quoteMsg.text}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isPending}>Guardar Formulario</button>
              </form>

              {(user.quoteForm?.submissions?.length ?? 0) > 0 && (
                <>
                  <div className="section-divider mt-1rem"><span>Solicitudes recibidas ({user.quoteForm!.submissions.length})</span></div>
                  <div className="link-list">
                    {user.quoteForm!.submissions.map(sub => {
                      const data: Record<string, string> = (() => { try { return JSON.parse(sub.data) } catch { return {} } })()
                      return (
                        <div key={sub.id} className="booking-card">
                          <div className="booking-header">
                            <strong>{sub.name || 'Sin nombre'}</strong>
                            <div className="dashboard-actions">
                              <small className="bio">{new Date(sub.createdAt).toLocaleDateString('es-AR')}</small>
                              <button type="button" className="btn-danger-sm p-02-06rem" disabled={isPending} onClick={() => { if (confirm('¿Eliminar solicitud?')) startTransition(async () => { await deleteQuoteSubmission(sub.id) }) }} title="Eliminar">
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          {sub.email && <p className="bio text-sm">{sub.email}</p>}
                          {Object.entries(data).map(([k, v]) => (
                            <p key={k} className="bio text-sm"><strong>{k}:</strong> {v}</p>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── Programa de referidos ────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Programa de Referidos <span className="plan-badge-plus">PLUS</span></h2>
              <p className="bio mb-1rem">Compartí tu código y ganá un mes gratis por cada amigo que se subscriba.</p>
              {referralCode
                ? (
                  <div>
                    <div className="input-group">
                      <label>Tu código de referido</label>
                      <div className="dashboard-actions-row flex-wrap-center">
                        <input type="text" readOnly value={referralCode} aria-label="Código de referido" className="btn-flex-1 input-readonly-code" />
                        <button type="button" className="btn-secondary-sm" onClick={() => navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`)} title="Copiar link" aria-label="Copiar link de referido">
                          <i className="fa-solid fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <p className="bio text-sm mt-05rem">
                      Link: <span className="referral-link-text">/register?ref={referralCode}</span>
                    </p>
                    {user.referrals.length > 0 && (
                      <p className="bio text-sm mt-05rem">
                        <i className="fa-solid fa-users mr-4px"></i>
                        <strong>{user.referrals.length}</strong> referido{user.referrals.length !== 1 ? 's' : ''} • {user.referrals.filter(r => r.status === 'completed').length} completado{user.referrals.filter(r => r.status === 'completed').length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )
                : (
                  <button type="button" className="btn-primary w-full" disabled={isPending} onClick={() => startTransition(async () => {
                    const r = await generateReferralCode()
                    if (r?.success && r.code) setReferralCode(r.code)
                  })}>
                    <i className="fa-solid fa-wand-magic-sparkles mr-4px"></i>
                    Generar mi código de referido
                  </button>
                )
              }
            </div>

            {/* ── Dashboard de agencia ─────────────────────────────────────── */}
            <div className="form-container mb-1rem">
              <h2 className="mb-05rem">Dashboard de Agencia <span className="plan-badge-premium">PREMIUM</span></h2>
              <p className="bio mb-1rem">Generá un link de acceso de solo lectura para que tu agencia o cliente vea tus estadísticas sin poder editar nada.</p>
              {agencyToken
                ? (
                  <div>
                    <div className="input-group">
                      <label>Link de acceso de solo lectura</label>
                      <div className="dashboard-actions-row flex-wrap-center">
                        <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/agency/${agencyToken}`} aria-label="Link de acceso de agencia" className="btn-flex-1 input-readonly-sm" />
                        <button type="button" className="btn-secondary-sm" onClick={() => navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/agency/${agencyToken}`)} title="Copiar link de agencia" aria-label="Copiar link de agencia">
                          <i className="fa-solid fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <button type="button" className="btn-danger w-full mt-05rem" disabled={isPending} onClick={() => { if (confirm('¿Revocar acceso de agencia? El link actual dejará de funcionar.')) startTransition(async () => { await revokeAgencyToken(); setAgencyToken('') }) }}>
                      <i className="fa-solid fa-ban mr-4px"></i> Revocar acceso
                    </button>
                  </div>
                )
                : (
                  <button type="button" className="btn-primary w-full" disabled={isPending} onClick={() => startTransition(async () => {
                    const r = await generateAgencyToken()
                    if (r?.success && r.token) setAgencyToken(r.token)
                  })}>
                    <i className="fa-solid fa-link mr-4px"></i>
                    Generar link de acceso
                  </button>
                )
              }
            </div>

          </div>
        )}

        {/* ══════════════ TAB: MENSAJES ══════════════ */}
        {activeTab === 'inbox' && (
          <div className="form-container">
            <h2 className="mb-1rem">Mensajes de Contacto ({user.contactMessages.length})</h2>
            {user.contactMessages.length === 0 && <p className="bio">No has recibido mensajes todavía. Activa el formulario de contacto desde Apariencia.</p>}
            <div className="link-list">
              {user.contactMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(msg => (
                <div key={msg.id} className="booking-card">
                  <div className="booking-header">
                    <strong>{msg.name}</strong>
                    <div className="dashboard-actions">
                      <small className="bio">{new Date(msg.createdAt).toLocaleDateString('es-AR')}</small>
                      <button type="button" className="btn-danger-sm p-02-06rem" onClick={() => handleDeleteMessage(msg.id)} disabled={isPending} title="Eliminar mensaje">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p className="bio text-sm">
                    {msg.email} {msg.email && msg.phone && ' • '} {msg.phone}
                  </p>
                  {msg.message && <p className="msg-text mt-05rem">{msg.message}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
