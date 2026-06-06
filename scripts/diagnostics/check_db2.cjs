const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Firebase%404747@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT po_no, base_month_str, ex_works FROM purchase_orders");
  console.log("POs:", res.rows);
  await client.end();
}

run();
