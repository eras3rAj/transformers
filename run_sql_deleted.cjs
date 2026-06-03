const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSQL() {
  try {
    await client.connect();
    
    // Create deleted_options table
    const sql = `
      CREATE TABLE IF NOT EXISTS deleted_options (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        option_type TEXT NOT NULL,
        option_value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(option_type, option_value)
      );
    `;

    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSQL();
