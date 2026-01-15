cat > backend/routes/profile.js << 'EOF'
const express = require('express');
const { pool } = require('../server');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    
    const result = await pool.query(
      `INSERT INTO profiles (user_id, full_name, phone, current_role, years_experience, skills, target_roles, preferred_locations, salary_expectation, company_preferences, resume)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
       full_name = $2, phone = $3, current_role = $4, years_experience = $5, skills = $6, target_roles = $7, preferred_locations = $8, salary_expectation = $9, company_preferences = $10, resume = $11
       RETURNING *`,
      [userId, profileData.full_name, profileData.phone, profileData.current_role, profileData.years_experience, profileData.skills, profileData.target_roles, profileData.preferred_locations, profileData.salary_expectation, profileData.company_preferences, profileData.resume]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
EOF