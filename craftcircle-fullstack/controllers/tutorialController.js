const Tutorial = require('../models/Tutorial');

// @route  GET /api/tutorials?search=&category=&page=&limit=
const getTutorials = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const tutorials = await Tutorial.find(query)
      .populate('author', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Tutorial.countDocuments(query);

    res.json({ tutorials, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/tutorials/:id
const getTutorialById = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id)
      .populate('author', 'name avatarUrl')
      .populate('comments.user', 'name avatarUrl');

    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });
    res.json(tutorial);
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/tutorials
const createTutorial = async (req, res, next) => {
  try {
    const { title, description, steps, category, difficulty, images } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const tutorial = await Tutorial.create({
      title,
      description,
      steps: steps || [],
      category,
      difficulty,
      images: images || [],
      author: req.user._id,
    });

    res.status(201).json(tutorial);
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/tutorials/:id
const updateTutorial = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    const isOwner = tutorial.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this tutorial' });
    }

    Object.assign(tutorial, req.body);
    const updated = await tutorial.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/tutorials/:id
const deleteTutorial = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    const isOwner = tutorial.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this tutorial' });
    }

    await tutorial.deleteOne();
    res.json({ message: 'Tutorial deleted' });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/tutorials/:id/like
const toggleLike = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    const userId = req.user._id.toString();
    const alreadyLiked = tutorial.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      tutorial.likes = tutorial.likes.filter((id) => id.toString() !== userId);
    } else {
      tutorial.likes.push(req.user._id);
    }

    await tutorial.save();
    res.json({ likesCount: tutorial.likes.length, liked: !alreadyLiked });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/tutorials/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    tutorial.comments.push({ user: req.user._id, text });
    await tutorial.save();

    res.status(201).json(tutorial.comments[tutorial.comments.length - 1]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  toggleLike,
  addComment,
};
