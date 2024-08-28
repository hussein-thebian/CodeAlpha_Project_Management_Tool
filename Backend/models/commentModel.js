const pool = require('../db');

const CommentModel = {
  createComment: async (comment) => {
    const result = await pool.query(
      `INSERT INTO Comments (task_id, user_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [comment.task_id, comment.user_id, comment.content]
    );
    return result.rows[0];
  },

  deleteComment: async (id) => {
    const result = await pool.query(
      `DELETE FROM Comments 
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  getCommentById: async (id) => {
    const result = await pool.query(
      `SELECT * FROM Comments 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  getCommentsByTaskId: async (taskId) => {
    const result = await pool.query(
      `SELECT * FROM Comments 
       WHERE task_id = $1 ORDER BY created_at DESC`,
      [taskId]
    );
    return result.rows;
  }
};

module.exports = CommentModel;
