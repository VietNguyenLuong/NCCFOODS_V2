const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:    String,
  emoji:   String,
  price:   Number,
  qty:     Number
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderCode:    { type: String, unique: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  phone:        { type: String, required: true },
  address:      { type: String, required: true },
  items:        [orderItemSchema],
  orderSummary: String,
  billImage:    String,
  subtotal:     { type: Number, default: 0 },
  shipping:     { type: Number, default: 4000 },
  total:        { type: Number, default: 0 },
  status:       { type: String, enum: ['Chờ xác nhận','Đang lên đơn','Đã gửi','Từ chối','Khách hàng hủy'], default: 'Chờ xác nhận' },
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
// Tra cứu đơn hàng — unique:true trên field đã tạo index, không cần khai báo lại
// orderSchema.index({ orderCode: 1 })

module.exports = mongoose.model('Order', orderSchema)