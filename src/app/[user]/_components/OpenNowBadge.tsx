'use client'

import { useEffect, useState } from 'react'

const DAY_NAMES: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
  jueves: 4, viernes: 5, sábado: 6, sabado: 6,
}

function parseHours(hoursText: string): { open: boolean; closesInMin?: number } {
  const now = new Date()
  const currentDay = now.getDay()
  const currentMin = now.getHours() * 60 + now.getMinutes()

  if (!hoursText || hoursText.toLowerCase().includes('cerrado')) return { open: false }

  const lines = hoursText.split('\n')
  for (const line of lines) {
    const lower = line.toLowerCase()
    const dayEntry = Object.entries(DAY_NAMES).find(([name]) => lower.startsWith(name))
    if (!dayEntry) continue
    if (dayEntry[1] !== currentDay) continue

    const timeMatch = line.match(/(\d{1,2}):(\d{2})hs?\s+a\s+(\d{1,2}):(\d{2})hs?/i)
    if (!timeMatch) continue

    const openMin = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2])
    const closeMin = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4])

    if (currentMin >= openMin && currentMin < closeMin) {
      return { open: true, closesInMin: closeMin - currentMin }
    }
  }
  return { open: false }
}

export default function OpenNowBadge({ hoursText }: { hoursText: string }) {
  const [status, setStatus] = useState(() => parseHours(hoursText))

  useEffect(() => {
    const interval = setInterval(() => setStatus(parseHours(hoursText)), 60_000)
    return () => clearInterval(interval)
  }, [hoursText])

  const closesIn = status.closesInMin
  const closingSoon = closesIn !== undefined && closesIn <= 60

  return (
    <span className={`open-now-badge ${status.open ? (closingSoon ? 'closing-soon' : 'is-open') : 'is-closed'}`}>
      <span className="open-now-dot" />
      {status.open
        ? closingSoon
          ? `Cierra en ${closesIn} min`
          : 'Abierto ahora'
        : 'Cerrado ahora'}
    </span>
  )
}
