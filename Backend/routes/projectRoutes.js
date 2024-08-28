const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { authenticateJWT } = require('../jwt.js');

// Route Definitions
router.post('/add',authenticateJWT, ProjectController.createProject);
router.put('/:id',authenticateJWT, ProjectController.updateProject);
router.delete('/removeMember',authenticateJWT, ProjectController.removeMemberFromProject);
router.delete('/:id',authenticateJWT, ProjectController.deleteProject);
router.get('/',authenticateJWT, ProjectController.getAllProjects);
router.get('/owner/:ownerId',authenticateJWT, ProjectController.getProjectsByOwner);
router.get('/:id',authenticateJWT, ProjectController.getProjectById);
router.post('/addMember',authenticateJWT, ProjectController.addMemberToProject);
router.get('/:id/members',authenticateJWT, ProjectController.getMembersOfProject); // New route
router.get('/members/:userId/projects',authenticateJWT, ProjectController.getProjectsOfMember);
router.get('/info/:projectId/users/:userId', authenticateJWT, ProjectController.getUserInProject);
router.get('/non-members/:projectId', authenticateJWT, ProjectController.getNonMemberUsers);

module.exports = router;
