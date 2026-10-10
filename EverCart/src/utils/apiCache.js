// High-performance client-side in-memory cache for instant UI rendering
const clientCache = new Map()
const DEFAULT_TTL_MS = 60000 // 60 seconds cache

export async function fetchCached(url, options = {}, ttl = DEFAULT_TTL_MS) {
  const now = Date.now()
  const cached = clientCache.get(url)
  
  if (cached && now - cached.timestamp < ttl) {
    return cached.data
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`)
  }
  const data = await res.json()
  clientCache.set(url, { data, timestamp: now })
  return data
}

export function clearClientCache(prefix) {
  if (!prefix) {
    clientCache.clear()
    return
  }
  for (const key of clientCache.keys()) {
    if (key.includes(prefix)) {
      clientCache.delete(key)
    }
  }
}
