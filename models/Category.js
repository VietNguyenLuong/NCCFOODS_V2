const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, index: true },
  emoji:       { type: String, default: '🍎' },
  description: { type: String, default: '' },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

categorySchema.index({ isActive: 1 })

module.exports = mongoose.model('Category', categorySchema)