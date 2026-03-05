/**
 * cache.js — In-memory TTL cache với stampede protection
 *
 * Vấn đề với PM2 cluster (2 workers):
 *   - Worker 1 cache hit → 0 DB query
 *   - Worker 2 cache miss → 1 DB query
 *   - Worst case: N workers × 1 miss lần đầu → sau đó tất cả cache warm
 *
 * Cache stampede protection:
 *   Nhiều request đến cùng lúc khi cache miss → chỉ 1 request query DB
 *   Các request còn lại chờ kết quả từ request đầu tiên
 */

const store    = new Map()
const inflight = new Map()   // track đang-query-DB để tránh stampede

// Dọn entries hết hạn mỗi 2 phút
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) {
    if (now > v.expiresAt) store.delete(k)
  }
}, 2 * 60 * 1000).unref()   // .unref() — không giữ process sống nếu không còn gì khác

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

  /**
   * getOrSet — Stampede-safe cache fetch
   * Nếu cache miss, chỉ gọi fn() 1 lần dù có nhiều request đồng thời
   *
   * @param {string} key
   * @param {Function} fn  async function trả về data cần cache
   * @param {number} ttlSecs
   */
  async getOrSet(key, fn, ttlSecs = 60) {
    // Cache hit → trả về ngay
    const hit = this.get(key)
    if (hit !== undefined) return hit

    // Đang có request khác query DB cho key này → chờ kết quả
    if (inflight.has(key)) return inflight.get(key)

    // Lần đầu cache miss → query DB
    const promise = fn().then(data => {
      // KHÔNG cache null/undefined — tránh cache 404 nhầm
      if (data !== null && data !== undefined) {
        this.set(key, data, ttlSecs)
      }
      inflight.delete(key)
      return data
    }).catch(err => {
      inflight.delete(key)
      throw err
    })

    inflight.set(key, promise)
    return promise
  },

  del(key)         { store.delete(key); inflight.delete(key) },
  delByPrefix(pfx) {
    for (const k of store.keys())    if (k.startsWith(pfx)) store.delete(k)
    for (const k of inflight.keys()) if (k.startsWith(pfx)) inflight.delete(k)
  },
  flush()  { store.clear(); inflight.clear() },
  stats()  { return { cached: store.size, inflight: inflight.size, keys: [...store.keys()] } }
}

module.exports = cache
