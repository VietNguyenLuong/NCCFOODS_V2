const User   = require('../models/User')
const bcrypt = require('bcryptjs')

exports.getLogin = (req, res) => {
  if (req.session?.userId) return res.redirect('/')
  res.render('pages/login', { title: 'Dang nhap', error: null, flash: req.query.msg || null })
}

exports.postLogin = async (req, res) => {
  const { email, password } = req.body
  try {
    // .lean() + select password để dùng bcrypt.compare trực tiếp (lean doc không có .matchPassword())
    const user = await User
      .findOne({ email: email.toLowerCase() })
      .select('name email password role isActive')
      .lean()

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('pages/login', { title: 'Dang nhap', error: 'Email hoac mat khau khong dung', flash: null })
    }
    if (!user.isActive) {
      return res.render('pages/login', { title: 'Dang nhap', error: 'Tai khoan da bi khoa', flash: null })
    }
    req.session.userId = user._id.toString()
    req.session.role   = user.role
    req.session.name   = user.name
    const returnTo = req.session.returnTo || '/'
    delete req.session.returnTo
    res.redirect(returnTo)
  } catch (e) {
    res.render('pages/login', { title: 'Dang nhap', error: 'Loi he thong', flash: null })
  }
}

exports.getRegister = (req, res) => {
  if (req.session?.userId) return res.redirect('/')
  res.render('pages/register', { title: 'Dang ky', error: null })
}

exports.postRegister = async (req, res) => {
  const { name, email, password, phone } = req.body
  try {
    // countDocuments nhanh hơn findOne để chỉ check tồn tại
    const exists = await User.countDocuments({ email: email.toLowerCase() })
    if (exists) return res.render('pages/register', { title: 'Dang ky', error: 'Email da duoc su dung' })
    const user = new User({ name, email, password, phone })
    await user.save()
    req.session.userId = user._id.toString()
    req.session.role   = user.role
    req.session.name   = user.name
    res.redirect('/')
  } catch (e) {
    res.render('pages/register', { title: 'Dang ky', error: 'Loi he thong: ' + e.message })
  }
}

exports.logout = (req, res) => { req.session.destroy(); res.redirect('/') }
