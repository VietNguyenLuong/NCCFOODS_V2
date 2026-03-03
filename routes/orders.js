const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/orderController')
const { requireLogin } = require('../middleware/auth')
router.get('/cart', ctrl.getCart)
router.post('/orders/create', ctrl.uploadMiddleware, ctrl.createOrder)
router.get('/my-orders', requireLogin, ctrl.getMyOrders)
module.exports = router
