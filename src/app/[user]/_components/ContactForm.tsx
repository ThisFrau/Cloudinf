'use client'

import { useState, useRef } from 'react'
import { sendContactMessage } from '@/app/actions/dashboard'

export default function ContactForm({
  username,
  askName = true,
  askEmail = true,
  askPhone = false,
  askMessage = true
}: {
  username: string;
  askName?: boolean;
  askEmail?: boolean;
  askPhone?: boolean;
  askMessage?: boolean;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    setIsPending(true)
    const fd = new FormData(e.currentTarget)
    fd.set('username', username)
    const result = await sendContactMessage(fd)
    setIsPending(false)
    if (result?.error) setMsg({ ok: false, text: result.error })
    else { setMsg({ ok: true, text: '✅ Mensaje enviado. ¡Gracias!' }); (e.target as HTMLFormElement).reset() }
  }

  return (
    <section className="contact-form-section">
      <button 
        type="button"
        className="contact-form-header cursor-pointer justify-between flex-wrap-center w-full"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span><i className="fa-solid fa-envelope mr-8px"></i>Enviar un Mensaje</span>
        <i className={`fa-solid fa-chevron-down contact-form-chevron ${isOpen ? 'contact-form-chevron-open' : ''}`}></i>
      </button>
      
      <div
        ref={formRef}
        className={`contact-form-body ${isOpen ? 'contact-form-body-open' : ''}`}
      >
        <form onSubmit={handleSubmit} className="booking-public-form contact-form-inner">
          {askName && (
            <div className="input-group">
              <label htmlFor="cf-name">Tu Nombre</label>
              <input id="cf-name" name="name" type="text" placeholder="Juan Pérez" required />
            </div>
          )}
          {askEmail && (
            <div className="input-group">
              <label htmlFor="cf-email">Tu Email</label>
              <input id="cf-email" name="email" type="email" placeholder="tu@email.com" required />
            </div>
          )}
          {askPhone && (
            <div className="input-group">
              <label htmlFor="cf-phone">Tu Teléfono / WhatsApp</label>
              <input id="cf-phone" name="phone" type="tel" placeholder="+54 9 11..." required />
            </div>
          )}
          {askMessage && (
            <div className="input-group">
              <label htmlFor="cf-message">Mensaje</label>
              <textarea id="cf-message" name="message" rows={4} placeholder="Escribe tu mensaje aquí..." required />
            </div>
          )}
          {msg && <p className={msg.ok ? 'text-success' : 'text-error'}>{msg.text}</p>}
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      </div>
    </section>
  )
}
