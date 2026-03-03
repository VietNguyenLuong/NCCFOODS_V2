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
  next()
}

module.exports = { requireLogin, requireAdmin, loadUser }
