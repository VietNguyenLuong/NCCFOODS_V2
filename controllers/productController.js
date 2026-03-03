const Product  = require('../models/Product')
const Category = require('../models/Category')

exports.getHome = async (req, res) => {
  const [featured, categories] = await Promise.all([
    Product.find({ isActive: true }).populate('category').limit(8).lean(),
    Category.find({ isActive: true }).lean()
  ])
  res.render('pages/home', { title: 'NCCFOODS - Hoa quả tươi ngon', featured, categories })
}

exports.getProducts = async (req, res) => {
  const { cat, q } = req.query
  let filter = { isActive: true }
  let catObj = null
  if (cat) {
    catObj = await Category.findOne({ slug: cat }).lean()
    if (catObj) filter.category = catObj._id
  }
  if (q) filter.name = { $regex: q, $options: 'i' }
  const [products, categories] = await Promise.all([
    Product.find(filter).populate('category').lean(),
    Category.find({ isActive: true }).lean()
  ])
  res.render('pages/products', { title: 'San pham', products, categories, currentCat: cat || '', q: q || '' })
}

exports.getProductDetail = async (req, res) => {
  const product  = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category').lean()
  if (!product) return res.redirect('/products')
  const related  = await Product.find({ category: product.category?._id, _id: { $ne: product._id }, isActive: true }).limit(4).lean()
  res.render('pages/product-detail', { title: product.name, product, related })
}
