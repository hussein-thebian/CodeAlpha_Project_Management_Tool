const TaskModel = require('../models/taskModel.js');

const TaskController = {
  createTask: async (req, res) => {
    try {
      const { project_id, title, description, assigned_to, status, due_date } = req.body;

      // Ensure the assigned user is part of the project
      const isMember = await TaskModel.isUserInProject(project_id, assigned_to);
      if (!isMember) {
        return res.status(400).json({ message: "Assigned user is not part of the project" });
      }

      const newTask = await TaskModel.createTask({ project_id, title, description, assigned_to, status, due_date });
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { project_id, assigned_to } = req.body;

      // Ensure the assigned user is part of the project
      if (assigned_to) {
        const isMember = await TaskModel.isUserInProject(project_id, assigned_to);
        if (!isMember) {
          return res.status(400).json({ message: "Assigned user is not part of the project" });
        }
      }

      const updatedTask = await TaskModel.updateTask(req.params.id, req.body);
      if (updatedTask) {
        res.json(updatedTask);
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const deletedTask = await TaskModel.deleteTask(req.params.id);
      if (deletedTask) {
        res.json({ message: "Task deleted" });
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTasksByAssignedTo: async (req, res) => {
    try {
      const tasks = await TaskModel.getTasksByAssignedUser(req.params.userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTasksByProjectId: async (req, res) => {
    try {
      const tasks = await TaskModel.getTasksByProjectId(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getTaskById: async (req, res) => {
    try {
      const task = await TaskModel.getTaskById(req.params.id);
      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}


module.exports = TaskController;
