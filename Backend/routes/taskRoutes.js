const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticateJWT } = require('../jwt.js');

// Route Definitions
router.post('/add',authenticateJWT, TaskController.createTask);
router.put('/:id',authenticateJWT, TaskController.updateTask);
router.get('/:id',authenticateJWT, TaskController.getTaskById);
router.delete('/:id',authenticateJWT, TaskController.deleteTask);
router.get('/assigned/:userId',authenticateJWT, TaskController.getTasksByAssignedTo);
router.get('/project/:projectId',authenticateJWT, TaskController.getTasksByProjectId); // New route

module.exports = router;
