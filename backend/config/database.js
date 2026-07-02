const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'clinical_trial_suite',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  // Log but do NOT exit: an idle-client error (e.g. Postgres restart, or the
  // seed script dropping tables while the server is up) is recoverable — the
  // pool discards the broken connection and opens a fresh one on next query.
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
