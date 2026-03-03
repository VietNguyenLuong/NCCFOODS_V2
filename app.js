require('dotenv').config()
const express    = require('express')
const path       = require('path')
const session    = require('express-session')
const connectDB  = require('./config/db')
const { loadUser } = require('./middleware/auth')

const app = express()
connectDB()

// ── VIEW ENGINE ───────────────────────────────────────────
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// Cache pug templates trong production
if (process.env.NODE_ENV === 'production') {
  app.enable('view cache')
}

// ── STATIC FILES ──────────────────────────────────────────
// Cache static files 7 ngày
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag:   true,
  lastModified: true
}))

// ── BODY PARSERS ──────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(express.json({ limit: '1mb' }))

// ── SESSION ───────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fs-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   86400000,  // 24h
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production'
  }
}))

// ── GLOBAL MIDDLEWARE ─────────────────────────────────────
app.use(loadUser)

// ── ROUTES ────────────────────────────────────────────────
app.use('/',      require('./routes/shop'))
app.use('/auth',  require('./routes/auth'))
app.use('/',      require('./routes/orders'))
app.use('/ai',    require('./routes/ai'))
app.use('/admin', require('./routes/admin'))

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).render('pages/404', { title: '404' }))

// ── ERROR HANDLER ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('pages/404', { title: 'Loi he thong' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`\n🍊 FruitShop  → http://localhost:${PORT}`)
  console.log(`🔐 Admin      → http://localhost:${PORT}/admin/login`)
  console.log(`📦 Node env   → ${process.env.NODE_ENV || 'development'}\n`)
})
