cat > backend/routes/applications.js << 'EOF'
const express = require('express');
const { pool } = require('../server');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, jobId, coverLetter, matchScore } = req.body;
    
    const result = await pool.query(
      'INSERT INTO applications (user_id, job_id, cover_letter, match_score, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, jobId, coverLetter, matchScore, 'draft']
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, j.title, j.company, j.location 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE a.user_id = $1 
       ORDER BY a.created_at DESC`,
      [req.params.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
EOF