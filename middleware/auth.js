const User = require('../models/User')

const requireLogin = (req, res, next) => {
  if (req.session?.userId) return next()
  req.session.returnTo = req.originalUrl
  res.redirect('/auth/login')
}

const requireAdmin = (req, res, next) => {
  if (req.session?.role === 'admin') return next()
  res.redirect('/admin/login')
}

<<<<<<< HEAD
// Cache user trong req để tránh query DB nhiều lần trong cùng request
const loadUser = async (req, res, next) => {
  res.locals.currentUser = null
  res.locals.isAdmin     = false

  if (!req.session?.userId) return next()

  try {
    // Chỉ select field cần cho UI, dùng lean()
    const user = await User.findById(req.session.userId)
      .select('name email role isActive')
      .lean()

    if (user && user.isActive) {
      res.locals.currentUser = user
      res.locals.isAdmin     = user.role === 'admin'
    } else if (user && !user.isActive) {
      // Tài khoản bị khoá → force logout
      req.session.destroy()
    }
  } catch { /* ignore */ }

=======
const loadUser = async (req, res, next) => {
  if (req.session?.userId) {
    try {
      const user = await User.findById(req.session.userId).lean()
      res.locals.currentUser = user
      res.locals.isAdmin = user?.role === 'admin'
    } catch { res.locals.currentUser = null }
  } else {
    res.locals.currentUser = null
    res.locals.isAdmin = false
  }
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
  next()
}

module.exports = { requireLogin, requireAdmin, loadUser }
