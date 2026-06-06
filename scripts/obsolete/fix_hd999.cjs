const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function fix() {
  const { data, error } = await supabase.from('system_logs')
    .update({ claim_id: 'HD-999/Q-4021/PO(T)/PSPCL' })
    .eq('claim_id', 'HD-999/Q-4021')
    .select();
    
  if (error) console.error(error);
  else console.log(`Updated ${data.length} logs successfully!`);
}
fix();
