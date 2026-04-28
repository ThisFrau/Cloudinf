'use client'

import { useEffect, useRef, ReactNode } from 'react'

// Un único IntersectionObserver para todos los elementos de la página
// en lugar de crear uno por instancia.
let sharedObserver: IntersectionObserver | null = null
const callbacks = new Map<Element, () => void>()

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined') return null
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target)
            if (cb) {
              cb()
              sharedObserver?.unobserve(entry.target)
              callbacks.delete(entry.target)
            }
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
  }
  return sharedObserver
}

interface Props {
  children: ReactNode
  className?: string
  delay?: number
}

export default function ScrollReveal({ children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = getObserver()
    if (!observer) {
      el.classList.add('lp-revealed')
      return
    }
    callbacks.set(el, () => {
      if (delay) el.style.transitionDelay = `${delay}ms`
      el.classList.add('lp-revealed')
    })
    observer.observe(el)
    return () => {
      observer.unobserve(el)
      callbacks.delete(el)
    }
  }, [delay])

  return (
    <div ref={ref} className={`lp-reveal ${className}`}>
      {children}
    </div>
  )
}
