const User     = require('../models/User')
const Category = require('../models/Category')
const Product  = require('../models/Product')
const Order    = require('../models/Order')
const bcrypt   = require('bcryptjs')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/products')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, 'product-' + Date.now() + path.extname(file.originalname))
})
const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chi nhan file anh'))
})
exports.uploadProductImage = uploadProduct.single('image')

// ── AUTH ─────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  if (req.session?.role === 'admin') return res.redirect('/admin')
  res.render('admin/login', { title: 'Admin Login', error: null })
}
exports.postLogin = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' })
  if (!user || !(await user.matchPassword(password))) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Sai tai khoan hoac mat khau' })
  }
  req.session.userId = user._id.toString()
  req.session.role   = 'admin'
  req.session.name   = user.name
  res.redirect('/admin')
}
exports.logout = (req, res) => { req.session.destroy(); res.redirect('/admin/login') }

// ── DASHBOARD ────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const [totalCustomers, ordersMonth, totalShipped, totalPending, totalConfirmed, totalRevArr, monthlyRev] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.countDocuments({ status: 'shipped' }),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'confirmed' }),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { m: { $month: '$createdAt' }, y: { $year: '$createdAt' } }, rev: { $sum: '$total' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ])
  ])
  const stats = { totalCustomers, ordersMonth, totalShipped, totalPending, totalConfirmed, totalRevenue: totalRevArr[0]?.total || 0 }
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).lean()
  res.render('admin/dashboard', { title: 'Thong ke', admin: req.session, stats, monthlyRev, recentOrders, currentPage: 'dashboard' })
}

// ── USERS ────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean()
  res.render('admin/users', { title: 'Tai khoan', admin: req.session, users, currentPage: 'users' })
}
exports.addUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body
  try {
    const exists = await User.findOne({ email })
    if (exists) return res.json({ success: false, message: 'Email da ton tai' })
    await new User({ name, email, password, phone, role: role || 'user' }).save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}
exports.editUser = async (req, res) => {
  const { id, name, email, phone, role, password } = req.body
  const update = { name, email, phone, role }
  if (password) update.password = await bcrypt.hash(password, 10)
  await User.findByIdAndUpdate(id, update)
  res.json({ success: true })
}
exports.deleteUser = async (req, res) => {
  if (req.body.id === req.session.userId) return res.json({ success: false, message: 'Khong the xoa chinh minh' })
  await User.findByIdAndDelete(req.body.id)
  res.json({ success: true })
}

// ── CATEGORIES ───────────────────────────────────────────
exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 }).lean()
  res.render('admin/categories', { title: 'Danh muc', admin: req.session, categories, currentPage: 'categories' })
}
function makeSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-')
}
exports.addCategory = async (req, res) => {
  const { name, emoji, description } = req.body
  try {
    await new Category({ name, emoji: emoji || '🍎', description, slug: makeSlug(name) }).save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}
exports.editCategory = async (req, res) => {
  const { id, name, emoji, description } = req.body
  await Category.findByIdAndUpdate(id, { name, emoji, description, slug: makeSlug(name) })
  res.json({ success: true })
}
exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.body.id)
  res.json({ success: true })
}

// ── ORDERS ───────────────────────────────────────────────
const orderList = (status) => async (req, res) => {
  const { from, to } = req.query
  let filter = { status }
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = new Date(from)
    if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59))
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean()
   const page   = status === 'Chờ xác nhận' ? 'pending' : status === 'confirmed' ? 'confirmed' : 'shipped'
  const view   = `admin/orders-${status === 'pending' ? 'pending' : status === 'confirmed' ? 'confirmed' : 'shipped'}`
  res.render(view, { title: 'Don hang', admin: req.session, orders, currentPage: page, from: from||'', to: to||'' })
}
exports.getPendingOrders   = orderList('Chờ xác nhận')
exports.getConfirmedOrders = orderList('Đang lên đơn')
exports.getShippedOrders   = orderList('Đã gửi')

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) return res.redirect('/admin/orders/pending')
   const page = order.status === 'Chờ xác nhận' ? 'Chờ xác nhận' : order.status === 'Đang lên đơn' ? 'Đang lên đơn' : 'Đã gửi'
  res.render('admin/order-detail', { title: 'Chi tiet don hang', admin: req.session, order, currentPage: page })
}

