const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    // 2 workers × 15 connections = 30 total — đủ cho 125 req/s
    // Tăng hơn không giúp ích vì MongoDB single-node cũng có giới hạn
    const poolSize = parseInt(process.env.MONGO_POOL_SIZE) || 15

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nguyenvietluong02072000_db_user:eX6hqDCRZJjqKgeL@nccfood.utql4va.mongodb.net/nccfood?retryWrites=true&w=majority', {
      maxPoolSize:              poolSize,
      minPoolSize:              3,       // giữ sẵn 3, tránh cold start
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          20000,   // giảm 30s → 20s: fail fast hơn khi DB chậm
      connectTimeoutMS:         10000,
      heartbeatFrequencyMS:     10000,
      // Tối ưu cho MongoDB trên cùng máy (localhost)
      family: 4,               // ép IPv4, tránh DNS lookup IPv6 delay
    })

    console.log(`✅ MongoDB [pool:${poolSize}] connected — pid ${process.pid}`)

  } catch (err) {
    console.error('❌ MongoDB failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
