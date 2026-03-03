const mongoose = require('mongoose')
<<<<<<< HEAD

=======
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true },
  emoji:       { type: String, default: '🍎' },
  description: { type: String, default: '' },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })
<<<<<<< HEAD

categorySchema.index({ slug: 1 })
categorySchema.index({ isActive: 1 })

=======
/* INDEX */
categorySchema.index({ isActive: 1 })
categorySchema.index({ slug: 1 })
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
module.exports = mongoose.model('Category', categorySchema)
