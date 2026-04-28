'use client'

import React, { useState, useMemo } from 'react'

interface Props {
  defaultValue?: string
  name: string
}

const DAYS = [
  { id: 'mon', label: 'Lunes' },
  { id: 'tue', label: 'Martes' },
  { id: 'wed', label: 'Miércoles' },
  { id: 'thu', label: 'Jueves' },
  { id: 'fri', label: 'Viernes' },
  { id: 'sat', label: 'Sábado' },
  { id: 'sun', label: 'Domingo' }
]

function buildTextFromSchedule(sched: Record<string, { active: boolean, open: string, close: string }>): string {
  const parts: string[] = []
  let allClosed = true
  DAYS.forEach(d => {
    const s = sched[d.id]
    if (s.active) {
      parts.push(`${d.label}: ${s.open}hs a ${s.close}hs`)
      allClosed = false
    }
  })
  return allClosed ? 'Cerrado temporalmente' : parts.join('\n')
}

export default function HoursBuilder({ defaultValue = '', name }: Props) {
  const [mode, setMode] = useState<'text' | 'builder'>(() => !defaultValue ? 'builder' : 'text')
  const [textValue, setTextValue] = useState(defaultValue)

  const [schedule, setSchedule] = useState<Record<string, { active: boolean, open: string, close: string }>>(() => {
    const init: Record<string, { active: boolean, open: string, close: string }> = {}
    DAYS.forEach(d => {
      init[d.id] = { active: true, open: '09:00', close: '18:00' }
    })
    return init
  })

  const builderText = useMemo(() => buildTextFromSchedule(schedule), [schedule])
  const displayText = mode === 'builder' ? builderText : textValue

  const toggleDay = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      [id]: { ...prev[id], active: !prev[id].active }
    }))
  }

  const updateTime = (id: string, field: 'open' | 'close', val: string) => {
    setSchedule(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }))
  }

  return (
    <div className="hours-builder-container">
      <div className="flex-wrap-center justify-between mb-05rem">
        <label className="mb-0 hours-builder-label">Días y Horarios de Atención</label>
        <div className="hours-mode-toggle">
          <button
            type="button"
            className={`btn-tag ${mode === 'builder' ? 'active' : ''}`}
            onClick={() => setMode('builder')}
          >
            <i className="fa-solid fa-list-check"></i> Asistente
          </button>
          <button
            type="button"
            className={`btn-tag ${mode === 'text' ? 'active' : ''}`}
            onClick={() => { setMode('text'); setTextValue(builderText) }}
          >
            <i className="fa-solid fa-pen"></i> Texto Libre
          </button>
        </div>
      </div>

      <input type="hidden" name={name} value={displayText} />

      {mode === 'builder' ? (
        <div className="hours-builder-ui">
          {DAYS.map(day => {
            const s = schedule[day.id]
            return (
              <div key={day.id} className="hour-row">
                <label className="hour-day-toggle">
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={() => toggleDay(day.id)}
                  />
                  <span>{day.label}</span>
                </label>

                <div className={`hour-inputs ${!s.active ? 'disabled' : ''}`}>
                  {s.active ? (
                    <>
                      <input
                        type="time"
                        title={`Hora de apertura para ${day.label}`}
                        aria-label={`Hora de apertura para ${day.label}`}
                        value={s.open}
                        onChange={(e) => updateTime(day.id, 'open', e.target.value)}
                        className="time-input"
                      />
                      <span>a</span>
                      <input
                        type="time"
                        title={`Hora de cierre para ${day.label}`}
                        aria-label={`Hora de cierre para ${day.label}`}
                        value={s.close}
                        onChange={(e) => updateTime(day.id, 'close', e.target.value)}
                        className="time-input"
                      />
                    </>
                  ) : (
                    <span className="text-secondary opacity-70 text-sm">Cerrado</span>
                  )}
                </div>
              </div>
            )
          })}
          <div className="hours-preview mt-1rem p-1rem rounded-8px">
            <strong className="text-sm bio mb-05rem block">Vista previa de cómo se verá:</strong>
            <p className="pre-line text-sm">{builderText}</p>
          </div>
        </div>
      ) : (
        <textarea
          rows={5}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Ej: Lunes a Viernes de 09:00 a 18:00hs&#10;Sábados de 10:00 a 14:00hs"
          className="w-full form-textarea hours-builder-textarea"
        />
      )}
    </div>
  )
}
