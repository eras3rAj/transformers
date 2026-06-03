const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function fix() {
  const { data, error } = await supabase.from('system_logs').select('id, claim_id').eq('action', 'po_inspection');
  if (error) {
    console.error(error);
    return;
  }
  
  let count = 0;
  for (const log of data) {
    let newClaimId = log.claim_id;
    if (log.claim_id === 'HD-1022/Q-4022') newClaimId = 'HD-1022/Q-4022/PO(T)/PSPCL';
    else if (log.claim_id === 'HD-1134/QQ-4033' || log.claim_id === 'HD-1134/Q-4033') newClaimId = 'HD-1134/QQ-4033/PO(T)/PSPCL';
    else if (log.claim_id === 'HD-1201/QQ-4034') newClaimId = 'HD-1201/QQ-4034/PO(T)/PSPCL'; // Guessing it has the same suffix
    else if (log.claim_id === 'DH-3157/QH-I/2601') newClaimId = 'DH-3157/QH-I/2601/PO(T)/PSPCL'; // Guessing
    else if (log.claim_id === 'HD-1197/QQ-4037' || log.claim_id === 'HD-1197/Q-4037') newClaimId = 'HD-1197/QQ-4037/PO(T)/PSPCL'; // Wait, it's HD-1199 in DB?

    if (newClaimId !== log.claim_id) {
      await supabase.from('system_logs').update({ claim_id: newClaimId }).eq('id', log.id);
      count++;
    }
  }
  console.log(`Updated ${count} inspection logs.`);
}

fix();
