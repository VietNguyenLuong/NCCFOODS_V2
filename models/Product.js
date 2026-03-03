const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
<<<<<<< HEAD
  label: { type: String, required: true },
  price: { type: Number, required: true },
  sku:   { type: String, default: '' },
  stock: { type: Number, default: -1 }
=======
  label: { type: String, required: true },  // "2kg", "5kg", "Vị nguyên bản"
  price: { type: Number, required: true },
  sku:   { type: String, default: '' },
  stock: { type: Number, default: -1 }      // -1 = unlimited
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}, { _id: true })

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  emoji:       { type: String, default: '🍎' },
  description: { type: String, default: '' },
<<<<<<< HEAD
  price:       { type: Number, required: true },
=======
  price:       { type: Number, required: true },   // base price (fallback khi ko có variant)
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
  unit:        { type: String, default: 'kg' },
  origin:      { type: String, default: '' },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  badge:       { type: String, enum: ['', 'new', 'hot', 'sale'], default: '' },
  image:       { type: String, default: '' },
  variants:    { type: [variantSchema], default: [] },
<<<<<<< HEAD
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

// Hot path: detail page
productSchema.index({ slug: 1 })
// List page: filter theo danh mục
productSchema.index({ isActive: 1, category: 1 })
// Trang chủ: sort mới nhất
productSchema.index({ isActive: 1, createdAt: -1 })
// Full-text search (thay $regex → full collection scan)
productSchema.index({ name: 'text', description: 'text' })

=======
  isActive:    { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true })

productSchema.index({ isActive: 1, isFeatured: 1, category: 1 })
productSchema.index({ slug: 1 })
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
module.exports = mongoose.model('Product', productSchema)
