'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import {
  updateProfile, createLink, deleteLink,
  addCarouselPhoto, deleteCarouselPhoto,
  saveBookingConfig, updateBookingStatus, deleteBooking,
  deleteContactMessage
} from '@/app/actions/dashboard'
import { PLATFORMS } from '@/lib/constants'
import Link from 'next/link'

// === Types ===
type LinkType = { id: string; title: string; url: string; platform: string; icon: string | null; displayStyle: string; type: string; clicks: number; order: number }
type CarouselPhotoType = { id: string; imageUrl: string; caption: string | null; order: number }
type BookingType = { id: string; name: string; email: string; date: string; time: string; note: string | null; status: string; createdAt: Date }
type BookingConfigType = { id: string; title: string; availableDays: string; startTime: string; endTime: string; slotDuration: number }
type ContactMessageType = { id: string; name: string; email: string; message: string; createdAt: Date }
type UserType = {
  id: string; name: string | null; username: string | null; bio: string | null;
  avatarUrl: string | null; image: string | null; buttonStyle: string; themeColor: string | null;
  layoutStyle: string; vcardEnabled: boolean; contactFormEnabled: boolean;
  seoTitle: string | null; seoDescription: string | null;
  bgType: string; bgColor: string | null; bgGradient1: string | null; bgGradient2: string | null;
  bgGradientDir: string | null; bgImageUrl: string | null;
  translateEnabled: boolean; spotifyProfileUrl: string | null; carouselEnabled: boolean;
  links: LinkType[]; carouselPhotos: CarouselPhotoType[];
  bookingConfig: BookingConfigType | null;
  contactMessages: ContactMessageType[];
}

