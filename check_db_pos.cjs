const { Client } = require('pg');
const client = new Client({
  host: 'db.jedcblwqhiakgqpvsdlk.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Firebase@4747',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM purchase_orders WHERE base_month_str IS NULL OR base_month_str = ''");
  console.log("Empty PO base months:", res.rows);
  await client.end();
}

run();
