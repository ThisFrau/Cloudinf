'use client'

import { useState, useEffect } from 'react'

type BookingConfig = {
  title: string
  availableDays: string[]
  startTime: string
  endTime: string
  slotDuration: number
}

const DAY_KEYS: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = []
  let [h, m] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const endMin = eh * 60 + em
  while (h * 60 + m + duration <= endMin) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += duration
    h += Math.floor(m / 60)
    m = m % 60
  }
  return slots
}

export default function BookingSection({ username, title }: { username: string; title: string }) {
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/booking/${username}`)
      .then(r => r.json())
      .then(data => { if (data.config) setConfig(data.config) })
  }, [username])

  useEffect(() => {
    if (!selectedDate || !config) return
    setBookedSlots([])
    fetch(`/api/booking/${username}?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => setBookedSlots(data.bookedSlots || []))
  }, [selectedDate, username, config])

  if (!config) return null

  const today = new Date()
  const minDate = today.toISOString().split('T')[0]

  function isDateAvailable(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    const dayNum = d.getDay()
    return config!.availableDays.some(dk => DAY_KEYS[dk] === dayNum)
  }

  const availableSlots = selectedDate ? generateSlots(config.startTime, config.endTime, config.slotDuration) : []
  const freeSlots = availableSlots.filter(s => !bookedSlots.includes(s))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !name || !email) { setMsg({ ok: false, text: 'Completa todos los campos.' }); return }
    setSubmitting(true)
    const res = await fetch(`/api/booking/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, date: selectedDate, time: selectedTime, note }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.error) setMsg({ ok: false, text: data.error })
    else { setMsg({ ok: true, text: '✅ ¡Reserva enviada! Te confirmarán pronto.' }); setName(''); setEmail(''); setNote(''); setSelectedTime(''); setSelectedDate('') }
  }

  return (
    <section className="booking-public-section">
      <h2 className="booking-public-title"><i className="fa-solid fa-calendar mr-8px"></i>{title}</h2>
      <form onSubmit={handleSubmit} className="booking-public-form">
        <div className="input-group">
          <label htmlFor="booking-date">Seleccionar Fecha</label>
          <input
            id="booking-date"
            type="date"
            title="Seleccionar fecha de reserva"
            min={minDate}
            value={selectedDate}
            onChange={e => { const v = e.target.value; if (isDateAvailable(v)) { setSelectedDate(v); setSelectedTime('') } else { setMsg({ ok: false, text: 'Ese día no está disponible. Intenta con otro.' }); setTimeout(() => setMsg(null), 3000)} }}
            required
            className="booking-date-input"
          />
        </div>

        {selectedDate && freeSlots.length > 0 && (
          <div className="input-group">
            <label>Horario Disponible</label>
            <div className="slots-grid">
              {freeSlots.map(slot => (
                <button key={slot} type="button"
                  className={`slot-btn ${selectedTime === slot ? 'slot-active' : ''}`}
                  onClick={() => setSelectedTime(slot)}>
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedDate && freeSlots.length === 0 && (
          <p className="bio text-center">No quedan horarios disponibles para esta fecha.</p>
        )}

        {selectedTime && (
          <>
            <div className="input-group">
              <label>Tu Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" required />
            </div>
            <div className="input-group">
              <label>Tu Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div className="input-group">
              <label>Nota (Opcional)</label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="¿De qué quieres hablar?" />
            </div>
          </>
        )}

        {msg && <p className={msg.ok ? 'text-success' : 'text-error'}>{msg.text}</p>}
        {selectedTime && (
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Enviando...' : `Reservar ${selectedDate} a las ${selectedTime}`}
          </button>
        )}
      </form>
    </section>
  )
}
