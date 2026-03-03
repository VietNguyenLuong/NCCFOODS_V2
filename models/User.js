const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
<<<<<<< HEAD
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  role:     { type: String, enum: ['user','admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
=======
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  phone:     { type: String, default: '' },
  address:   { type: String, default: '' },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  isActive:  { type: Boolean, default: true }
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})
<<<<<<< HEAD
userSchema.methods.matchPassword = function(p) {
  return bcrypt.compare(p, this.password)
}

userSchema.index({ email: 1, role: 1 })
userSchema.index({ role: 1 })

=======
userSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password)
}
/* INDEX */
userSchema.index({ email: 1 })
userSchema.index({ role: 1, isActive: 1 })
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
module.exports = mongoose.model('User', userSchema)
