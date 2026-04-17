'use client'

import { useState } from 'react'
import { sendContactMessage } from '@/app/actions/dashboard'

export default function ContactForm({ username }: { username: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

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
      <h2 className="booking-public-title"><i className="fa-solid fa-envelope mr-8px"></i>Enviar un Mensaje</h2>
      <form onSubmit={handleSubmit} className="booking-public-form">
        <div className="input-group">
          <label htmlFor="cf-name">Tu Nombre</label>
          <input id="cf-name" name="name" type="text" placeholder="Juan Pérez" required />
        </div>
        <div className="input-group">
          <label htmlFor="cf-email">Tu Email</label>
          <input id="cf-email" name="email" type="email" placeholder="tu@email.com" required />
        </div>
        <div className="input-group">
          <label htmlFor="cf-message">Mensaje</label>
          <textarea id="cf-message" name="message" rows={4} placeholder="Escribe tu mensaje aquí..." required />
        </div>
        {msg && <p className={msg.ok ? 'text-success' : 'text-error'}>{msg.text}</p>}
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar Mensaje'}
        </button>
      </form>
    </section>
  )
}
