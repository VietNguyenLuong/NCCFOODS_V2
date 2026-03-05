require('dotenv').config()
const express      = require('express')
const path         = require('path')
const session      = require('express-session')
const MongoStore   = require('connect-mongo')
const rateLimit    = require('express-rate-limit')
const connectDB    = require('./config/db')
const { loadUser } = require('./middleware/auth')

const app = express()
connectDB()

// ── 1. COMPRESSION ────────────────────────────────────────
// Chỉ bật khi KHÔNG có Nginx ở trước (Nginx nén nhanh hơn Node.js)
// Khi có Nginx: tắt đi để tránh double-compress và tiết kiệm CPU
if (process.env.COMPRESSION === 'true') {
  const compression = require('compression')
  app.use(compression({ level: 6, threshold: 1024 }))
  console.log('⚡ Compression: Node.js (no Nginx)')
}

// ── 2. Trust proxy — lấy IP thật khi có Nginx ────────────
// Nginx set X-Forwarded-For → Express đọc được req.ip thật
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

// ── 3. VIEW ENGINE ────────────────────────────────────────
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
if (process.env.NODE_ENV === 'production') app.enable('view cache')

// ── 4. STATIC FILES ───────────────────────────────────────
// Khi có Nginx: Nginx phục vụ static, dòng này thành no-op
// Khi không có Nginx: Node.js tự phục vụ (chậm hơn nhưng vẫn chạy được)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge:       process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag:         true,
  lastModified: true,
}))

// ── 5. BODY PARSERS ───────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(express.json({ limit: '2mb' }))

// ── 6. SESSION ────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fruitshop-secret-change-this',
  resave:            false,
  saveUninitialized: false,
  // ── MongoStore — lưu session vào MongoDB ──────────────
  // Tất cả PM2 workers dùng chung 1 MongoDB → session không bị mất
  // khi request đến worker khác (giải quyết cluster session problem)
  store: MongoStore.create({
    mongoUrl:           process.env.MONGODB_URI || 'mongodb://localhost:27017/fruitshop',
    collectionName:     'sessions',
    ttl:                86400,      // session tồn tại 24h (giây)
    autoRemove:         'native',   // MongoDB tự xóa session hết hạn qua TTL index
    touchAfter:         3600,       // chỉ update session mỗi 1h dù user active
                                    // → giảm writes vào MongoDB đáng kể
  }),
  cookie: {
    maxAge:   86400000,
    httpOnly: true,
    // secure:   process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true',
    sameSite: 'lax'
  }
}))

// ── 7. RATE LIMITING ──────────────────────────────────────
// 300 req/phút/IP — user thật ~15 req/phút, không bao giờ chạm
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max:      300,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  message: { success: false, message: 'Qua nhieu request, thu lai sau.' },
  skip: (req) => {
    if (req.path.match(/\.(css|js|png|jpg|ico|webp|woff2?)$/)) return true
    if (req.path.startsWith('/admin') && req.session?.role === 'admin') return true
    return false
  }
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  message: { success: false, message: 'Qua nhieu lan dang nhap, thu lai sau 15 phut.' }
})

app.use(limiter)
app.use('/auth/login',  loginLimiter)
app.use('/admin/login', loginLimiter)

// ── 8. GLOBAL MIDDLEWARE ──────────────────────────────────
app.use(loadUser)

// ── 9. ROUTES ─────────────────────────────────────────────
app.use('/',      require('./routes/shop'))
app.use('/auth',  require('./routes/auth'))
app.use('/',      require('./routes/orders'))
app.use('/ai',    require('./routes/ai'))
app.use('/admin', require('./routes/admin'))

// ── 10. ERROR HANDLERS ────────────────────────────────────
app.use((req, res) => res.status(404).render('pages/404', { title: '404' }))
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message)
  if (res.headersSent) return next(err)
  res.status(500).json({ success: false, message: 'Loi he thong' })
})

// ── 11. START + GRACEFUL SHUTDOWN ─────────────────────────
const PORT   = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`\n🍊 FruitShop  → http://localhost:${PORT}  [pid ${process.pid}]`)
  console.log(`🔐 Admin      → http://localhost:${PORT}/admin/login`)
  console.log(`⚡ Node env   → ${process.env.NODE_ENV || 'development'}\n`)
})

const shutdown = (sig) => {
  console.log(`\n${sig} — shutting down...`)
  server.close(() => {
    require('mongoose').connection.close()
      .then(() => process.exit(0))
      .catch(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 8000)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

module.exports = app
