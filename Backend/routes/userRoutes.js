const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController.js');
const multer = require('multer');
const  upload  = require('../multerConfig.js');
const { authenticateJWT } = require('../jwt.js');

// Route Definitions
router.get('/',authenticateJWT, UserController.getAllUsers);
router.get('/:id',authenticateJWT, UserController.getUserById);
router.get('/name/:username',authenticateJWT, UserController.getUserByUsername);
router.post('/add', upload.single('profile_picture'), UserController.createUser);
router.put('/:id',authenticateJWT, upload.single('profile_picture'), UserController.updateUser);
router.delete('/:id',authenticateJWT, UserController.deleteUser);
router.post('/login', UserController.login);
router.post('/logout',authenticateJWT, UserController.logout);

module.exports = router;