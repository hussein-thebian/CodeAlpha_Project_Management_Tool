const CommentModel = require('../models/commentModel');
const TaskModel = require('../models/taskModel');

const CommentController = {
  createComment: async (req, res) => {
    try {
      const { task_id, user_id, content } = req.body;

      // Ensure that the task and user exist
      const task = await TaskModel.getTaskById(task_id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const newComment = await CommentModel.createComment({ task_id, user_id, content });
      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const deletedComment = await CommentModel.deleteComment(req.params.id);
      if (deletedComment) {
        res.json({ message: "Comment deleted" });
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCommentById: async (req, res) => {
    try {
      const comment = await CommentModel.getCommentById(req.params.id);
      if (comment) {
        res.json(comment);
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCommentsByTaskId: async (req, res) => {
    try {
      const comments = await CommentModel.getCommentsByTaskId(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = CommentController;
