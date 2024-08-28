const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'project_management_tool',
    password: 'sql123',
    port: 5432,
});

module.exports = pool;