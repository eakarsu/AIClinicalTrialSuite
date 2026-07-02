const pool = require('../config/database');

/**
 * Broadcast a notification to every user (user_id IS NULL means org-wide;
 * here we materialise one row per user so per-user read state works).
 */
async function notifyAll({ type, title, body, refTable, refId }) {
  try {
    const users = await pool.query('SELECT id FROM users');
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, ref_table, ref_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        [u.id, type, title, body, refTable, refId]
      );
    }
  } catch (e) {
    console.warn('[notifications] notifyAll error:', e.message);
  }
}

/**
 * Notify only users with the listed roles.
 */
async function notifyRoles(roles, payload) {
  try {
    const users = await pool.query(`SELECT id FROM users WHERE role = ANY($1::text[])`, [roles]);
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, ref_table, ref_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        [u.id, payload.type, payload.title, payload.body, payload.refTable, payload.refId]
      );
    }
  } catch (e) {
    console.warn('[notifications] notifyRoles error:', e.message);
  }
}

module.exports = { notifyAll, notifyRoles };
