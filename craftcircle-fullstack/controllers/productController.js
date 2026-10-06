const Product = require('../models/Product');

// @route  GET /api/products?search=&category=&page=&limit=
const getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const query = { isApproved: true };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const products = await Product.find(query)
      .populate('seller', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name avatarUrl');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, images } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, description, price and category are required' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock ?? 1,
      images: images || [],
      seller: req.user._id,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
