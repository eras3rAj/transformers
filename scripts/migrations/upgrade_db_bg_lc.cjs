const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS letters_of_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_of_issue DATE NOT NULL,
  usd_amount NUMERIC NOT NULL,
  payment_due_days INTEGER NOT NULL,
  bl_date DATE NOT NULL,
  usd_to_inr_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_guarantees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_of_issue DATE NOT NULL,
  valid_till DATE NOT NULL,
  amount NUMERIC NOT NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_no TEXT,
  is_court_case BOOLEAN DEFAULT FALSE,
  court_case_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to database successfully!");
    
    await client.query(sql);
    console.log("Database schema updated: created letters_of_credit and bank_guarantees tables!");
    
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await client.end();
  }
}

run();
