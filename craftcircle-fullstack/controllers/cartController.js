const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @route  GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.json(cart || { user: req.user._id, items: [] });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/cart  { productId, quantity }
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    const populated = await cart.populate('items.product');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/cart/:productId  { quantity }
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.user._id);

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/cart/:productId
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
