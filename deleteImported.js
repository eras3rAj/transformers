import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jedcblwqhiakgqpvsdlk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Fetching inv_txn logs...');
  const { data: logs, error: fetchError } = await supabase
    .from('system_logs')
    .select('id, changes')
    .eq('action', 'inv_txn');

  if (fetchError) {
    console.error('Error fetching logs:', fetchError);
    return;
  }

  const toDelete = logs.filter(log => log.changes && log.changes.remarks === 'Imported from Book1.xlsx');
  
  console.log(`Found ${toDelete.length} entries to delete.`);
  
  if (toDelete.length > 0) {
    const ids = toDelete.map(log => log.id);
    
    // Batch delete in chunks if there are many
    const chunk = ids.slice(0, 500); // 156 items, so one chunk is enough
    
    const { error: deleteError } = await supabase
      .from('system_logs')
      .delete()
      .in('id', chunk);
      
    if (deleteError) {
      console.error('Error deleting:', deleteError);
    } else {
      console.log('Successfully deleted the imported entries!');
    }
  }
}

run();