const setStatus = (status, extraFields) => async (req, res) => {
  const update = { status, ...extraFields }
  if (status === 'Đang lên đơn') update.confirmedAt = new Date()
  if (status === 'Đã gửi')   update.shippedAt   = new Date()
  const doc = await Order.findById(req.params.id)
  if (!doc) return res.json({ success: false })
  if (status === 'Từ chối') update.statusBefore = doc.status
  if (status === 'Khách hàng hủy') update.statusBefore = doc.status
  await Order.findByIdAndUpdate(req.params.id, update)
  res.json({ success: true })
}
exports.confirmOrder = setStatus('Đang lên đơn')
exports.shipOrder    = setStatus('Đã gửi')
exports.cancelOrder  = setStatus('Từ chối')
exports.cancelUserOrder  = setStatus('Khách hàng hủy')
exports.restoreOrder = async (req, res) => {
  const doc = await Order.findById(req.params.id)
  if (!doc) return res.json({ success: false })
  await Order.findByIdAndUpdate(req.params.id, { status: doc.statusBefore || 'Chờ xác nhận' })
  res.json({ success: true })
}

// ── PRODUCTS ─────────────────────────

// ── PRODUCTS ──────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  const { q, cat, status } = req.query
  let filter = {}
  if (q)   filter.name = { $regex: q, $options: 'i' }
  if (cat) filter.category = cat
  if (status === 'active')   filter.isActive = true
  if (status === 'inactive') filter.isActive = false

  const [products, categories] = await Promise.all([
    Product.find(filter).populate('category').sort({ createdAt: -1 }).lean(),
    Category.find({ isActive: true }).lean()
  ])
  res.render('admin/products', {
    title: 'San pham', admin: req.session, products, categories,
    currentPage: 'products', q: q||'', cat: cat||'', status: status||''
  })
}

// Parse variants from form body: variantLabel[], variantPrice[]
function parseVariants(body) {
  const labels = [].concat(body.variantLabel || [])
  const prices = [].concat(body.variantPrice || [])
  const result = []
  for (let i = 0; i < labels.length; i++) {
    const lbl = (labels[i] || '').trim()
    const prc = parseFloat(prices[i])
    if (lbl && !isNaN(prc) && prc > 0) result.push({ label: lbl, price: prc })
  }
  return result
}

exports.addProduct = async (req, res) => {
  try {
    const { name, emoji, description, price, unit, origin, category, badge, isActive } = req.body
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim()
    let finalSlug = slug
    let count = 1
    while (await Product.findOne({ slug: finalSlug })) finalSlug = slug + '-' + count++

    const image    = req.file ? '/uploads/products/' + req.file.filename : ''
    const variants = parseVariants(req.body)
    await new Product({
      name: name.trim(), slug: finalSlug,
      emoji: emoji || '🍎',
      description: description || '',
      price: +price || 0,
      unit: unit || 'kg',
      origin: origin || '',
      category: category || null,
      badge: badge || '',
      image,
      variants,
      isActive: isActive === 'true' || isActive === true
    }).save()
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}

exports.editProduct = async (req, res) => {
  try {
    const { id, name, emoji, description, price, unit, origin, category, badge, isActive } = req.body
    const variants = parseVariants(req.body)
    const update = {
      name: name.trim(),
      emoji: emoji || '🍎',
      description: description || '',
      price: +price || 0,
      unit: unit || 'kg',
      origin: origin || '',
      category: category || null,
      badge: badge || '',
      variants,
      isActive: isActive === 'true' || isActive === true
    }
    if (req.file) {
      const old = await Product.findById(id).lean()
      if (old?.image) {
        const oldPath = path.join(__dirname, '../public', old.image)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      update.image = '/uploads/products/' + req.file.filename
    }
    await Product.findByIdAndUpdate(id, update)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.body.id).lean()
    if (p?.image) {
      const imgPath = path.join(__dirname, '../public', p.image)
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    }
    await Product.findByIdAndDelete(req.body.id)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}

exports.toggleProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.body.id)
    if (!p) return res.json({ success: false, message: 'Khong tim thay san pham' })
    await Product.findByIdAndUpdate(req.body.id, { isActive: !p.isActive })
    res.json({ success: true, isActive: !p.isActive })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}
