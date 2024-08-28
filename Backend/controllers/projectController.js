const ProjectModel = require('../models/projectModel');

const ProjectController = {
  createProject: async (req, res) => {
    try {
      const { name, description, created_by } = req.body;

      // Check if project name already exists
      const existingProject = await ProjectModel.getProjectByName(name);
      if (existingProject) {
        return res.status(400).json({ message: "Project name already exists" });
      }

      const newProject = await ProjectModel.createProject({ name, description, created_by });

      // Add the creator to the project members with the role of 'owner'
      await ProjectModel.addMemberToProject(newProject.id, created_by, 'owner');

      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateProject: async (req, res) => {
    try {
      const project = await ProjectModel.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Ensure project name is unique if updated
      if (req.body.name && req.body.name !== project.name) {
        const projectWithName = await ProjectModel.getProjectByName(req.body.name);
        if (projectWithName) {
          return res.status(400).json({ message: "Project name already exists" });
        }
      }

      const updatedProject = await ProjectModel.updateProject(req.params.id, req.body);
      if (updatedProject) {
        res.status(200).json(updatedProject);
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.created_by;  
      const deletedProject = await ProjectModel.deleteProject(id, userId);
      if (deletedProject) {
        res.json({ message: "Project deleted" });
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAllProjects: async (req, res) => {
    try {
      const projects = await ProjectModel.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getProjectsByOwner: async (req, res) => {
    try {
      const projects = await ProjectModel.getProjectsByOwner(req.params.ownerId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getProjectById: async (req, res) => {
    try {
      const project = await ProjectModel.getProjectById(req.params.id);
      if (project) {
        res.json(project);
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  addMemberToProject: async (req, res) => {
    try {
      const { project_id, user_id, role } = req.body;
      const result = await ProjectModel.addMemberToProject(project_id, user_id, role);
      if (result) {
        res.status(201).json(result);
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserInProject: async (req, res) => {
    const { projectId, userId } = req.params;

    try {
      const result = await ProjectModel.getUserInProject(projectId, userId);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  removeMemberFromProject: async (req, res) => {
    try {
      const { project_id, user_id } = req.body;
      const result = await ProjectModel.removeMemberFromProject(project_id, user_id);
      if (result) {
        const result2= await ProjectModel.removeTasksByUserInProject(project_id, user_id);
        res.json({ success: true, message: "Member removed from project" });
      } else {
        res.status(404).json({ success: false,message: "Project or member not found" });
      }
    } catch (error) {
      res.status(500).json({ success: false,error: error.message });
    }
  },

  getMembersOfProject: async (req, res) => {
    try {
      const { id } = req.params;
      const members = await ProjectModel.getMembersOfProject(id);
      if (members) {
        res.json(members);
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getProjectsOfMember: async (req, res) => {
    try {
      const { userId } = req.params;
      const projects = await ProjectModel.getProjectsOfMember(userId);
      if (projects) {
        res.json(projects);
      } else {
        res.status(404).json({ message: "No projects found for this member" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getNonMemberUsers: async (req, res) => {
    try {
      const { projectId  } = req.params;
      const members = await ProjectModel.getNonMemberUsers(projectId);
      if (members) {
        res.json(members);
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
}

module.exports = ProjectController;
