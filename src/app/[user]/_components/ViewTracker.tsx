'use client'

import { useEffect } from 'react'

export default function ViewTracker({ username }: { username: string }) {
  useEffect(() => {
    const controller = new AbortController()
    // Pequeño delay para no competir con los recursos críticos de la página
    const timer = setTimeout(() => {
      fetch(`/api/view/${username}`, {
        method: 'POST',
        signal: controller.signal,
      }).catch(() => null)
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [username])

  return null
}
