import { Pool } from 'pg';

export default async function handler(req, res) {
  console.log('========= DB TEST API CALLED =========');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔵 Testing database connection...');
    console.log('🔵 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
    
    const client = await pool.connect();
    console.log('✅ Connected to database!');
    
    // Test simple query
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Tables found:', tablesResult.rows);
    
    client.release();
    await pool.end();
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful!',
      timestamp: result.rows[0].now,
      version: result.rows[0].version,
      tables: tablesResult.rows.map(r => r.table_name)
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    await pool.end();
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.stack
    });
  }
}
