import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jedcblwqhiakgqpvsdlk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc'; // Anon key can insert if RLS is disabled or allows insert
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  // add 1 day to correct the leap year bug in excel 1900
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate() + 1).toISOString().split('T')[0];
}

async function run() {
  const workbook = xlsx.readFile('Book1.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const headers = data[1];
  const items = headers.slice(3); // 'Drum', 'Reels', etc...
  
  const transactionsToInsert = [];
  
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    let dateStr = row[0];
    if (typeof dateStr === 'number') {
      dateStr = excelDateToJSDate(dateStr);
    }
    
    const billNo = row[1];
    const company = row[2];
    
    for (let j = 0; j < items.length; j++) {
      const colIndex = j + 3;
      const qty = row[colIndex];
      const itemName = items[j];
      
      if (qty && qty > 0) {
        // Prepare transaction payload for Supabase system_logs
        const payload = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'IN',
          item: itemName,
          qty: qty,
          unit: 'primary',
          date: dateStr,
          companyName: company || 'N/A',
          billNo: billNo || '',
          receivingDate: dateStr,
          location: 'JM IGC',
          department: '',
          usageType: 'EXTERNAL',
          remarks: 'Imported from Book1.xlsx',
          recorded_by: 'Admin'
        };
        
        transactionsToInsert.push({
          action: 'inv_txn',
          changes: payload,
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });
      }
    }
  }

  console.log(`Prepared ${transactionsToInsert.length} transactions for insertion.`);
  if (transactionsToInsert.length > 0) {
    console.log('Sample transaction:', transactionsToInsert[0]);
  }

  // Insert into Supabase
  const { data: res, error } = await supabase.from('system_logs').insert(transactionsToInsert);
  
  if (error) {
    console.error('Error inserting into Supabase:', error);
  } else {
    console.log('Successfully inserted into Supabase!');
  }
}

run();
