/**
 * cache.js — In-memory TTL cache
 *
 * ⚠️  LƯU Ý KHI DÙNG PM2 CLUSTER:
 * Mỗi PM2 worker có RAM riêng → cache KHÔNG được share giữa các workers.
 * Worker A cache sản phẩm → Worker B vẫn query DB.
 *
 * Điều này VẪN OK vì:
 * 1. Giảm được số queries từ mỗi worker riêng lẻ
 * 2. Sau vài giây tất cả workers đều có warm cache
 * 3. Worst case: N workers × 1 DB query thay vì không cache
 *
 * Nếu muốn shared cache → thay bằng Redis:
 *   npm install ioredis
 *   Xem PERFORMANCE.md để biết cách migrate
 */

const store = new Map()

// Dọn dẹp entries hết hạn mỗi 5 phút — tránh memory leak
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) {
    if (now > v.expiresAt) store.delete(k)
  }
}, 5 * 60 * 1000)

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

  del(key)         { store.delete(key) },
  delByPrefix(pfx) { for (const k of store.keys()) if (k.startsWith(pfx)) store.delete(k) },
  flush()          { store.clear() },
  stats()          { return { size: store.size, keys: [...store.keys()] } }
}

module.exports = cache
