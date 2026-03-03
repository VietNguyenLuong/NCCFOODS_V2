const router = require('express').Router()
const ctrl   = require('../controllers/homeController')
router.get('/', ctrl.getHome)
module.exports = router
