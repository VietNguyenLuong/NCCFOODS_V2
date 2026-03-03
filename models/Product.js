const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },  // "2kg", "5kg", "Vị nguyên bản"
  price: { type: Number, required: true },
  sku:   { type: String, default: '' },
  stock: { type: Number, default: -1 }      // -1 = unlimited
}, { _id: true })

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  emoji:       { type: String, default: '🍎' },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },   // base price (fallback khi ko có variant)
  unit:        { type: String, default: 'kg' },
  origin:      { type: String, default: '' },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  badge:       { type: String, enum: ['', 'new', 'hot', 'sale'], default: '' },
  image:       { type: String, default: '' },
  variants:    { type: [variantSchema], default: [] },
  isActive:    { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true })

productSchema.index({ isActive: 1, isFeatured: 1, category: 1 })
productSchema.index({ slug: 1 })
module.exports = mongoose.model('Product', productSchema)
