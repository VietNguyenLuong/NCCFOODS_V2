const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/productController')
router.get('/', ctrl.getHome)
router.get('/products', ctrl.getProducts)
router.get('/products/:slug', ctrl.getProductDetail)
module.exports = router
