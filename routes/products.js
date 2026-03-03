const router = require('express').Router()
const ctrl   = require('../controllers/productController')
router.get('/',    ctrl.getProducts)
router.get('/:id', ctrl.getDetail)
module.exports = router
