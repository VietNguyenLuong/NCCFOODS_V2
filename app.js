require('dotenv').config()
const express      = require('express')
const path         = require('path')
const session      = require('express-session')
const MongoStore = require('connect-mongo').default
const compression  = require('compression')
const rateLimit    = require('express-rate-limit')
const connectDB    = require('./config/db')
const { loadUser } = require('./middleware/auth')
const mongoose     = require('mongoose')
 
const app = express()
connectDB()
 
// ── 1. COMPRESSION ───────────────────────────────────────
app.use(compression({
  level:     6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))
 
// ── 2. VIEW ENGINE ───────────────────────────────────────
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
if (process.env.NODE_ENV === 'production') app.enable('view cache')
 
// ── 3. STATIC FILES ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge:       process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag:         true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Vary', 'Accept-Encoding')
    }
  }
}))
 
// ── 4. BODY PARSERS ──────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(express.json({ limit: '2mb' }))
 
// ── 5. SESSION — MongoStore (share giữa tất cả PM2 workers) ──
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fruitshop-secret-change-this',
  resave:            false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl:       process.env.MONGODB_URI,
    dbName:         'nccfood',
    collectionName: 'sessions',
    ttl:            86400,       // session tồn tại 24h
    autoRemove:     'native',    // MongoDB tự xóa session hết hạn
    touchAfter:     3600,        // chỉ update session mỗi 1h — giảm writes
  }),
  cookie: {
    maxAge:   86400000,
    httpOnly: true,
    secure:   false,             // false vì chưa có HTTPS
    sameSite: 'lax'
  }
}))
 
// ── 6. RATE LIMITING ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max:      300,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  message: { success: false, message: 'Qua nhieu request, vui long thu lai sau.' },
  skip: (req) => {
    if (req.path.match(/\.(css|js|png|jpg|ico|webp|woff2?)$/)) return true
    if (req.path.startsWith('/admin') && req.session?.role === 'admin') return true
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true
    return false
  }
})
 
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Qua nhieu lan dang nhap, thu lai sau 10 phut.' }
})
 
const loginAdminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Ban thu dang nhap qua nhieu lan. Thu lai sau 5 phut.' }
})
 
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      50
})
 
app.use(limiter)
app.use('/auth/login',   loginLimiter)
app.use('/admin/login',  loginAdminLimiter)
app.use('/orders',       orderLimiter)
 
// ── 7. NO-CACHE cho trang cần auth ───────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/admin') ||
      req.path.startsWith('/my-orders') ||
      req.path.startsWith('/cart') ||
      req.path.startsWith('/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  next()
})
 
// ── 8. GLOBAL MIDDLEWARE ─────────────────────────────────
app.use(loadUser)
 
// ── 9. ROUTES ────────────────────────────────────────────
app.use('/',      require('./routes/shop'))
app.use('/auth',  require('./routes/auth'))
app.use('/',      require('./routes/orders'))
app.use('/ai',    require('./routes/ai'))
app.use('/admin', require('./routes/admin'))
 
// ── 10. ERROR HANDLERS ───────────────────────────────────
app.use((req, res) => res.status(404).render('pages/404', { title: '404' }))
 
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message)
  if (res.headersSent) return next(err)
  res.status(500).json({ success: false, message: 'Loi he thong' })
})
 
// ── 11. START + GRACEFUL SHUTDOWN ────────────────────────
const PORT   = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`\n🍊 FruitShop  → http://localhost:${PORT}  [pid ${process.pid}]`)
  console.log(`🔐 Admin      → http://localhost:${PORT}/admin/login`)
  console.log(`⚡ Node env   → ${process.env.NODE_ENV || 'development'}\n`)
})
 
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`)
  server.close(async () => {
    try {
      await mongoose.connection.close()
      console.log('✅ Connections closed. Bye!')
      process.exit(0)
    } catch (err) {
      console.error('Shutdown error:', err)
      process.exit(1)
    }
  })
  setTimeout(() => process.exit(1), 10000)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
 
module.exports = app