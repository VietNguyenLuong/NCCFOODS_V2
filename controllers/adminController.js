const User     = require('../models/User')
const Category = require('../models/Category')
const Product  = require('../models/Product')
const Order    = require('../models/Order')
const bcrypt   = require('bcryptjs')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const cache    = require('../middleware/cache')

// ── MULTER ────────────────────────────────────────────────
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/products')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, 'product-' + Date.now() + path.extname(file.originalname))
})
exports.uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chi nhan file anh'))
}).single('image')

// ── AUTH ──────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  if (req.session?.role === 'admin') return res.redirect('/admin')
  res.render('admin/login', { title: 'Admin Login', error: null })
}

exports.postLogin = async (req, res) => {
  const { email, password } = req.body
  // lean() + select password → dùng bcrypt.compare trực tiếp
  const user = await User
    .findOne({ email: email.toLowerCase(), role: 'admin' })
    .select('name email password role isActive')
    .lean()

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Sai tai khoan hoac mat khau' })
  }
  req.session.userId = user._id.toString()
  req.session.role   = 'admin'
  req.session.name   = user.name
  res.redirect('/admin')
}

exports.logout = (req, res) => { req.session.destroy(); res.redirect('/admin/login') }

// ── DASHBOARD ─────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  let stats      = cache.get('admin:dashboard:stats')
  let monthlyRev = cache.get('admin:dashboard:monthly')

  if (!stats || !monthlyRev) {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const last6 = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // 7 queries chạy song song — mỗi query dùng đúng index
    const [tc, om, ts, tp, tconf, revArr, monthly] = await Promise.all([
      User .countDocuments({ role: 'user' }),
      Order.countDocuments({ createdAt: { $gte: start } }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: last6 }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { m: { $month: '$createdAt' }, y: { $year: '$createdAt' } }, rev: { $sum: '$total' } } },
        { $sort:  { '_id.y': 1, '_id.m': 1 } }
      ])
    ])

    stats      = { totalCustomers: tc, ordersMonth: om, totalShipped: ts, totalPending: tp, totalConfirmed: tconf, totalRevenue: revArr[0]?.total || 0 }
    monthlyRev = monthly
    cache.set('admin:dashboard:stats',   stats,      60)
    cache.set('admin:dashboard:monthly', monthlyRev, 60)
  }

  const recentOrders = await Order
    .find()
    .select('orderCode customerName total status createdAt')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean()

  res.render('admin/dashboard', { title: 'Thong ke', admin: req.session, stats, monthlyRev, recentOrders, currentPage: 'dashboard' })
}

// ── USERS ─────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  const users = await User
    .find()
    .select('name email phone role isActive createdAt')
    .sort({ createdAt: -1 })
    .lean()
  res.render('admin/users', { title: 'Tai khoan', admin: req.session, users, currentPage: 'users' })
}

exports.addUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body
  try {
    const exists = await User.countDocuments({ email: email.toLowerCase() })
    if (exists) return res.json({ success: false, message: 'Email da ton tai' })
    await new User({ name, email, password, phone, role: role || 'user' }).save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.editUser = async (req, res) => {
  const { id, name, email, phone, role, password } = req.body
  try {
    const update = { name, email, phone, role }
    if (password) update.password = await bcrypt.hash(password, 10)
    await User.findByIdAndUpdate(id, update, { runValidators: false })
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.deleteUser = async (req, res) => {
  if (req.body.id === req.session.userId) return res.json({ success: false, message: 'Khong the xoa chinh minh' })
  await User.findByIdAndDelete(req.body.id)
  res.json({ success: true })
}

// ── CATEGORIES ────────────────────────────────────────────
const makeSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
     .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim()

exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 }).lean()
  res.render('admin/categories', { title: 'Danh muc', admin: req.session, categories, currentPage: 'categories' })
}

exports.addCategory = async (req, res) => {
  const { name, emoji, description } = req.body
  try {
    await new Category({ name, emoji: emoji || '🍎', description, slug: makeSlug(name) }).save()
    cache.del('categories:active')
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.editCategory = async (req, res) => {
  const { id, name, emoji, description } = req.body
  try {
    await Category.findByIdAndUpdate(id, { name, emoji, description, slug: makeSlug(name) })
    cache.del('categories:active')
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.body.id)
  cache.del('categories:active')
  res.json({ success: true })
}

// ── ORDERS ────────────────────────────────────────────────
const ORDER_SELECT = 'orderCode customerName phone address total status billImage createdAt confirmedAt shippedAt'

const orderList = (status) => async (req, res) => {
  const { from, to } = req.query
  const filter = { status }
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = new Date(from)
    if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59))
  }

  // Dòng này bị mất — phải có
  const orders = await Order.find(filter).select(ORDER_SELECT).sort({ createdAt: -1 }).lean()

  const views = {
    'pending': 'admin/orders-pending',
    'confirmed': 'admin/orders-confirmed',
    'shipped':       'admin/orders-shipped'
  }
  const view = views[status]
  // if (!view) return res.redirect('/admin/orders-pending')
    if (!view) {
  console.log("Invalid status:", status)
  return res.redirect('admin/orders-pending')
}
  res.render(view, { title: 'Don hang', admin: req.session, orders, currentPage: status, from: from||'', to: to||'' })
}

exports.getPendingOrders   = orderList('pending')
exports.getConfirmedOrders = orderList('confirmed')
exports.getShippedOrders   = orderList('shipped')

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) return res.redirect('/admin/orders/pending')
  const pageMap = { pending: 'pending', confirmed: 'confirmed', shipped: 'shipped', cancelled: 'pending' }
  res.render('admin/order-detail', { title: 'Chi tiet don hang', admin: req.session, order, currentPage: pageMap[order.status] || 'pending' })
}

