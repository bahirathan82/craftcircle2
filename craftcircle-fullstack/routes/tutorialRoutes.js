const express = require('express');
const router = express.Router();
const {
  getTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  toggleLike,
  addComment,
} = require('../controllers/tutorialController');
const { protect } = require('../middleware/auth');

router.get('/', getTutorials);
router.get('/:id', getTutorialById);
router.post('/', protect, createTutorial);
router.put('/:id', protect, updateTutorial);
router.delete('/:id', protect, deleteTutorial);
router.put('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);

module.exports = router;
