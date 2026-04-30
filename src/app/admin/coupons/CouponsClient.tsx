'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import '@/app/admin/admin.css'
import {
  adminCreateCoupon, adminUpdateCoupon,
  adminToggleCoupon, adminDeleteCoupon,
} from '@/app/actions/coupons'

type CouponRow = {
  id: string
  code: string
  discountPct: number
  maxUses: number | null
  usedCount: number
  expiresAt: Date | null
  active: boolean
  appliesTo: string
  description: string | null
  createdAt: Date
  _count: { usages: number }
}

const APPLIES_LABELS: Record<string, string> = {
  all: 'Todo',
  nfc: 'Solo NFC',
  subscription: 'Solo suscripción',
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`adm-badge ${active ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function usesDisplay(c: CouponRow) {
  if (c.maxUses === null) return `${c.usedCount} / ∞`
  const left = c.maxUses - c.usedCount
  return `${c.usedCount} / ${c.maxUses} (${left} restantes)`
}

function toDateInputValue(d: Date | null) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 16)
}

interface FormState {
  code: string
  discountPct: string
  maxUses: string
  expiresAt: string
  appliesTo: string
  description: string
  active: string
}

const EMPTY_FORM: FormState = {
  code: '', discountPct: '20', maxUses: '',
  expiresAt: '', appliesTo: 'all',
  description: '', active: 'true',
}

function couponToForm(c: CouponRow): FormState {
  return {
    code: c.code,
    discountPct: String(c.discountPct),
    maxUses: c.maxUses !== null ? String(c.maxUses) : '',
    expiresAt: toDateInputValue(c.expiresAt),
    appliesTo: c.appliesTo,
    description: c.description ?? '',
    active: String(c.active),
  }
}

export default function CouponsClient({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons, setCoupons] = useState<CouponRow[]>(initialCoupons)
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMsg(null)
    setMode('create')
  }

  function openEdit(c: CouponRow) {
    setForm(couponToForm(c))
    setEditingId(c.id)
    setMsg(null)
    setMode('edit')
  }

  function field(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      let res
      if (mode === 'create') {
        res = await adminCreateCoupon(fd)
      } else {
        res = await adminUpdateCoupon(editingId!, fd)
      }

      if (res?.error) {
        setMsg({ ok: false, text: res.error })
      } else if (res?.success && res.coupon) {
        setMsg({ ok: true, text: mode === 'create' ? '✅ Cupón creado.' : '✅ Cupón actualizado.' })
        // Actualizar lista local
        if (mode === 'create') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCoupons(prev => [res.coupon as any, ...prev])
        } else {
          setCoupons(prev => prev.map(c =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            c.id === editingId ? { ...c, ...(res.coupon as any) } : c
          ))
        }
        if (mode === 'create') {
          setForm(EMPTY_FORM)
        }
      }
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await adminToggleCoupon(id)
      if (res?.success) {
        setCoupons(prev => prev.map(c =>
          c.id === id ? { ...c, active: res.active! } : c
        ))
      }
    })
  }

  function handleDelete(id: string, code: string) {
    if (!confirm(`¿Eliminar el cupón "${code}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const res = await adminDeleteCoupon(id)
      if (res?.success) {
        setCoupons(prev => prev.filter(c => c.id !== id))
        if (editingId === id) setMode('list')
      }
    })
  }

  const filtered = coupons.filter(c =>
    c.code.includes(search.toUpperCase()) ||
    (c.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const now = new Date()
  const activeCoupons = coupons.filter(c => c.active && (!c.expiresAt || new Date(c.expiresAt) > now))
  const totalUses = coupons.reduce((s, c) => s + c.usedCount, 0)

  return (
    <main className="adm-root">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-header-left">
          <Link href="/dashboard" className="adm-back">
            <i className="fa-solid fa-arrow-left" /> Dashboard
          </Link>
          <h1 className="adm-title">
            <i className="fa-solid fa-tag" /> Gestión de Cupones
          </h1>
        </div>
        <button className="adm-btn-create" onClick={openCreate}>
          <i className="fa-solid fa-plus" /> Nuevo cupón
        </button>
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat">
          <span className="adm-stat-value">{coupons.length}</span>
          <span className="adm-stat-label">Total cupones</span>
        </div>
        <div className="adm-stat">
          <span className="adm-stat-value adm-stat-green">{activeCoupons.length}</span>
          <span className="adm-stat-label">Activos y vigentes</span>
        </div>
        <div className="adm-stat">
          <span className="adm-stat-value adm-stat-purple">{totalUses}</span>
          <span className="adm-stat-label">Usos totales</span>
        </div>
      </div>

      <div className="adm-body">
        {/* Lista */}
        <div className="adm-list-panel">
          <div className="adm-list-toolbar">
            <input
              type="text"
              className="adm-search"
              placeholder="Buscar por código o descripción…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="adm-empty">
              {coupons.length === 0
                ? 'No hay cupones aún. Creá el primero.'
                : 'Sin resultados para esa búsqueda.'}
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Dto.</th>
                    <th>Aplica a</th>
                    <th>Usos</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const expired = c.expiresAt && new Date(c.expiresAt) < now
                    const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses
                    return (
                      <tr key={c.id} className={editingId === c.id ? 'adm-row-selected' : ''}>
                        <td>
                          <span className="adm-code">{c.code}</span>
                          {c.description && (
                            <div className="adm-row-desc">{c.description}</div>
                          )}
                        </td>
                        <td className="adm-pct">{c.discountPct}%</td>
                        <td>{APPLIES_LABELS[c.appliesTo] ?? c.appliesTo}</td>
                        <td className={exhausted ? 'adm-exhausted' : ''}>
                          {usesDisplay(c)}
                        </td>
                        <td className={expired ? 'adm-expired' : ''}>
                          {c.expiresAt
                            ? new Date(c.expiresAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td><Badge active={c.active && !expired && !exhausted} /></td>
                        <td>
                          <div className="adm-row-actions">
                            <button
                              type="button"
                              className="adm-action-btn adm-action-edit"
                              title="Editar"
                              onClick={() => openEdit(c)}
                              disabled={isPending}
                            >
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button
                              type="button"
                              className={`adm-action-btn ${c.active ? 'adm-action-pause' : 'adm-action-play'}`}
                              title={c.active ? 'Desactivar' : 'Activar'}
                              onClick={() => handleToggle(c.id)}
                              disabled={isPending}
                            >
                              <i className={`fa-solid ${c.active ? 'fa-pause' : 'fa-play'}`} />
                            </button>
                            <button
                              type="button"
                              className="adm-action-btn adm-action-delete"
                              title="Eliminar"
                              onClick={() => handleDelete(c.id, c.code)}
                              disabled={isPending}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulario crear/editar */}
        {(mode === 'create' || mode === 'edit') && (
          <div className="adm-form-panel">
            <div className="adm-form-header">
              <h2>{mode === 'create' ? 'Nuevo cupón' : `Editar: ${form.code}`}</h2>
              <button
                type="button"
                className="adm-form-close"
                onClick={() => { setMode('list'); setEditingId(null); setMsg(null) }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="adm-form">
              {/* Código (solo en creación) */}
              {mode === 'create' && (
                <div className="adm-field">
                  <label htmlFor="adm-code">Código <span className="adm-req">*</span></label>
                  <input
                    id="adm-code"
                    name="code"
                    type="text"
                    placeholder="Ej: LAUNCH20, PROMO50"
                    value={form.code}
                    onChange={e => field('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    required
                    maxLength={40}
                    className="adm-input"
                  />
                  <small className="adm-hint">Letras mayúsculas, números, guiones y guiones bajos.</small>
                </div>
              )}

              {/* Descuento */}
              <div className="adm-field">
                <label htmlFor="adm-discount">Descuento (%) <span className="adm-req">*</span></label>
                <div className="adm-input-row">
                  <input
                    id="adm-discount"
                    name="discountPct"
                    type="number"
                    min={1}
                    max={100}
                    value={form.discountPct}
                    onChange={e => field('discountPct', e.target.value)}
                    required
                    className="adm-input adm-input-short"
                  />
                  <span className="adm-input-suffix">%</span>
                </div>
              </div>

              {/* Límite de usos */}
              <div className="adm-field">
                <label htmlFor="adm-maxuses">Límite de usos</label>
                <input
                  id="adm-maxuses"
                  name="maxUses"
                  type="number"
                  min={1}
                  placeholder="Vacío = ilimitado"
                  value={form.maxUses}
                  onChange={e => field('maxUses', e.target.value)}
                  className="adm-input"
                />
              </div>

              {/* Vencimiento */}
              <div className="adm-field">
                <label htmlFor="adm-expires">Fecha de vencimiento</label>
                <input
                  id="adm-expires"
                  name="expiresAt"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => field('expiresAt', e.target.value)}
                  className="adm-input"
                />
                <small className="adm-hint">Dejar vacío = sin vencimiento.</small>
              </div>

              {/* Aplica a */}
              <div className="adm-field">
                <label htmlFor="adm-applies">Aplica a <span className="adm-req">*</span></label>
                <select
                  id="adm-applies"
                  name="appliesTo"
                  value={form.appliesTo}
                  onChange={e => field('appliesTo', e.target.value)}
                  className="adm-select"
                >
                  <option value="all">Todo (NFC + suscripciones)</option>
                  <option value="nfc">Solo tarjeta NFC</option>
                  <option value="subscription">Solo suscripciones</option>
                </select>
              </div>

              {/* Descripción */}
              <div className="adm-field">
                <label htmlFor="adm-desc">Descripción interna</label>
                <input
                  id="adm-desc"
                  name="description"
                  type="text"
                  placeholder="Ej: Campaña lanzamiento Q1 2026"
                  value={form.description}
                  onChange={e => field('description', e.target.value)}
                  className="adm-input"
                  maxLength={200}
                />
              </div>

              {/* Estado (solo en edición) */}
              {mode === 'edit' && (
                <div className="adm-field">
                  <label htmlFor="adm-active">Estado</label>
                  <select
                    id="adm-active"
                    name="active"
                    value={form.active}
                    onChange={e => field('active', e.target.value)}
                    className="adm-select"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}

              {msg && (
                <p className={`adm-msg ${msg.ok ? 'adm-msg-ok' : 'adm-msg-err'}`}>{msg.text}</p>
              )}

              <div className="adm-form-footer">
                <button type="submit" className="adm-btn-save" disabled={isPending}>
                  <i className="fa-solid fa-floppy-disk" />
                  {isPending ? 'Guardando…' : mode === 'create' ? 'Crear cupón' : 'Guardar cambios'}
                </button>
                {mode === 'edit' && editingId && (
                  <button
                    type="button"
                    className="adm-btn-delete"
                    disabled={isPending}
                    onClick={() => {
                      const c = coupons.find(x => x.id === editingId)
                      if (c) handleDelete(c.id, c.code)
                    }}
                  >
                    <i className="fa-solid fa-trash" /> Eliminar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