// findOneAndUpdate = 1 round-trip thay vì findById + findByIdAndUpdate
exports.confirmOrder = async (req, res) => {
  const doc = await Order.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { status: 'confirmed', confirmedAt: new Date() },
    { new: false }
  ).lean()
  if (!doc) return res.json({ success: false, message: 'Don hang khong hop le' })
  cache.del('admin:dashboard:stats')
  res.json({ success: true })
}

exports.shipOrder = async (req, res) => {
  const doc = await Order.findOneAndUpdate(
    { _id: req.params.id, status: 'confirmed' },
    { status: 'shipped', shippedAt: new Date() },
    { new: false }
  ).lean()
  if (!doc) return res.json({ success: false, message: 'Don hang khong hop le' })
  cache.del('admin:dashboard:stats')
  res.json({ success: true })
}

exports.cancelOrder = async (req, res) => {
  const doc = await Order.findById(req.params.id).select('status').lean()
  if (!doc) return res.json({ success: false })
  await Order.findByIdAndUpdate(req.params.id, { status: 'cancel', statusBefore: doc.status })
  cache.del('admin:dashboard:stats')
  res.json({ success: true })
}

exports.restoreOrder = async (req, res) => {
  const doc = await Order.findById(req.params.id).select('statusBefore').lean()
  if (!doc) return res.json({ success: false })
  await Order.findByIdAndUpdate(req.params.id, { status: doc.statusBefore || 'pending' })
  res.json({ success: true })
}
exports.usercancel = async (req, res) => {
  const doc = await Order.findById(req.params.id).select('statusBefore').lean()
  if (!doc) return res.json({ success: false })
  await Order.findByIdAndUpdate(req.params.id, { status: doc.statusBefore || 'usercancel' })
  res.json({ success: true })
}
// ── PRODUCTS ──────────────────────────────────────────────
function parseVariants(body) {
  const labels = [].concat(body.variantLabel || [])
  const prices = [].concat(body.variantPrice || [])
  const out = []
  for (let i = 0; i < labels.length; i++) {
    const lbl = (labels[i] || '').trim()
    const prc = parseFloat(prices[i])
    if (lbl && !isNaN(prc) && prc > 0) out.push({ label: lbl, price: prc })
  }
  return out
}

exports.getProducts = async (req, res) => {
  const { q, cat, status } = req.query
  const filter = {}
  if (q)     filter.$text    = { $search: q }   // text index
  if (cat)   filter.category = cat
  if (status === 'active')   filter.isActive = true
  if (status === 'inactive') filter.isActive = false

  const [products, categories] = await Promise.all([
    Product.find(filter)
      .populate({ path: 'category', select: 'name emoji' })
      .sort({ createdAt: -1 })
      .lean(),
    Category.find({ isActive: true }).select('name emoji _id').lean()
  ])
  res.render('admin/products', { title: 'San pham', admin: req.session, products, categories, currentPage: 'products', q: q||'', cat: cat||'', status: status||'' })
}

exports.addProduct = async (req, res) => {
  try {
    const { name, emoji, description, price, unit, origin, category, badge, isActive } = req.body
    const base  = name.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim()
    const count = await Product.countDocuments({ slug: { $regex: `^${base}(-\\d+)?$` } })
    const slug  = count === 0 ? base : `${base}-${count}`

    await new Product({
      name: name.trim(), slug,
      emoji: emoji || '🍎', description: description || '',
      price: +price || 0, unit: unit || 'kg', origin: origin || '',
      category: category || null, badge: badge || '',
      image:    req.file ? '/uploads/products/' + req.file.filename : '',
      variants: parseVariants(req.body),
      isActive: isActive === 'true' || isActive === true
    }).save()
    cache.delByPrefix('products:')
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.editProduct = async (req, res) => {
  try {
    const { id, name, emoji, description, price, unit, origin, category, badge, isActive } = req.body
    const update = {
      name: name.trim(), emoji: emoji || '🍎', description: description || '',
      price: +price || 0, unit: unit || 'kg', origin: origin || '',
      category: category || null, badge: badge || '',
      variants: parseVariants(req.body),
      isActive: isActive === 'true' || isActive === true
    }
    if (req.file) {
      // findOneAndUpdate trả về doc cũ trong 1 round-trip
      const old = await Product.findByIdAndUpdate(id, update, { new: false }).select('image slug').lean()
      if (old?.image) {
        const p = path.join(__dirname, '../public', old.image)
        if (fs.existsSync(p)) fs.unlinkSync(p)
      }
      await Product.findByIdAndUpdate(id, { image: '/uploads/products/' + req.file.filename })
    } else {
      await Product.findByIdAndUpdate(id, update)
    }
    cache.delByPrefix('products:')
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.deleteProduct = async (req, res) => {
  try {
    // findByIdAndDelete trả về doc đã xóa — 1 round-trip
    const p = await Product.findByIdAndDelete(req.body.id).select('image').lean()
    if (p?.image) {
      const imgPath = path.join(__dirname, '../public', p.image)
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    }
    cache.delByPrefix('products:')
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

exports.toggleProduct = async (req, res) => {
  try {
    // Aggregation pipeline update — flip boolean trong 1 round-trip
    const old = await Product.findByIdAndUpdate(
      req.body.id,
      [{ $set: { isActive: { $not: '$isActive' } } }],
      { new: false }
    ).select('isActive').lean()
    if (!old) return res.json({ success: false, message: 'Khong tim thay san pham' })
    cache.delByPrefix('products:')
    res.json({ success: true, isActive: !old.isActive })
  } catch (e) { res.json({ success: false, message: e.message }) }
}
