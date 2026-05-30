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
      CREATE TABLE IF NOT EXISTS pending_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        raised_by TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
        latest_update TEXT,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
