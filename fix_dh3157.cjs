const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function fix() {
  const { data, error } = await supabase.from('system_logs')
    .update({ claim_id: 'DH-3157/QH-I/2601' })
    .eq('claim_id', 'DH-3157/QH-I/2601/PO(T)/PSPCL')
    .select();
    
  if (error) console.error(error);
  else console.log(`Updated ${data.length} logs successfully!`);
}
fix();
