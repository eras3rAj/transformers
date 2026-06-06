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
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        address TEXT,
        status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vendor_pos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_number TEXT UNIQUE NOT NULL,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        item TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        unit TEXT NOT NULL,
        unit_price NUMERIC,
        total_price NUMERIC,
        expected_delivery DATE,
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Received', 'Completed', 'Cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
