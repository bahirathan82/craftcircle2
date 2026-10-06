const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
