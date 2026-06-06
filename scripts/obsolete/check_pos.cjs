const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function run() {
  const { data, error } = await supabase.from('purchase_orders').select('po_no');
  if (error) console.error(error);
  else {
    console.log("All POs in DB:");
    data.forEach(d => console.log(d.po_no));
  }
}

run();
