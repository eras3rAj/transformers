const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function enableRealtime() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // Get all tables in the public schema
    const { rows } = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public';
    `);

    console.log(`Found ${rows.length} tables in public schema.`);

    for (let row of rows) {
      const tableName = row.tablename;
      try {
        await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "${tableName}";`);
        console.log(`Enabled realtime for: ${tableName}`);
      } catch (err) {
        // Error code 42704 means the table is already in the publication
        if (err.code === '42704') {
          console.log(`Table ${tableName} is already in the publication.`);
        } else {
          console.error(`Could not add ${tableName} to publication: ${err.message}`);
        }
      }
    }

    console.log('Finished enabling realtime for all tables.');
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await client.end();
  }
}

enableRealtime();
