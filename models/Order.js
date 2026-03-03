const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
<<<<<<< HEAD
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:    String,
  emoji:   String,
  price:   Number,
  qty:     Number
=======
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:      String,
  emoji:     String,
  price:     Number,
  qty:       Number
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderCode:    { type: String, unique: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  phone:        { type: String, required: true },
  address:      { type: String, required: true },
  items:        [orderItemSchema],
<<<<<<< HEAD
  orderSummary: String,
  billImage:    String,
  subtotal:     { type: Number, default: 0 },
  shipping:     { type: Number, default: 30000 },
  total:        { type: Number, default: 0 },
  status:       { type: String, enum: ['pending','confirmed','shipped','cancelled'], default: 'pending' },
  statusBefore: String,
  confirmedAt:  Date,
  shippedAt:    Date
}, { timestamps: true })

orderSchema.pre('save', function(next) {
  if (!this.orderCode) this.orderCode = 'FS' + Date.now().toString().slice(-8)
  next()
})

// Admin list (hot): lọc theo status + sort mới nhất
orderSchema.index({ status: 1, createdAt: -1 })
// Date range filter trong admin
orderSchema.index({ status: 1, createdAt: 1  })
// Trang "đơn hàng của tôi"
orderSchema.index({ user: 1, createdAt: -1   })
// Dashboard aggregate theo tháng
orderSchema.index({ createdAt: -1             })
// Tra cứu đơn hàng
orderSchema.index({ orderCode: 1              })

=======
  orderSummary: { type: String },
  billImage:    { type: String },
  subtotal:     { type: Number, default: 0 },
  shipping:     { type: Number, default: 30000 },
  total:        { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Chờ xác nhận','Đang lên đơn','Đã gửi','Từ chối','Khách hàng hủy'],
    default: 'Chờ xác nhận'
  },
  statusBefore: { type: String },
  confirmedAt:  { type: Date },
  shippedAt:    { type: Date }
}, { timestamps: true })

orderSchema.pre('save', function(next) {
  if (!this.orderCode) {
    this.orderCode = 'FS' + Date.now().toString().slice(-8)
  }
  next()
})
orderSchema.index({ user: 1, createdAt: -1 }) 
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ orderCode: 1 })
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
module.exports = mongoose.model('Order', orderSchema)
