const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5433/hackaton_db';

const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
