const rateLimits = new Map<string, number>()

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const last = rateLimits.get(ip)
  if (last && now - last < 1000) return false
  rateLimits.set(ip, now)
  // Evict stale entries once the map grows large to prevent unbounded memory growth
  if (rateLimits.size > 10_000) {
    for (const [k, t] of rateLimits) if (now - t > 1000) rateLimits.delete(k)
  }
  return true
}
