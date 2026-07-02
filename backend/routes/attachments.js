const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/database');
const { requireWrite } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const stamp = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${stamp}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// GET /api/attachments?ref_table=protocols&ref_id=PROT-...
router.get('/', async (req, res) => {
  try {
    const { ref_table, ref_id } = req.query;
    if (ref_table && ref_id) {
      const r = await pool.query(
        `SELECT * FROM attachments WHERE ref_table=$1 AND ref_id=$2 ORDER BY id DESC`,
        [ref_table, ref_id]
      );
      return res.json(r.rows);
    }
    const r = await pool.query(`SELECT * FROM attachments ORDER BY id DESC LIMIT 200`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/attachments  — multipart with file + ref_table + ref_id
router.post('/', requireWrite(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { ref_table, ref_id } = req.body || {};
    const r = await pool.query(
      `INSERT INTO attachments (filename, original_name, mime_type, size_bytes, ref_table, ref_id, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, ref_table || null, ref_id || null, req.user?.email || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attachments/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM attachments WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Attachment not found' });
    const a = r.rows[0];
    const p = path.join(UPLOAD_DIR, a.filename);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'File missing on disk' });
    res.download(p, a.original_name || a.filename);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/attachments/:id
router.delete('/:id', requireWrite(), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM attachments WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Attachment not found' });
    try { fs.unlinkSync(path.join(UPLOAD_DIR, r.rows[0].filename)); } catch (_) {}
    res.json({ message: 'Attachment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
