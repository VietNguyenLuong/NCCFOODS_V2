const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/adminController')
const { requireAdmin } = require('../middleware/auth')

router.get('/login',  ctrl.getLogin)
router.post('/login', ctrl.postLogin)
router.get('/logout', ctrl.logout)

router.get('/', requireAdmin, ctrl.getDashboard)

router.get('/users',           requireAdmin, ctrl.getUsers)
router.post('/users/add',      requireAdmin, ctrl.addUser)
router.post('/users/edit',     requireAdmin, ctrl.editUser)
router.post('/users/delete',   requireAdmin, ctrl.deleteUser)

router.get('/categories',          requireAdmin, ctrl.getCategories)
router.post('/categories/add',     requireAdmin, ctrl.addCategory)
router.post('/categories/edit',    requireAdmin, ctrl.editCategory)
router.post('/categories/delete',  requireAdmin, ctrl.deleteCategory)

// ── PRODUCTS ─────────────────────────────────────────────
router.get('/products',              requireAdmin, ctrl.getProducts)
router.post('/products/add',         requireAdmin, ctrl.uploadProductImage, ctrl.addProduct)
router.post('/products/edit',        requireAdmin, ctrl.uploadProductImage, ctrl.editProduct)
router.post('/products/delete',      requireAdmin, ctrl.deleteProduct)
router.post('/products/toggle',      requireAdmin, ctrl.toggleProduct)

router.get('/orders/pending',   requireAdmin, ctrl.getPendingOrders)
router.get('/orders/confirmed', requireAdmin, ctrl.getConfirmedOrders)
router.get('/orders/shipped',   requireAdmin, ctrl.getShippedOrders)
router.get('/orders/:id',       requireAdmin, ctrl.getOrderDetail)
router.post('/orders/:id/confirm', requireAdmin, ctrl.confirmOrder)
router.post('/orders/:id/ship',    requireAdmin, ctrl.shipOrder)
router.post('/orders/:id/cancel',  requireAdmin, ctrl.cancelOrder)
router.post('/orders/:id/restore', requireAdmin, ctrl.restoreOrder)
router.post('/orders/:id/usercancel', ctrl.cancelUserOrder)
module.exports = router
