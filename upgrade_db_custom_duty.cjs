const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS custom_duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  import_source TEXT NOT NULL CHECK (import_source IN ('China', 'Japan')),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'INR')),
  exchange_rate NUMERIC NOT NULL DEFAULT 1.0,
  invoice_value NUMERIC NOT NULL,
  sea_freight NUMERIC NOT NULL,
  insurance NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to database successfully!");
    
    await client.query(sql);
    console.log("Database schema updated: created custom_duties table!");
    
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await client.end();
  }
}

run();