const DAYS = [
  { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' }, { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

export default function DashboardClient({
  user, signOutAction, bookings,
}: {
  user: UserType;
  signOutAction: () => Promise<void>;
  bookings: BookingType[];
}) {
  const [activeTab, setActiveTab] = useState<'profile'|'links'|'gallery'|'booking'|'inbox'>('profile')
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatarUrl || user.image || '')
  const [profileMsg, setProfileMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [linkMsg, setLinkMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [galleryMsg, setGalleryMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [bookingMsg, setBookingMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp')
  const [bgType, setBgType] = useState(user.bgType || 'default')
  const [showQR, setShowQR] = useState(false)
  const [isPending, startTransition] = useTransition()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Image upload state
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [bgImagePreview, setBgImagePreview] = useState<string>(user.bgImageUrl || '')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const bgImageInputRef = useRef<HTMLInputElement>(null)

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

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataURL(file, 5, setPhotoPreview, (msg) => setGalleryMsg({ ok: false, text: msg }))
  }

  function handleBgImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataURL(file, 5, setBgImagePreview, (msg) => setProfileMsg({ ok: false, text: msg }))
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setProfileMsg(null)
    const fd = new FormData(e.currentTarget)
    if (avatarPreview) fd.set('avatarUrl', avatarPreview)
    if (bgImagePreview) fd.set('bgImageUrl', bgImagePreview)
    startTransition(async () => {
      const result = await updateProfile(fd)
      if (result?.error) setProfileMsg({ ok: false, text: result.error })
      else setProfileMsg({ ok: true, text: '✅ Perfil guardado.' })
    })
  }

  async function handleAddLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLinkMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createLink(fd)
      if (result?.error) setLinkMsg({ ok: false, text: result.error })
      else { setLinkMsg({ ok: true, text: '✅ Enlace añadido.' }); (e.target as HTMLFormElement).reset(); setSelectedPlatform('whatsapp') }
    })
  }

  async function handleDeleteLink(id: string) {
    startTransition(async () => { await deleteLink(id) })
  }

  async function handleAddPhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setGalleryMsg(null)
    if (!photoPreview) { setGalleryMsg({ ok: false, text: 'Seleccioná una imagen primero.' }); return }
    const fd = new FormData(e.currentTarget)
    fd.set('imageUrl', photoPreview)
    startTransition(async () => {
      const result = await addCarouselPhoto(fd)
      if (result?.error) setGalleryMsg({ ok: false, text: result.error })
      else { setGalleryMsg({ ok: true, text: '✅ Foto añadida.' }); (e.target as HTMLFormElement).reset(); setPhotoPreview('') }
    })
  }

  async function handleDeletePhoto(id: string) {
    startTransition(async () => { await deleteCarouselPhoto(id) })
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

  const currentPlatform = PLATFORMS[selectedPlatform] || PLATFORMS.other
  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: 'fa-user' },
    { id: 'links', label: 'Mis Links', icon: 'fa-link' },
    { id: 'booking', label: 'Agenda', icon: 'fa-calendar' },
    { id: 'inbox', label: 'Mensajes', icon: 'fa-envelope' },
  ] as const

  return (
    <main className="container max-w-1000">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="name">Panel de {user.username}</h1>
        <div className="dashboard-actions flex-wrap-center">
          <button type="button" aria-label="Mostrar código QR" title="Mostrar código QR" onClick={() => setShowQR(true)} className="btn-secondary-sm">
            <i className="fa-solid fa-qrcode"></i>
          </button>
          <Link href={`/${user.username}`} target="_blank" className="btn-primary text-none-pad">
            Ver Perfil
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="btn-danger">Salir</button>
          </form>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-content text-center" onClick={e => e.stopPropagation()}>
            <h2 className="mb-1rem">Tu Código QR</h2>
            <p className="bio mb-1rem">Escanea para ir a tu perfil</p>
            <div className="qr-box mb-1rem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/${user.username}`)}`}
                alt="QR Code" width="250" height="250"
              />
            </div>
            <button className="btn-danger w-full" onClick={() => setShowQR(false)}>Cerrar</button>
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
            className={`tab-btn ${activeTab === tab.id ? 'tab-active-marker' : ''}`}
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
          <div className="dashboard-grid-2">
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
                  <p className="avatar-hint">Haz clic para subir desde tu dispositivo</p>
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

            <div className="form-container">
              <h2 className="mb-1rem">Apariencia & Extras</h2>
              <form onSubmit={handleProfileSubmit}>
                {/* Hidden fields to preserve basic data */}
                <input type="hidden" name="name" value={user.name || ''} />
                <input type="hidden" name="bio" value={user.bio || ''} />
                <input type="hidden" name="username" value={user.username || ''} />

                <div className="section-divider"><span>Diseño Visual</span></div>
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
                  <input type="checkbox" id="contactFormEnabled" name="contactFormEnabled" defaultChecked={user.contactFormEnabled} value="true" />
                  <label htmlFor="contactFormEnabled">Activar buzón de mensajes (Formulario de Contacto)</label>
                </div>

                <div className="mt-1rem">
                  {profileMsg && <p className={profileMsg.ok ? 'text-success' : 'text-error'}>{profileMsg.text}</p>}
                  <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Apariencia'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: MIS LINKS ══════════════ */}
        {activeTab === 'links' && (
          <div className="dashboard-grid-2">
            <div className="form-container">
              <h2 className="mb-1rem">Añadir Enlace</h2>
              <form onSubmit={handleAddLink} className="add-link-form">
                <div className="input-group">
                  <label htmlFor="link-type">Tipo de elemento</label>
                  <select id="link-type" name="type" aria-label="Tipo de elemento" title="Tipo de elemento" className="platform-select text-black" defaultValue="link">
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
                    placeholder={selectedPlatform === 'whatsapp' ? 'Ej. Escríbeme por WhatsApp' : 'Ej. Mi Canal de YouTube'}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="url-link">URL de destino</label>
                  <input id="url-link" name="url" type="text"
                    placeholder={selectedPlatform === 'whatsapp' ? 'https://wa.me/549...' : selectedPlatform === 'email' ? 'mailto:tu@email.com' : 'https://...'}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="displayStyle">Ver el enlace como</label>
                  <select id="displayStyle" name="displayStyle" aria-label="Estilo de visualización" title="Estilo de visualización" className="platform-select text-black" defaultValue="auto">
                    <option value="auto">Automático</option>
                    <option value="button">Barra con Texto</option>
                    <option value="icon">Ícono (Solo logo)</option>
                    <option value="rich">Incrustado (YouTube/Spotify)</option>
                  </select>
                </div>
                {linkMsg && <p className={linkMsg.ok ? 'text-success' : 'text-error'}>{linkMsg.text}</p>}
                <button type="submit" className="btn-primary btn-platform-submit" data-platform={selectedPlatform} disabled={isPending}>
                  <i className={currentPlatform.icon + ' mr-8px'}></i>
                  {isPending ? 'Añadiendo...' : `Añadir ${currentPlatform.label}`}
                </button>
              </form>
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
                      <button type="button" className="btn-danger-sm" onClick={() => handleDeleteLink(link.id)} disabled={isPending} title="Eliminar">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  )
                })}
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
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Configuración'}</button>
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
                  <p className="bio text-sm">{msg.email}</p>
                  <p className="msg-text mt-05rem">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
