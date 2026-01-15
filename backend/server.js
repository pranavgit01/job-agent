cat > backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const cron = require('node-cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        phone VARCHAR(50),
        current_role VARCHAR(255),
        years_experience INTEGER,
        skills TEXT,
        target_roles TEXT,
        preferred_locations TEXT,
        salary_expectation VARCHAR(100),
        company_preferences TEXT,
        resume TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) UNIQUE,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        salary VARCHAR(100),
        type VARCHAR(50),
        description TEXT,
        requirements JSONB,
        url TEXT,
        source VARCHAR(50),
        posted_date TIMESTAMP,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        cover_letter TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        match_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs(posted_date DESC);
      CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

initDB();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

cron.schedule('0 */6 * * *', async () => {
  console.log('🔍 Starting scheduled job scraping...');
  const { scrapeLinkedIn } = require('./scraper/linkedin');
  
  try {
    await scrapeLinkedIn({ target_roles: 'Software Engineer', preferred_locations: 'Remote' });
    console.log('✅ Job scraping completed');
  } catch (error) {
    console.error('❌ Scraping error:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { pool };
EOF