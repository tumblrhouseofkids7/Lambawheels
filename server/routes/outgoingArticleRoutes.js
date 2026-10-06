const express = require('express');
const router = express.Router();
const { createArticle, getArticles, getSuggestions } = require('../controllers/outgoingArticleController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createArticle);
router.get('/suggestions', protect, getSuggestions);
router.get('/', protect, getArticles);

module.exports = router;
