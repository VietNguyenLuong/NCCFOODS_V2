const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  role:     { type: String, enum: ['user','admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})
userSchema.methods.matchPassword = function(p) {
  return bcrypt.compare(p, this.password)
}

userSchema.index({ email: 1, role: 1 })
userSchema.index({ role: 1 })

module.exports = mongoose.model('User', userSchema)
