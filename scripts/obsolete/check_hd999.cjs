const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function run() {
  const { data, error } = await supabase.from('system_logs')
    .select('*')
    .eq('claim_id', 'HD-999/Q-4021/PO(T)/PSPCL') // Checking if it has suffix
    .order('timestamp', { ascending: true });
    
  if (error) {
    console.error(error);
    return;
  }
  
  if (data.length === 0) {
    // try without suffix
    const res = await supabase.from('system_logs')
      .select('*')
      .eq('claim_id', 'HD-999/Q-4021')
      .order('timestamp', { ascending: true });
    
    if (res.error) console.error(res.error);
    else console.log(`Found ${res.data.length} logs for HD-999/Q-4021:\n` + res.data.map(d => `${d.id} | ${d.changes.type} | ${d.changes.startDate} | ${d.changes.qtyOffered} | ${d.changes.qtyAccepted} | ${d.changes.remarks}`).join('\n'));
  } else {
    console.log(`Found ${data.length} logs for HD-999/Q-4021/PO(T)/PSPCL:\n` + data.map(d => `${d.id} | ${d.changes.type} | ${d.changes.startDate} | ${d.changes.qtyOffered} | ${d.changes.qtyAccepted} | ${d.changes.remarks}`).join('\n'));
  }
}
run();
