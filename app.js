require('dotenv').config()
const express      = require('express')
const path         = require('path')
const session      = require('express-session')
const MemoryStore  = require('memorystore')(session)
const compression  = require('compression')
const rateLimit    = require('express-rate-limit')
const connectDB    = require('./config/db')
const { loadUser } = require('./middleware/auth')
const app = express()
connectDB()
// limit chung
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
})

// login limit (chống brute force)
const loginLimiter = rateLimit({
 windowMs: 10 * 60 * 1000,  // 10 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
   message: { success: false, message: 'Qua nhieu lan dang nhap, thu lai sau 15 phut.' }
})

// order limit
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50
})

// ── 1. COMPRESSION ────────────────────────────────────────
// Gzip tất cả responses > 1KB — giảm 60-80% băng thông
// Phải đặt TRƯỚC static và routes
app.use(compression({
  level:     6,       // 1–9 (6 = balance tốt nhất speed/ratio)
  threshold: 1024,    // bytes — không nén file nhỏ hơn 1KB
  filter: (req, res) => {
    // Không nén response đã được nén (ảnh, zip...)
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))

// ── 2. VIEW ENGINE ────────────────────────────────────────
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
if (process.env.NODE_ENV === 'production') app.enable('view cache')

// ── 3. STATIC FILES ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge:       process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag:         true,
  lastModified: true,
  // Phục vụ pre-compressed nếu có file .gz
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Vary', 'Accept-Encoding')
    }
  }
}))

// ── 4. BODY PARSERS ───────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(express.json({ limit: '2mb' }))

// ── 5. SESSION ────────────────────────────────────────────
// Lưu ý: khi dùng PM2 cluster, session lưu RAM của từng worker
// → các worker KHÔNG share session với nhau
// → cần dùng sticky sessions hoặc external store (Redis) nếu cần
// → Hiện tại: dùng sticky sessions qua PM2 (cấu hình trong ecosystem.config.js)
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fruitshop-secret-change-this',
  resave:            false,
  saveUninitialized: false,
  // MemoryStore với TTL — không leak memory như default store
  // Lưu ý: mỗi PM2 worker có store riêng (không share)
  // Dùng sticky sessions trong PM2 để user luôn vào đúng worker
  store: new MemoryStore({ checkPeriod: 86400000 }),  // dọn session hết hạn mỗi 24h
  cookie: {
    maxAge:   86400000,
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}))

// ── 6. RATE LIMITING ──────────────────────────────────────
// Chặn một IP gửi quá nhiều request — bảo vệ khỏi flood/DDoS nhỏ
// ── 6. RATE LIMITING ──────────────────────────────────────
// Mục tiêu: chặn bot/scraper/DDoS, KHÔNG ảnh hưởng user thật
//
// Thực tế traffic:
//   - 1 user thật: ~0.2–0.3 req/s = ~15–20 req/phút
//   - 300 user từ 300 IP khác nhau → mỗi IP chỉ ~20 req/phút → không bị chặn
//   - Artillery test từ 1 IP → 6000 req/phút → bị chặn đúng
//
// Kết quả test: server xử lý ổn 60 req/s (mean 35ms, p95 50ms)
// Rate limit không ảnh hưởng gì đến capacity thật — chỉ ảnh hưởng test tool

const limiter = rateLimit({
  windowMs: 60 * 1000,   // cửa sổ 1 phút
  max:      300,         // 300 req/phút/IP = 5 req/s — 1 user thật không bao giờ đạt
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Dùng IP thực (khi có Nginx/proxy ở trước)
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  message: { success: false, message: 'Qua nhieu request, vui long thu lai sau.' },
  skip: (req) => {
    // Bỏ qua static files — không tính vào limit
    if (req.path.match(/\.(css|js|png|jpg|ico|webp|woff2?)$/)) return true
    // Bỏ qua admin đã đăng nhập
    if (req.path.startsWith('/admin') && req.session?.role === 'admin') return true
    return false
  }
})

// // Login giữ chặt để chống brute-force
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,  // 15 phút
//   max:      20,               // 20 lần/15 phút/IP
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   message: { success: false, message: 'Qua nhieu lan dang nhap, thu lai sau 15 phut.' }
// })

app.use(limiter)
app.use('/auth/login',  loginLimiter)
app.use('/admin/login', loginLimiter)

// ── 7. GLOBAL MIDDLEWARE ──────────────────────────────────
app.use(loadUser)

// ── 8. ROUTES ─────────────────────────────────────────────
app.use('/',      require('./routes/shop'))
app.use('/auth',  require('./routes/auth'))
app.use('/',      require('./routes/orders'))
app.use('/ai',    require('./routes/ai'))
app.use('/admin', require('./routes/admin'))

// ── 9. ERROR HANDLERS ─────────────────────────────────────
app.use((req, res) => res.status(404).render('pages/404', { title: '404' }))

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message)
  if (res.headersSent) return next(err)
  res.status(500).json({ success: false, message: 'Loi he thong' })
})

// ── 10. START ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000

// Graceful shutdown — đóng connections trước khi thoát
const server = app.listen(PORT, () => {
  const pid = process.pid
  console.log(`\n🍊 FruitShop  → http://localhost:${PORT}  [pid ${pid}]`)
  console.log(`🔐 Admin      → http://localhost:${PORT}/admin/login`)
  console.log(`⚡ Node env   → ${process.env.NODE_ENV || 'development'}\n`)
})

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`)
  server.close(() => {
    require('mongoose').connection.close(false, () => {
      console.log('✅ Connections closed. Bye!')
      process.exit(0)
    })
  })
  // Force exit nếu quá 10s
  setTimeout(() => process.exit(1), 10000)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

module.exports = app
