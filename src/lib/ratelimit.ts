type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()

  // Lazy cleanup: sweep expired entries when the store gets large
  if (store.size > 500) {
    for (const [k, entry] of store) {
      if (now > entry.resetAt) store.delete(k)
    }
  }

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
