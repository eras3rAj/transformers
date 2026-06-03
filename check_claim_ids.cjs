const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function run() {
  const { data, error } = await supabase.from('system_logs').select('claim_id').eq('action', 'po_inspection');
  if (error) {
    console.error(error);
    return;
  }
  const counts = {};
  data.forEach(d => {
    counts[d.claim_id] = (counts[d.claim_id] || 0) + 1;
  });
  console.log(counts);
}
run();
