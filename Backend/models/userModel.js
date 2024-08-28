const pool = require('../db');

const UserModel = {
    getAllUsers: async () => {
        const result = await pool.query('SELECT * FROM users');
        return result.rows;
    },

    getUserByUsernameOrEmail: async (username, email) => {
        const result = await pool.query(
            `SELECT * FROM users WHERE username = $1 OR email = $2`,
            [username, email]
        );
        return result.rows[0];
    },

    getByUsername : async (username) => {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    },

    getUserById: async (id) => {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

    createUser : async (user) => {
        const result = await pool.query(
            `INSERT INTO users (username, email, password,profile_picture) 
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [user.username, user.email, user.password,user.profile_picture]
        );
        return result.rows[0];
    },
    

    updateUser : async (id, user) => {
        const result = await pool.query(
            `UPDATE users SET 
            username = COALESCE($1, username), 
            email = COALESCE($2, email), 
            password = COALESCE($3, password),
            profile_picture = COALESCE($4, profile_picture)
            WHERE id = $5 RETURNING *`,
            [user.username, user.email, user.password,user.profile_picture, id]
        );
        return result.rows[0];
    },

    deleteUser: async (id) => {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    getByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }
};

module.exports = UserModel;

