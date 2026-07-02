const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'pharma-trial-designer-secret-key-2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * RBAC roles:
 *  - sponsor: full read/write on every entity
 *  - pi:      full read/write on every entity
 *  - monitor: read all; write only on queries (so they can raise/close them)
 *
 * Usage:  router.post('/', requireRole('sponsor', 'pi'), handler)
 *         router.use(requireWrite())   // sponsors+PIs only
 */
const ROLE_WRITE_ALL = new Set(['sponsor', 'pi']);

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}` });
    }
    next();
  };
}

/**
 * Restrict write methods (POST/PUT/PATCH/DELETE) to sponsor or pi.
 * GET stays open for any authenticated user.
 */
function requireWrite() {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    if (isWrite && !ROLE_WRITE_ALL.has(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: write access requires sponsor or pi role' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, requireWrite, JWT_SECRET };
