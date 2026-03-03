const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },
  price: { type: Number, required: true },
  sku:   { type: String, default: '' },
  stock: { type: Number, default: -1 }
}, { _id: true })

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  emoji:       { type: String, default: '🍎' },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  unit:        { type: String, default: 'kg' },
  origin:      { type: String, default: '' },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  badge:       { type: String, enum: ['', 'new', 'hot', 'sale'], default: '' },
  image:       { type: String, default: '' },
  variants:    { type: [variantSchema], default: [] },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

// List page: filter theo danh mục
productSchema.index({ isActive: 1, category: 1 })
// Trang chủ: sort mới nhất
productSchema.index({ isActive: 1, createdAt: -1 })
// Full-text search (thay $regex → full collection scan)
productSchema.index({ name: 'text', description: 'text' })

module.exports = mongoose.model('Product', productSchema)