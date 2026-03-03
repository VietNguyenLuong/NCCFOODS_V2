const User     = require('../models/User')
const Category = require('../models/Category')
const Product  = require('../models/Product')
const Order    = require('../models/Order')
const bcrypt   = require('bcryptjs')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
<<<<<<< HEAD
const cache    = require('../middleware/cache')

// ── MULTER ────────────────────────────────────────────────
=======

>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/products')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, 'product-' + Date.now() + path.extname(file.originalname))
})
<<<<<<< HEAD
exports.uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chi nhan file anh'))
}).single('image')

// ── AUTH ──────────────────────────────────────────────────
=======
const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chi nhan file anh'))
})
exports.uploadProductImage = uploadProduct.single('image')

// ── AUTH ─────────────────────────────────────────────────
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
exports.getLogin = (req, res) => {
  if (req.session?.role === 'admin') return res.redirect('/admin')
  res.render('admin/login', { title: 'Admin Login', error: null })
}
<<<<<<< HEAD

exports.postLogin = async (req, res) => {
  const { email, password } = req.body
  // lean() + select password → dùng bcrypt.compare trực tiếp
  const user = await User
    .findOne({ email: email.toLowerCase(), role: 'admin' })
    .select('name email password role isActive')
    .lean()

  if (!user || !(await bcrypt.compare(password, user.password))) {
=======
exports.postLogin = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' })
  if (!user || !(await user.matchPassword(password))) {
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
    return res.render('admin/login', { title: 'Admin Login', error: 'Sai tai khoan hoac mat khau' })
  }
  req.session.userId = user._id.toString()
  req.session.role   = 'admin'
  req.session.name   = user.name
  res.redirect('/admin')
}
<<<<<<< HEAD

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
=======
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
    if (exists) return res.json({ success: false, message: 'Email da ton tai' })
    await new User({ name, email, password, phone, role: role || 'user' }).save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}
<<<<<<< HEAD

exports.editUser = async (req, res) => {
  const { id, name, email, phone, role, password } = req.body
  try {
    const update = { name, email, phone, role }
    if (password) update.password = await bcrypt.hash(password, 10)
    await User.findByIdAndUpdate(id, update, { runValidators: false })
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

=======
exports.editUser = async (req, res) => {
  const { id, name, email, phone, role, password } = req.body
  const update = { name, email, phone, role }
  if (password) update.password = await bcrypt.hash(password, 10)
  await User.findByIdAndUpdate(id, update)
  res.json({ success: true })
}
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
exports.deleteUser = async (req, res) => {
  if (req.body.id === req.session.userId) return res.json({ success: false, message: 'Khong the xoa chinh minh' })
  await User.findByIdAndDelete(req.body.id)
  res.json({ success: true })
}

<<<<<<< HEAD
// ── CATEGORIES ────────────────────────────────────────────
const makeSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
     .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim()

=======
// ── CATEGORIES ───────────────────────────────────────────
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 }).lean()
  res.render('admin/categories', { title: 'Danh muc', admin: req.session, categories, currentPage: 'categories' })
}
<<<<<<< HEAD

=======
function makeSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-')
}
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
exports.addCategory = async (req, res) => {
  const { name, emoji, description } = req.body
  try {
    await new Category({ name, emoji: emoji || '🍎', description, slug: makeSlug(name) }).save()
<<<<<<< HEAD
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
=======
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = new Date(from)
    if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59))
  }
<<<<<<< HEAD
  // Dùng compound index { status, createdAt }
  const orders = await Order.find(filter).select(ORDER_SELECT).sort({ createdAt: -1 }).lean()
  const views  = { pending: 'admin/orders-pending', confirmed: 'admin/orders-confirmed', shipped: 'admin/orders-shipped' }
  res.render(views[status], { title: 'Don hang', admin: req.session, orders, currentPage: status, from: from||'', to: to||'' })
}
exports.getPendingOrders   = orderList('pending')
exports.getConfirmedOrders = orderList('confirmed')
exports.getShippedOrders   = orderList('shipped')
=======
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean()
   const page   = status === 'Chờ xác nhận' ? 'pending' : status === 'confirmed' ? 'confirmed' : 'shipped'
  const view   = `admin/orders-${status === 'pending' ? 'pending' : status === 'confirmed' ? 'confirmed' : 'shipped'}`
  res.render(view, { title: 'Don hang', admin: req.session, orders, currentPage: page, from: from||'', to: to||'' })
}
exports.getPendingOrders   = orderList('Chờ xác nhận')
exports.getConfirmedOrders = orderList('Đang lên đơn')
exports.getShippedOrders   = orderList('Đã gửi')
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) return res.redirect('/admin/orders/pending')
<<<<<<< HEAD
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
  await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled', statusBefore: doc.status })
  cache.del('admin:dashboard:stats')
  res.json({ success: true })
}

exports.restoreOrder = async (req, res) => {
  const doc = await Order.findById(req.params.id).select('statusBefore').lean()
  if (!doc) return res.json({ success: false })
  await Order.findByIdAndUpdate(req.params.id, { status: doc.statusBefore || 'pending' })
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
=======
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
  if (status === 'active')   filter.isActive = true
  if (status === 'inactive') filter.isActive = false

  const [products, categories] = await Promise.all([
<<<<<<< HEAD
    Product.find(filter)
      .populate({ path: 'category', select: 'name emoji' })
      .sort({ createdAt: -1 })
      .lean(),
    Category.find({ isActive: true }).select('name emoji _id').lean()
  ])
  res.render('admin/products', { title: 'San pham', admin: req.session, products, categories, currentPage: 'products', q: q||'', cat: cat||'', status: status||'' })
=======
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}

exports.addProduct = async (req, res) => {
  try {
    const { name, emoji, description, price, unit, origin, category, badge, isActive } = req.body
<<<<<<< HEAD
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
=======
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}

exports.editProduct = async (req, res) => {
  try {
    const { id, name, emoji, description, price, unit, origin, category, badge, isActive } = req.body
<<<<<<< HEAD
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
=======
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}

exports.deleteProduct = async (req, res) => {
  try {
<<<<<<< HEAD
    // findByIdAndDelete trả về doc đã xóa — 1 round-trip
    const p = await Product.findByIdAndDelete(req.body.id).select('image').lean()
=======
    const p = await Product.findById(req.body.id).lean()
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
    if (p?.image) {
      const imgPath = path.join(__dirname, '../public', p.image)
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    }
<<<<<<< HEAD
    cache.delByPrefix('products:')
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
=======
    await Product.findByIdAndDelete(req.body.id)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}

exports.toggleProduct = async (req, res) => {
  try {
<<<<<<< HEAD
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
=======
    const p = await Product.findById(req.body.id)
    if (!p) return res.json({ success: false, message: 'Khong tim thay san pham' })
    await Product.findByIdAndUpdate(req.body.id, { isActive: !p.isActive })
    res.json({ success: true, isActive: !p.isActive })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}
