const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function run() {
  const { data, error } = await supabase.from('purchase_orders')
    .select('po_no')
    .like('po_no', '%HD-999%');
    
  if (error) console.error(error);
  else console.log(data);
}
run();
