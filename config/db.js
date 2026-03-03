const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nguyenvietluong02072000_db_user:eX6hqDCRZJjqKgeL@nccfood.utql4va.mongodb.net/?appName=NCCFOOD', {
      // ── Connection Pool ──────────────────────────────────
      // Mặc định chỉ 5 — tăng lên để xử lý concurrent requests
      // Công thức: maxPoolSize = (cores × 2) + 1, tối thiểu 20
      maxPoolSize:     parseInt(process.env.MONGO_POOL_SIZE) || 20,
      minPoolSize:     5,      // giữ sẵn 5 connections, tránh latency khi spike

      // ── Timeouts ─────────────────────────────────────────
      serverSelectionTimeoutMS: 5000,   // nếu 5s không tìm được server → fail fast
      socketTimeoutMS:          30000,  // query chạy quá 30s → kill
      connectTimeoutMS:         10000,  // kết nối ban đầu tối đa 10s

      // ── Heartbeat ────────────────────────────────────────
      heartbeatFrequencyMS: 10000,      // ping MongoDB mỗi 10s để phát hiện disconnect
    })

    console.log(`✅ MongoDB connected  [pool: ${mongoose.connection.options?.maxPoolSize || 20}]`)

    // Log pool events trong development
    if (process.env.NODE_ENV !== 'production') {
      mongoose.connection.on('connected',    () => console.log('🔗 Mongoose connected'))
      mongoose.connection.on('disconnected', () => console.warn('⚠️  Mongoose disconnected'))
      mongoose.connection.on('error',   err => console.error('❌ Mongoose error:', err.message))
    }

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
