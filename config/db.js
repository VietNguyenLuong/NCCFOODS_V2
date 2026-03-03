const mongoose = require('mongoose')
const connectDB = async () => {
  try {
<<<<<<< HEAD
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fruitshop')
=======
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nguyenvietluong02072000_db_user:eX6hqDCRZJjqKgeL@nccfood.utql4va.mongodb.net/?appName=NCCFOOD', {maxPoolSize: 50})
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB error:', err.message)
    process.exit(1)
  }
}
module.exports = connectDB
