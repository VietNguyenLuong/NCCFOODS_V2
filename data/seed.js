require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')
const Category = require('../models/Category')
const Product  = require('../models/Product')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fruitshop')
  console.log('Connected to MongoDB')

  const existAdmin = await User.findOne({ email: 'admin@fruitshop.vn' })
  if (!existAdmin) {
    await new User({ name: 'Quan tri vien', email: 'admin@fruitshop.vn', password: 'Admin@123', role: 'admin' }).save()
    console.log('Admin: admin@fruitshop.vn / Admin@123')
  }

  const catData = [
    { name:'Nhap khau', emoji:'✈️', slug:'nhap-khau', description:'Hoa qua nhap khau chat luong cao' },
    { name:'Noi dia',   emoji:'🍀', slug:'noi-dia',   description:'Hoa qua Viet Nam tuoi ngon' },
    { name:'Combo',     emoji:'🎁', slug:'combo',     description:'Combo tiet kiem da dang' },
    { name:'Mua vu',    emoji:'🌸', slug:'mua-vu',    description:'Hoa qua theo mua' }
  ]
  let cats = {}
  for (const c of catData) {
    let cat = await Category.findOne({ slug: c.slug })
    if (!cat) cat = await new Category(c).save()
    cats[c.slug] = cat._id
  }

  const prods = [
    { name:'Nho Shine Muscat', slug:'nho-shine-muscat', emoji:'🍇', price:280000, unit:'kg', origin:'Nhat Ban', category:cats['nhap-khau'], badge:'hot' },
    { name:'Xoai Hoa Loc',     slug:'xoai-hoa-loc',    emoji:'🥭', price:65000,  unit:'kg', origin:'Dong Thap', category:cats['noi-dia'], badge:'new' },
    { name:'Dau Tay Da Lat',   slug:'dau-tay-da-lat',  emoji:'🍓', price:120000, unit:'hop',origin:'Da Lat',    category:cats['noi-dia'] },
    { name:'Viet Quat My',     slug:'viet-quat-my',    emoji:'🫐', price:220000, unit:'hop',origin:'My',        category:cats['nhap-khau'] },
    { name:'Dao Han Quoc',     slug:'dao-han-quoc',    emoji:'🍑', price:180000, unit:'kg', origin:'Han Quoc',  category:cats['nhap-khau'], badge:'sale' },
    { name:'Cam Valencia',     slug:'cam-valencia',    emoji:'🍊', price:75000,  unit:'kg', origin:'Tay Ban Nha', category:cats['nhap-khau'] },
    { name:'Kiwi Vang',        slug:'kiwi-vang',       emoji:'🥝', price:145000, unit:'kg', origin:'New Zealand', category:cats['nhap-khau'], badge:'new' },
    { name:'Cherry My',        slug:'cherry-my',       emoji:'🍒', price:350000, unit:'hop',origin:'My',        category:cats['nhap-khau'], badge:'hot' }
  ]
  for (const p of prods) {
    if (!await Product.findOne({ slug: p.slug })) await new Product(p).save()
  }
  console.log('Seeded 8 products')
  console.log('Run: npm run dev')
  process.exit(0)
}
seed().catch(err => { console.error(err); process.exit(1) })
