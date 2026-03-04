const Product  = require('../models/Product')
const Category = require('../models/Category')
const cache    = require('../middleware/cache')

// TTL tăng lên để giảm DB queries khi 500 user — 2 workers × ít queries hơn
const TTL_CAT     = 600   // categories: 10 phút — gần như không đổi
const TTL_HOME    = 120   // featured: 2 phút
const TTL_LIST    = 60    // product list: 1 phút
const TTL_DETAIL  = 300   // product detail: 5 phút

async function getActiveCategories() {
  return cache.getOrSet('categories:active', () =>
    Category.find({ isActive: true }).select('name slug emoji').lean()
  , TTL_CAT)
}

// GET /
exports.getHome = async (req, res) => {
  const [featured, categories] = await Promise.all([
    cache.getOrSet('products:featured', () =>
      Product.find({ isActive: true })
        .select('name slug emoji price unit origin badge image category variants')
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({ path: 'category', select: 'name slug emoji' })
        .lean()
    , TTL_HOME),
    getActiveCategories()
  ])
  res.render('pages/home', { title: 'FruitShop - Hoa Qua Tuoi Ngon', featured, categories })
}

// GET /products
exports.getProducts = async (req, res) => {
  const { cat, q } = req.query
  const cacheKey   = `products:list:${cat || ''}:${q || ''}`

  const products = await cache.getOrSet(cacheKey, async () => {
    const filter = { isActive: true }
    if (cat) {
      const cats   = await getActiveCategories()
      const catObj = cats.find(c => c.slug === cat)
      filter.category = catObj ? catObj._id : null
    }
    if (q) filter.$text = { $search: q }
    return Product.find(filter)
      .select('name slug emoji price unit origin badge image category variants')
      .populate({ path: 'category', select: 'name slug emoji' })
      .lean()
  }, TTL_LIST)

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
}
