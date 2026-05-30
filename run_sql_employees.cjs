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
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        emp_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        designation TEXT NOT NULL,
        contact TEXT,
        join_date DATE NOT NULL,
        status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Resigned', 'Terminated')),
        salary NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Optional: Insert dummy data if table is empty
      INSERT INTO employees (emp_code, name, department, designation, contact, join_date, status, salary)
      SELECT 'VF-001', 'Rahul Sharma', 'Production', 'Senior Welder', '+91 9876543210', '2023-01-15', 'Active', 25000
      WHERE NOT EXISTS (SELECT 1 FROM employees WHERE emp_code = 'VF-001');

      INSERT INTO employees (emp_code, name, department, designation, contact, join_date, status, salary)
      SELECT 'VF-002', 'Priya Singh', 'Stores', 'Inventory Manager', '+91 9876543211', '2023-03-10', 'Active', 30000
      WHERE NOT EXISTS (SELECT 1 FROM employees WHERE emp_code = 'VF-002');
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
