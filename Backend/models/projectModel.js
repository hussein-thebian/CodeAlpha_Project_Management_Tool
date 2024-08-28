const pool = require('../db');

const ProjectModel = {
  createProject: async (project) => {
    const result = await pool.query(
      `INSERT INTO Projects (name, description, created_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [project.name, project.description, project.created_by]
    );
    return result.rows[0];
  },

  updateProject: async (id, project) => {
    const result = await pool.query(
      `UPDATE Projects SET 
      name = COALESCE($1, name), 
      description = COALESCE($2, description), 
      created_by = COALESCE($3, created_by)
      WHERE id = $4 RETURNING *`,
      [project.name, project.description, project.created_by, id]
    );
    return result.rows[0];
  },

  deleteProject: async (projectId, userId) => {
    // Check if the project belongs to the user
    const project = await pool.query(
      'SELECT * FROM Projects WHERE id = $1 AND created_by = $2',
      [projectId, userId]
    );
    if (project.rows.length === 0) {
      return null; // The project does not exist or the user does not own it
    }

    // Delete related entries from ProjectMembers table
    await pool.query(
      'DELETE FROM ProjectMembers WHERE project_id = $1',
      [projectId]
    );

    // Proceed with deletion of the project
    const result = await pool.query(
      'DELETE FROM Projects WHERE id = $1 RETURNING *',
      [projectId]
    );
    return result.rows[0];
  },

  getAllProjects: async () => {
    const result = await pool.query('SELECT * FROM Projects');
    return result.rows;
  },

  getProjectsByOwner: async (ownerId) => {
    const result = await pool.query('SELECT * FROM Projects WHERE created_by = $1', [ownerId]);
    return result.rows;
  },

  getProjectById: async (id) => {
    const result = await pool.query('SELECT * FROM Projects WHERE id = $1', [id]);
    return result.rows[0];
  },

  getProjectByName: async (name) => {
    const result = await pool.query('SELECT * FROM Projects WHERE name = $1', [name]);
    return result.rows[0];
  },

  addMemberToProject: async (projectId, userId, role) => {
    const result = await pool.query(
      `INSERT INTO Projectmembers (project_id, user_id, role) 
       VALUES ($1, $2, $3) RETURNING *`,
      [projectId, userId, role]
    );
    return result.rows[0];
  },

  removeMemberFromProject: async (projectId, userId) => {
    const result = await pool.query(
      `DELETE FROM Projectmembers 
       WHERE project_id = $1 AND user_id = $2 RETURNING *`,
      [projectId, userId]
    );
    return result.rows[0];
  },

  getMembersOfProject: async (projectId) => {
    const result = await pool.query(
      `SELECT * FROM Projectmembers 
       WHERE project_id = $1`,
      [projectId]
    );
    return result.rows;
  },

  
  getProjectsOfMember: async (userId) => {
    const result = await pool.query(
      `SELECT p.* FROM Projects p
       JOIN Projectmembers pm ON p.id = pm.project_id
       WHERE pm.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  getUserInProject: async (projectId, userId) => {
    const result = await pool.query(
      `SELECT role, joined_at FROM Projectmembers
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    return result.rows[0]; // Return the first matching row
  },

    getNonMemberUsers : async (projectId) => {
      // Fetch user_ids from Projectmembers for the given project_id
      const { rows: memberRows } = await pool.query(
          `SELECT user_id FROM Projectmembers WHERE project_id = $1`,
          [projectId]
      );

      // Extract user_ids
      const memberUserIds = memberRows.map(row => row.user_id);

      // Fetch all users not in the list of memberUserIds
      const { rows: userRows } = await pool.query(
          `SELECT id, username, profile_picture FROM users WHERE id NOT IN (${memberUserIds.map((_, i) => `$${i + 1}`).join(', ')})`,
          [...memberUserIds]
      );

      return userRows;
    },
    removeTasksByUserInProject: async (projectId, userId) => {
      const result = await pool.query(
        `DELETE FROM Tasks 
         WHERE project_id = $1 AND assigned_to = $2`,
        [projectId, userId]
      );
      return result.rows[0];
    }

}

module.exports = ProjectModel;
