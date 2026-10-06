const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  setUserStatus,
  getAllOrders,
  updateOrderStatus,
  setProductApproval,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly); // every admin route requires a logged-in admin

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', setUserStatus);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/products/:id/approval', setProductApproval);

module.exports = router;
