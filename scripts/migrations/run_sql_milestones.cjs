const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function runSQL() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const sql = `
      CREATE TABLE IF NOT EXISTS milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        company TEXT DEFAULT 'All',
        term_type TEXT DEFAULT 'Short Term' CHECK (term_type IN ('Long Term', 'Short Term')),
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
        target_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    await client.query(sql);
    console.log('SQL executed successfully! created milestones table.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSQL();
