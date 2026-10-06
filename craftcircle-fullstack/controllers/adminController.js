const User = require('../models/User');
const Tutorial = require('../models/Tutorial');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @route  GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [userCount, tutorialCount, productCount, orderCount] = await Promise.all([
      User.countDocuments(),
      Tutorial.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);

    res.json({ userCount, tutorialCount, productCount, orderCount });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/admin/users/:id/status  { isActive }
const setUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = req.body.isActive;
    await user.save();
    res.json({ _id: user._id, isActive: user.isActive });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/orders  (all orders, any user)
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/admin/orders/:id/status  { status }
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/admin/products/:id/approval  { isApproved }
const setProductApproval = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isApproved = req.body.isApproved;
    await product.save();
    res.json({ _id: product._id, isApproved: product.isApproved });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  setUserStatus,
  getAllOrders,
  updateOrderStatus,
  setProductApproval,
};
