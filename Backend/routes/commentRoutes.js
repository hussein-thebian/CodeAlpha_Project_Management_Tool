const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const { authenticateJWT } = require('../jwt.js');

// Route Definitions
router.post('/add',authenticateJWT, CommentController.createComment);
router.delete('/:id',authenticateJWT, CommentController.deleteComment);
router.get('/:id',authenticateJWT, CommentController.getCommentById);
router.get('/task/:taskId',authenticateJWT, CommentController.getCommentsByTaskId); // New route

module.exports = router;
