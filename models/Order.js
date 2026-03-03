const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:      String,
  emoji:     String,
  price:     Number,
  qty:       Number
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderCode:    { type: String, unique: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  phone:        { type: String, required: true },
  address:      { type: String, required: true },
  items:        [orderItemSchema],
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
module.exports = mongoose.model('Order', orderSchema)
