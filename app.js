require('dotenv').config()
const express = require('express')
const path    = require('path')
const session = require('express-session')
const connectDB = require('./config/db')
const { loadUser } = require('./middleware/auth')
const compression = require('compression')

const app = express()
connectDB()
app.use(compression())
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({ secret: process.env.SESSION_SECRET||'fs-secret', resave: false, saveUninitialized: false, cookie: { maxAge: 86400000 } }))
app.use(loadUser)

app.use('/',      require('./routes/shop'))
app.use('/auth',  require('./routes/auth'))
app.use('/',      require('./routes/orders'))
app.use('/ai',    require('./routes/ai'))
app.use('/admin', require('./routes/admin'))

app.use((req, res) => res.status(404).render('pages/404', { title: '404' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`\n🍊 FruitShop → http://localhost:${PORT}`)
  console.log(`🔐 Admin     → http://localhost:${PORT}/admin/login\n`)
})
