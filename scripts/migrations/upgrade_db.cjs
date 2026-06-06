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
ADD COLUMN IF NOT EXISTS weight_fixed NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS weight_al NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS weight_cu NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight_crgo NUMERIC DEFAULT 25,
ADD COLUMN IF NOT EXISTS weight_oil NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS weight_steel NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS weight_insulating NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS weight_cpi NUMERIC DEFAULT 10;
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to database successfully!");
    
    await client.query(sql);
    console.log("Database upgraded with formula columns successfully!");
    
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await client.end();
  }
}

run();
