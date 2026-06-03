const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function run() {
  const { data: pos } = await supabase.from('purchase_orders').select('po_no, utility_board').like('po_no', '%DH-3157%');
  console.log("POs:", pos);

  const { data: logs } = await supabase.from('system_logs').select('id, claim_id').like('claim_id', '%DH-3157%');
  console.log("Logs count:", logs.length, "Sample:", logs.slice(0, 2));
}
run();
