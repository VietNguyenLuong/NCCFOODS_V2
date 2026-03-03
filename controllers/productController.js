const Product  = require('../models/Product')
const Category = require('../models/Category')
<<<<<<< HEAD
const cache    = require('../middleware/cache')

const TTL_CAT     = 300   // categories: 5 phút
const TTL_HOME    = 60    // featured: 1 phút
const TTL_LIST    = 30    // product list: 30 giây
const TTL_DETAIL  = 120   // product detail: 2 phút

async function getActiveCategories() {
  const hit = cache.get('categories:active')
  if (hit) return hit
  const cats = await Category
    .find({ isActive: true })
    .select('name slug emoji')
    .lean()
  cache.set('categories:active', cats, TTL_CAT)
  return cats
}

// GET /
exports.getHome = async (req, res) => {
  let featured = cache.get('products:featured')
  if (!featured) {
    featured = await Product
      .find({ isActive: true })
      .select('name slug emoji price unit origin badge image category variants')
      .sort({ createdAt: -1 })
      .limit(8)
      .populate({ path: 'category', select: 'name slug emoji' })
      .lean()
    cache.set('products:featured', featured, TTL_HOME)
  }
  const categories = await getActiveCategories()
  res.render('pages/home', { title: 'FruitShop - Hoa Qua Tuoi Ngon', featured, categories })
}

// GET /products
exports.getProducts = async (req, res) => {
  const { cat, q } = req.query
  const cacheKey   = `products:list:${cat || ''}:${q || ''}`

  let products = cache.get(cacheKey)
  if (!products) {
    const filter = { isActive: true }

    if (cat) {
      const cats   = await getActiveCategories()
      const catObj = cats.find(c => c.slug === cat)
      filter.category = catObj ? catObj._id : null
    }
    if (q) {
      filter.$text = { $search: q }   // dùng text index — không $regex
    }

    products = await Product
      .find(filter)
      .select('name slug emoji price unit origin badge image category variants')
      .populate({ path: 'category', select: 'name slug emoji' })
      .lean()
    cache.set(cacheKey, products, TTL_LIST)
  }

  const categories = await getActiveCategories()
  res.render('pages/products', { title: 'San pham', products, categories, currentCat: cat || '', q: q || '' })
}

// GET /products/:slug
exports.getProductDetail = async (req, res) => {
  const { slug } = req.params
  const cacheKey  = `product:detail:${slug}`

  let data = cache.get(cacheKey)
  if (!data) {
    const product = await Product
      .findOne({ slug, isActive: true })
      .populate({ path: 'category', select: 'name slug emoji' })
      .lean()

    if (!product) return res.redirect('/products')

    const related = await Product
      .find({ category: product.category?._id, _id: { $ne: product._id }, isActive: true })
      .select('name slug emoji price unit badge image variants')
      .limit(4)
      .lean()

    data = { product, related }
    cache.set(cacheKey, data, TTL_DETAIL)
  }

  res.render('pages/product-detail', { title: data.product.name, product: data.product, related: data.related })
=======

exports.getHome = async (req, res) => {
  const [featured, categories] = await Promise.all([
    Product.find({ isActive: 1 }).populate('category').limit(8).lean(),
    Category.find({ isActive: 1 }).lean()
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
>>>>>>> cd9bc7445ababde8cfe5703f8775c41cd21cc98c
}
