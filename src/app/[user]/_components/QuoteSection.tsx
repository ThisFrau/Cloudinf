'use client'

import { useState, useTransition } from 'react'
import { submitQuoteForm } from '@/app/actions/dashboard'

type Props = {
  username: string
  title: string
  description: string | null
  fields: string[]
}

export default function QuoteSection({ username, title, description, fields }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set('username', username)
    startTransition(async () => {
      const r = await submitQuoteForm(fd)
      if (r?.error) {
        setMsg({ ok: false, text: r.error })
      } else {
        setMsg({ ok: true, text: '✅ ¡Solicitud enviada! Te contactaremos pronto.' })
        setSent(true)
      }
    })
  }

  return (
    <div className="contact-form-wrapper">
      <button
        type="button"
        className="contact-form-toggle link-card"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="link-icon" data-platform="other">
          <i className="fa-solid fa-file-invoice-dollar"></i>
        </div>
        <span className="link-text">{title}</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} arrow-icon`}></i>
      </button>

      {open && (
        <div className="contact-form-body">
          {description && <p className="bio text-sm mb-05rem">{description}</p>}
          {sent ? (
            <p className="text-success text-center">{msg?.text}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <input type="hidden" name="username" value={username} />
              <div className="input-group">
                <label htmlFor="qf-name">Nombre *</label>
                <input id="qf-name" name="name" type="text" required placeholder="Tu nombre" />
              </div>
              <div className="input-group">
                <label htmlFor="qf-email">Email *</label>
                <input id="qf-email" name="email" type="email" required placeholder="tu@email.com" />
              </div>
              {fields.map(f => (
                <div key={f} className="input-group">
                  <label htmlFor={`qf-${f}`}>{f}</label>
                  <input id={`qf-${f}`} name={`field_${f}`} type="text" placeholder={f} />
                </div>
              ))}
              {msg && !msg.ok && <p className="text-error">{msg.text}</p>}
              <button type="submit" className="btn-primary w-full" disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
