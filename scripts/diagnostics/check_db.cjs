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
  const res = await client.query("SELECT month FROM pv_indices WHERE month IS NULL OR month = ''");
  console.log("Empty months:", res.rows);
  
  const res2 = await client.query("SELECT * FROM purchase_orders LIMIT 5");
  console.log("POs:", res2.rows);
  await client.end();
}

run();
