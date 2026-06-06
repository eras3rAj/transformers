import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jedcblwqhiakgqpvsdlk.supabase.co';
const supabaseAnonKey = 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`❌ Table "${tableName}" query failed:`, error.message);
  } else {
    console.log(`✅ Table "${tableName}" queried successfully. Found ${data.length} records.`);
  }
}

async function run() {
  await checkTable('users');
  await checkTable('letters_of_credit');
  await checkTable('bank_guarantees');
  await checkTable('custom_duties');
}

run();
