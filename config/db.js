const mongoose = require('mongoose')
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nguyenvietluong02072000_db_user:eX6hqDCRZJjqKgeL@nccfood.utql4va.mongodb.net/?appName=NCCFOOD')
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB error:', err.message)
    process.exit(1)
  }
}
module.exports = connectDB
