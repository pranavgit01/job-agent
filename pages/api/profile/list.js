import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();
  
  try {
    console.log('🔵 [API] Fetching all profiles...');

    const result = await client.query(
      `SELECT 
        p.id,
        p.user_id,
        p.full_name,
        p.phone,
        p.job_title,
        p.years_experience,
        p.skills,
        p.target_roles,
        p.preferred_locations,
        p.salary_expectation,
        p.company_preferences,
        p.resume,
        p.updated_at,
        u.email
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.updated_at DESC`
    );

    console.log('✅ [API] Found', result.rows.length, 'profiles');
    
    return res.status(200).json({ 
      success: true, 
      profiles: result.rows 
    });
  } catch (error) {
    console.error('❌ [API] ERROR fetching profiles:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    client.release();
  }
}
