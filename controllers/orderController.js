<<<<<<< HEAD
const Order  = require('../models/Order')
const multer = require('multer')
const path   = require('path')
=======
const Order   = require('../models/Order')
const Product = require('../models/Product')
const multer  = require('multer')
const path    = require('path')
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename:    (req, file, cb) => cb(null, 'bill-' + Date.now() + path.extname(file.originalname))
})
<<<<<<< HEAD
exports.uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chi nhan file anh'))
}).single('billImage')

exports.getCart = (req, res) => res.render('pages/cart', { title: 'Gio hang' })
=======
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Chi nhan file anh'))
  }
})

exports.uploadMiddleware = upload.single('billImage')

exports.getCart = (req, res) => {
  res.render('pages/cart', { title: 'Gio hang' })
}
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c

exports.createOrder = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui long dinh kem anh bill' })
    const { customerName, phone, address, orderSummary, cartData } = req.body
<<<<<<< HEAD
    if (!customerName || !phone || !address)
      return res.status(400).json({ success: false, message: 'Vui long dien du thong tin' })
=======
    if (!customerName || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Vui long dien du thong tin' })
    }
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c

    let cartItems = []
    try { cartItems = JSON.parse(cartData || '[]') } catch {}

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
<<<<<<< HEAD
    const shipping = subtotal >= 300000 ? 0 : 30000
=======
    const shipping = subtotal >= 45000 ? 0 : 4000
    const total    = subtotal + shipping
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c

    const order = new Order({
      user:         req.session?.userId || null,
      customerName: customerName.trim(),
      phone:        phone.trim(),
      address:      address.trim(),
      orderSummary,
      billImage:    '/uploads/' + req.file.filename,
      items:        cartItems.map(i => ({ product: i.productId || null, name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })),
<<<<<<< HEAD
      subtotal,
      shipping,
      total: subtotal + shipping
    })
    await order.save()
    res.json({ success: true, orderId: order.orderCode })
  } catch (e) {
    console.error(e)
=======
      subtotal, shipping, total
    })
    await order.save()
    res.json({ success: true, orderId: order.orderCode })
  } catch (err) {
    console.error(err)
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
    res.status(500).json({ success: false, message: 'Loi he thong' })
  }
}

exports.getMyOrders = async (req, res) => {
<<<<<<< HEAD
  // Dùng index (user, createdAt), chỉ select field cần thiết, lean()
  const orders = await Order
    .find({ user: req.session.userId })
    .select('orderCode items total status createdAt')
    .sort({ createdAt: -1 })
    .lean()
=======
  const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 }).lean()
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
  res.render('pages/my-orders', { title: 'Don hang cua toi', orders })
}
