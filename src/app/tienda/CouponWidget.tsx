'use client'

import { useState, useTransition } from 'react'
import { validateCoupon, redeemCoupon, type CouponContext } from '@/app/actions/coupons'

const WA_NUMBER = '5491100000000'

function buildWaLink(text: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}

function formatPrice(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

interface Props {
  context: CouponContext
  basePrice: number
  /** Mensaje base de WhatsApp que se envía sin cupón */
  baseWaMsg: string
  /** Etiqueta del botón de compra */
  buyLabel: string
  /** Clase CSS del botón */
  btnClass: string
  /** Ícono FontAwesome del botón */
  btnIcon: string
}

export default function CouponWidget({
  context, basePrice, baseWaMsg, buyLabel, btnClass, btnIcon,
}: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<
    | { state: 'idle' }
    | { state: 'valid'; discountPct: number; description: string | null }
    | { state: 'error'; message: string }
  >({ state: 'idle' })
  const [redeemed, setRedeemed] = useState(false)
  const [isPending, startTransition] = useTransition()

  const discountPct = status.state === 'valid' ? status.discountPct : 0
  const discountAmount = Math.round(basePrice * discountPct / 100)
  const finalPrice = basePrice - discountAmount

  function handleValidate(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setStatus({ state: 'idle' })
    startTransition(async () => {
      const res = await validateCoupon(code, context)
      if (res.valid) {
        setStatus({ state: 'valid', discountPct: res.discountPct, description: res.description })
      } else {
        setStatus({ state: 'error', message: res.error })
      }
    })
  }

  function handleRemoveCoupon() {
    setCode('')
    setStatus({ state: 'idle' })
    setRedeemed(false)
  }

  function buildFinalWaMsg() {
    if (status.state !== 'valid') return baseWaMsg
    return `${baseWaMsg}\n🏷️ Cupón aplicado: ${code.toUpperCase()} (${discountPct}% off)\nPrecio final: ${formatPrice(finalPrice)}`
  }

  async function handleBuy() {
    if (status.state === 'valid' && !redeemed) {
      // Registrar el uso del cupón al hacer clic en comprar
      startTransition(async () => {
        const res = await redeemCoupon(code, context)
        if (res.success) setRedeemed(true)
        // Si falla el registro no bloqueamos al usuario — el WA ya abrió
      })
    }
  }

  return (
    <div className="cw-root">
      {/* Precio con descuento */}
      <div className="cw-price-display">
        {status.state === 'valid' ? (
          <>
            <div className="cw-price-original">{formatPrice(basePrice)}</div>
            <div className="cw-price-final">
              {formatPrice(finalPrice)}
              <span className="cw-discount-badge">−{discountPct}%</span>
            </div>
            {discountAmount > 0 && (
              <div className="cw-saving">Ahorrás {formatPrice(discountAmount)}</div>
            )}
          </>
        ) : (
          <div className="cw-price-base">{formatPrice(basePrice)}</div>
        )}
      </div>

      {/* Input de cupón */}
      {status.state !== 'valid' ? (
        <form className="cw-form" onSubmit={handleValidate}>
          <input
            type="text"
            className="cw-input"
            placeholder="Tenés un cupón? Ej: LAUNCH20"
            value={code}
            onChange={e => {
              setCode(e.target.value.toUpperCase())
              setStatus({ state: 'idle' })
            }}
            aria-label="Código de cupón"
            maxLength={40}
            autoComplete="off"
          />
          <button
            type="submit"
            className="cw-apply-btn"
            disabled={isPending || !code.trim()}
          >
            {isPending ? '...' : 'Aplicar'}
          </button>
        </form>
      ) : (
        <div className="cw-coupon-applied">
          <i className="fa-solid fa-tag" />
          <span>
            <strong>{code.toUpperCase()}</strong>
            {status.description && <> · {status.description}</>}
          </span>
          <button type="button" className="cw-remove-btn" onClick={handleRemoveCoupon} title="Quitar cupón">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {status.state === 'error' && (
        <p className="cw-error">
          <i className="fa-solid fa-circle-exclamation" /> {status.message}
        </p>
      )}

      {/* Botón de compra */}
      <a
        href={buildWaLink(buildFinalWaMsg())}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        onClick={handleBuy}
      >
        <i className={`fa-solid ${btnIcon}`} />
        {buyLabel}
        {status.state === 'valid' && (
          <span className="cw-btn-price-tag">{formatPrice(finalPrice)}</span>
        )}
      </a>
    </div>
  )
}
