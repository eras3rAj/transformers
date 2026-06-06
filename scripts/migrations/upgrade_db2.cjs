const { Client } = require('pg');

const client = new Client({
  host: 'db.jedcblwqhiakgqpvsdlk.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Firebase@4747',
  ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS no_of_phases TEXT DEFAULT '3-Phase',
ADD COLUMN IF NOT EXISTS remarks TEXT;
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to database successfully!");
    
    await client.query(sql);
    console.log("Database upgraded with phases and remarks successfully!");
    
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await client.end();
  }
}

run();
