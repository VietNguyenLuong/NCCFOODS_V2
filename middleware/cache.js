/**
 * cache.js — In-memory TTL cache (không cần Redis)
 * Dùng Map + expiresAt timestamp, tự dọn khi đọc
 */
const store = new Map()

const cache = {
  get(key) {
    const entry = store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) { store.delete(key); return undefined }
    return entry.value
  },

  set(key, value, ttlSecs = 60) {
    store.set(key, { value, expiresAt: Date.now() + ttlSecs * 1000 })
  },

  del(key)          { store.delete(key) },

  delByPrefix(pfx)  { for (const k of store.keys()) if (k.startsWith(pfx)) store.delete(k) },

  flush()           { store.clear() },

  stats()           { return { size: store.size, keys: [...store.keys()] } }
}

module.exports = cache
