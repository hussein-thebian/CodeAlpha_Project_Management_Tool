const pool = require('../db');

const TaskModel = {
  createTask: async (task) => {
    const result = await pool.query(
      `INSERT INTO Tasks (project_id, title, description, assigned_to, due_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [task.project_id, task.title, task.description, task.assigned_to, task.due_date]
    );
    return result.rows[0];
  },

  updateTask: async (id, task) => {
    const result = await pool.query(
      `UPDATE Tasks SET 
       title = COALESCE($1, title), 
       description = COALESCE($2, description), 
       assigned_to = COALESCE($3, assigned_to), 
       status = COALESCE($4, status), 
       due_date = COALESCE($5, due_date)
       WHERE id = $6 RETURNING *`,
      [task.title, task.description, task.assigned_to, task.status, task.due_date, id]
    );
    return result.rows[0];
  },

  deleteTask: async (id) => {
    const result = await pool.query('DELETE FROM Tasks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  getTaskById: async (taskId) => {
    const result = await pool.query('SELECT * FROM Tasks WHERE id = $1', [taskId]);
    return result.rows;
  },

  getTasksByAssignedUser: async (userId) => {
    const result = await pool.query('SELECT * FROM Tasks WHERE assigned_to = $1 ORDER BY due_date ASC', [userId]);
    return result.rows;
  },

  isUserInProject: async (projectId, userId) => {
    const result = await pool.query(
      `SELECT * FROM ProjectMembers WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    return result.rows.length > 0;
  },

  getTasksByProjectId: async (projectId) => {
    const result = await pool.query('SELECT * FROM Tasks WHERE project_id = $1', [projectId]);
    return result.rows;
  },
  getTaskById: async (taskId) => {
    try {
        const result = await pool.query('SELECT * FROM Tasks WHERE id = $1', [taskId]);
        if (result.rows.length > 0) {
            return result.rows[0]; // Return the first task object
        } else {
            throw new Error('Task not found'); // Or handle the case where no task is found
        }
    } catch (error) {
        console.error('Error fetching task:', error);
        throw error; // Propagate the error to the caller
    }
}
};

module.exports = TaskModel;
