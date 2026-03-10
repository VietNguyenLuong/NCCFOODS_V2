const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },
  price: { type: Number, required: true },
  sku:   { type: String, default: '' },
  stock: { type: Number, default: -1 }
}, { _id: true })

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true, index: true },
  emoji:       { type: String, default: '🍎' },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  unit:        { type: String, default: 'kg' },
  origin:      { type: String, default: '' },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  badge:       { type: String, enum: ['', 'new', 'hot', 'sale'], default: '' },
  image:       { type: String, default: '' },
  variants:    { type: [variantSchema], default: [] },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

// list theo category
productSchema.index({ isActive: 1, category: 1 })

// homepage sản phẩm mới
productSchema.index({ isActive: 1, createdAt: -1 })

// category page sort mới
productSchema.index({ category: 1, createdAt: -1 })

// full text search
productSchema.index({ name: 'text', description: 'text' })

module.exports = mongoose.model('Product', productSchema)