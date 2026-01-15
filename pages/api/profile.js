import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

export default async function handler(req, res) {
  console.log('========= PROFILE API CALLED =========');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  if (req.method === 'POST') {
    const client = await pool.connect();
    
    try {
      const profileData = req.body;
      
      console.log('🔵 [API] Creating/updating profile with data:', profileData);

      // Validate required fields
      if (!profileData.email || !profileData.name) {
        console.error('❌ [API] Missing required fields');
        return res.status(400).json({ error: 'Email and name are required' });
      }

      console.log('🔵 [API] Connecting to database...');

      await client.query('BEGIN');

      // Check if user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [profileData.email]
      );

      let userId;
      if (userCheck.rows.length > 0) {
        userId = userCheck.rows[0].id;
        console.log('✅ [API] User found with ID:', userId);
      } else {
        // Create new user with a default password (you should implement proper auth)
        const newUser = await client.query(
          'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
          [profileData.email, 'temp_password_change_this']
        );
        userId = newUser.rows[0].id;
        console.log('✅ [API] New user created with ID:', userId);
      }

      // Check if profile exists
      const profileCheck = await client.query(
        'SELECT id FROM profiles WHERE user_id = $1',
        [userId]
      );

      let profile;
      if (profileCheck.rows.length > 0) {
        // Update existing profile
        const result = await client.query(
          `UPDATE profiles 
           SET full_name = $1,
               job_title = $2,
               years_experience = $3,
               skills = $4,
               target_roles = $5,
               preferred_locations = $6,
               updated_at = NOW()
           WHERE user_id = $7
           RETURNING *`,
          [
            profileData.name,
            profileData.jobTitle || 'Not specified',
            parseInt(profileData.experience) || 0,
            Array.isArray(profileData.skills) ? profileData.skills.join(', ') : profileData.skills,
            Array.isArray(profileData.preferredIndustries) ? profileData.preferredIndustries.join(', ') : profileData.preferredIndustries,
            profileData.location || 'Remote',
            userId
          ]
        );
        profile = result.rows[0];
        console.log('✅ [API] Profile updated:', profile);
      } else {
        // Create new profile
        const result = await client.query(
          `INSERT INTO profiles (
            user_id, full_name, job_title, years_experience, 
            skills, target_roles, preferred_locations, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING *`,
          [
            userId,
            profileData.name,
            profileData.jobTitle || 'Not specified',
            parseInt(profileData.experience) || 0,
            Array.isArray(profileData.skills) ? profileData.skills.join(', ') : profileData.skills,
            Array.isArray(profileData.preferredIndustries) ? profileData.preferredIndustries.join(', ') : profileData.preferredIndustries,
            profileData.location || 'Remote'
          ]
        );
        profile = result.rows[0];
        console.log('✅ [API] Profile created:', profile);
      }

      await client.query('COMMIT');
      
      return res.status(200).json({ 
        success: true, 
        profile, 
        user: { id: userId, email: profileData.email } 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ [API] ERROR saving profile:', error);
      console.error('❌ [API] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack,
      });
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.detail || error.code || 'Unknown error'
      });
    } finally {
      client.release();
    }
  }

  if (req.method === 'GET') {
    const client = await pool.connect();
    
    try {
      const { email } = req.query;
      console.log('🔵 [API] Fetching profile for email:', email);

      const result = await client.query(
        `SELECT u.id, u.email, p.* 
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.email = $1`,
        [email]
      );

      const user = result.rows[0];
      console.log('✅ [API] Profile fetched:', user);
      
      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('❌ [API] ERROR fetching profile:', error);
      return res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
