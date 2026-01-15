cat > backend/routes/jobs.js << 'EOF'
const express = require('express');
const { pool } = require('../server');
const { scrapeLinkedIn } = require('../scraper/linkedin');

const router = express.Router();

router.post('/scrape', async (req, res) => {
  try {
    const { profile } = req.body;
    const jobs = await scrapeLinkedIn(profile);
    
    for (const job of jobs) {
      await pool.query(
        `INSERT INTO jobs (external_id, title, company, location, salary, type, description, requirements, url, source, posted_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (external_id) DO NOTHING`,
        [job.id, job.title, job.company, job.location, job.salary, job.type, 
         job.description, JSON.stringify(job.requirements), job.url, job.source, job.postedDate]
      );
    }
    
    res.json({ count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/matched/:userId', async (req, res) => {
  try {
    const jobsResult = await pool.query(
      'SELECT * FROM jobs ORDER BY posted_date DESC LIMIT 50'
    );
    
    res.json(jobsResult.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
EOF