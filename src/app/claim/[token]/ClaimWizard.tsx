'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { claimCardWithSetup } from '@/app/actions/auth'

type Props = {
  token: string
  username: string
  defaultName: string
}

const TYPES = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'bar', label: 'Bar / Cervecería' },
  { value: 'cafe', label: 'Cafetería' },
  { value: 'store', label: 'Tienda / Comercio' },
  { value: 'other', label: 'Otro' },
]

export default function ClaimWizard({ token, username, defaultName }: Props) {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${username}`
    : `https://cloudinf.com/${username}`

  function handleSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await claimCardWithSetup(token, fd)
      if (res?.error) setError(res.error)
      else setStep(3)
    })
  }

  return (
    <main className="container flex-center">
      <div className="claim-wizard-container">

        {/* Progress bar */}
        <div className="wizard-progress">
          {[1, 2, 3].map(n => (
            <div key={n} className={`wizard-step-dot ${step >= n ? 'active' : ''}`} />
          ))}
        </div>

        {/* ── Step 1: Bienvenida ── */}
        {step === 1 && (
          <div className="wizard-step text-center">
            <div className="wizard-nfc-icon">
              <i className="fa-solid fa-nfc-signal" />
            </div>
            <h1 className="name wizard-title">¡Tu tarjeta está lista!</h1>
            <p className="bio mt-05rem">
              Acabás de activar tu <strong>tarjeta NFC Cloudinf</strong>. Ahora configurá tu perfil en menos de un minuto para que tus clientes vean toda la info de tu negocio cuando la toquen.
            </p>
            <div className="wizard-features mt-1rem">
              <div className="wizard-feature">
                <i className="fa-solid fa-wifi" />
                <span>WiFi, horarios y dirección</span>
              </div>
              <div className="wizard-feature">
                <i className="fa-solid fa-utensils" />
                <span>Menú digital y reservas</span>
              </div>
              <div className="wizard-feature">
                <i className="fa-brands fa-whatsapp" />
                <span>Redes sociales y contacto</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary w-full mt-1rem p-085rem"
              onClick={() => setStep(2)}
            >
              Configurar mi perfil <i className="fa-solid fa-arrow-right ml-8px" />
            </button>
          </div>
        )}

        {/* ── Step 2: Datos básicos ── */}
        {step === 2 && (
          <div className="wizard-step">
            <h1 className="name wizard-title text-center">Datos de tu negocio</h1>
            <p className="bio text-center mt-05rem mb-1rem">Podés completar todo desde el dashboard después. Esto es solo lo esencial.</p>
            <form onSubmit={handleSetup}>
              <div className="input-group">
                <label htmlFor="wiz-name">Tu nombre o apodo</label>
                <input id="wiz-name" name="name" type="text" defaultValue={defaultName} placeholder="Ej. Juan Pérez" required />
              </div>
              <div className="input-group">
                <label htmlFor="wiz-business">Nombre del local</label>
                <input id="wiz-business" name="businessName" type="text" placeholder="Ej. El Buen Sabor" />
              </div>
              <div className="input-group">
                <label htmlFor="wiz-type">Rubro</label>
                <select id="wiz-type" name="type" className="platform-select text-black">
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="wiz-phone">WhatsApp de contacto</label>
                <input id="wiz-phone" name="phone" type="tel" placeholder="+54 9 11 1234-5678" />
              </div>

              {error && <p className="text-error mt-05rem">{error}</p>}

              <div className="dashboard-actions-row mt-1rem">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <button type="submit" className="btn-primary btn-flex-1 p-085rem" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Activar tarjeta'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: Listo ── */}
        {step === 3 && (
          <div className="wizard-step text-center">
            <div className="wizard-success-icon">
              <i className="fa-solid fa-circle-check" />
            </div>
            <h1 className="name wizard-title">¡Todo listo!</h1>
            <p className="bio mt-05rem">
              Tu tarjeta ya está activa y vinculada a tu perfil. Cuando alguien la toque, verá directamente <strong>/{username}</strong>.
            </p>

            <div className="wizard-qr-box mt-1rem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`}
                alt="QR de tu perfil"
                width={160}
                height={160}
              />
              <p className="bio text-xs mt-05rem">Guardá este QR para imprimirlo</p>
            </div>

            <div className="wizard-actions mt-1rem">
              <Link href="/dashboard" className="btn-primary w-full p-085rem">
                <i className="fa-solid fa-gauge mr-8px" />Ir a mi dashboard
              </Link>
              <Link href={`/${username}`} target="_blank" className="btn-secondary w-full p-085rem">
                <i className="fa-solid fa-eye mr-8px" />Ver mi perfil
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
