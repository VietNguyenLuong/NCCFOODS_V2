const Product  = require('../models/Product')
const Category = require('../models/Category')
const cache    = require('../middleware/cache')

const TTL_CAT    = 600   // 10 phút
const TTL_HOME   = 120   // 2 phút
const TTL_LIST   = 60    // 1 phút
const TTL_DETAIL = 300   // 5 phút

async function getActiveCategories() {
  return cache.getOrSet('categories:active', () =>
    Category.find({ isActive: true }).select('name slug emoji').lean()
  , TTL_CAT)
}

// GET /
// exports.getHome = async (req, res) => {
//   const [featured, categories] = await Promise.all([
//     cache.getOrSet('products:featured', () =>
//       Product.find({ isActive: true })
//         .select('name slug emoji price unit origin badge image category')
//         .sort({ createdAt: -1 })
//         .limit(8)
//         .populate({ path: 'category', select: 'name slug emoji' })
//         .lean()
//     , TTL_HOME),
//     getActiveCategories()
//   ])
//   res.render('pages/home', { title: 'NCCFOODS - Hoa quả tươi ngon', featured, categories })
// }
exports.getHome = async (req, res) => {
  try {
    const [featured, categories] = await Promise.all([
      cache.getOrSet(
        'products:featured',
        async () => {
          return await Product.find({ isActive: true })
            .select('name slug emoji price unit origin badge image category')
            .sort({ createdAt: -1 })
            .limit(8)
            .populate({
              path: 'category',
              select: 'name slug emoji',
              options: { lean: true }
            })
            .lean()
        },
        TTL_HOME
      ),
      cache.getOrSet('categories:active', getActiveCategories, TTL_HOME)
    ])

    res.render('pages/home', {
      title: 'NCCFOODS - Hoa quả tươi ngon',
      featured,
      categories
    })
  } catch (err) {
    console.error('Home error:', err)
    res.status(500).render('pages/error', { message: 'Server error' })
  }
}
// GET /products
exports.getProducts = async (req, res) => {
  const { cat, q } = req.query
  const cacheKey   = `products:list:${cat || ''}:${q || ''}`

  const [products, categories] = await Promise.all([
    cache.getOrSet(cacheKey, async () => {
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
    }, TTL_LIST),
    getActiveCategories()   // chạy song song với query products
  ])

  res.render('pages/products', { title: 'San pham', products, categories, currentCat: cat || '', q: q || '' })
}

// GET /products/:slug
exports.getProductDetail = async (req, res) => {
  const { slug } = req.params

  const data = await cache.getOrSet(`product:detail:${slug}`, async () => {
    const product = await Product
      .findOne({ slug, isActive: true })
      .populate({ path: 'category', select: 'name slug emoji' })
      .lean()

    // Trả undefined thay null — getOrSet sẽ KHÔNG cache, lần sau query lại
    // Tránh trường hợp cache 404 nhầm khi product chưa active
    if (!product) return undefined

    const related = await Product
      .find({ category: product.category?._id, _id: { $ne: product._id }, isActive: true })
      .select('name slug emoji price unit badge image variants')
      .limit(4)
      .lean()

    return { product, related }
  }, TTL_DETAIL)

  if (!data) return res.redirect('/products')

  res.render('pages/product-detail', {
    title:   data.product.name,
    product: data.product,
    related: data.related
  })
}
