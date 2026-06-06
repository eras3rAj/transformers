const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jedcblwqhiakgqpvsdlk.supabase.co', 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc');

async function createMissingPOs() {
  const missingPOs = [
    {
      po_no: 'DH-3157/QH-I/2601/PO(T)/PSPCL',
      company_name: 'PSPCL', // Guessing based on suffix
      utility_board: 'PSPCL',
      conductor_type: 'Al',
      capacity: '16kVA',
      no_of_phases: '3-Phase',
      quantity: 1210, // Max stage Qty
      remarks: 'Auto-created to link inspection data'
    },
    {
      po_no: 'HD-1201/QQ-4034/PO(T)/PSPCL',
      company_name: 'PSPCL',
      utility_board: 'PSPCL',
      conductor_type: 'Al',
      capacity: '10kVA',
      no_of_phases: '3-Phase',
      quantity: 5263, // Max stage Qty
      remarks: 'Auto-created to link inspection data'
    }
  ];

  for (const po of missingPOs) {
    const { data, error } = await supabase.from('purchase_orders').insert([po]);
    if (error) console.error(`Error inserting ${po.po_no}:`, error);
    else console.log(`Created missing PO: ${po.po_no}`);
  }
}

createMissingPOs();
