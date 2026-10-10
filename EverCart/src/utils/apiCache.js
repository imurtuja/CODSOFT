// High-performance client-side in-memory cache with concurrent request deduplication
const clientCache = new Map()
const pendingRequests = new Map()
const DEFAULT_TTL_MS = 60000 // 60 seconds cache

export async function fetchCached(url, options = {}, ttl = DEFAULT_TTL_MS) {
  const now = Date.now()
  const cached = clientCache.get(url)
  
  if (cached && now - cached.timestamp < ttl) {
    return cached.data
  }

  // Deduplicate concurrent in-flight requests for the exact same URL
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url)
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, options)
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`)
      }
      const data = await res.json()
      clientCache.set(url, { data, timestamp: Date.now() })
      return data
    } finally {
      pendingRequests.delete(url)
    }
  })()

  pendingRequests.set(url, promise)
  return promise
}

export function clearClientCache(prefix) {
  if (!prefix) {
    clientCache.clear()
    pendingRequests.clear()
    return
  }
  for (const key of clientCache.keys()) {
    if (key.includes(prefix)) {
      clientCache.delete(key)
    }
  }
  for (const key of pendingRequests.keys()) {
    if (key.includes(prefix)) {
      pendingRequests.delete(key)
    }
  }
}
