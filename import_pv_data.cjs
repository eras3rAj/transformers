const xlsx = require('xlsx');
const { Client } = require('pg');

const client = new Client({
  host: 'db.jedcblwqhiakgqpvsdlk.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Firebase@4747',
  ssl: { rejectUnauthorized: false }
});

const monthMap = { 
  'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April', 
  'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August', 
  'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December' 
};

function formatMonthStr(mStr) {
  if (!mStr || typeof mStr !== 'string') return null;
  const parts = mStr.split('-');
  if (parts.length !== 2) return null;
  const m = monthMap[parts[0]];
  const y = '20' + parts[1];
  return `${m} ${y}`;
}

async function run() {
  try {
    const workbook = xlsx.readFile('PV Prices.xlsx', { cellDates: true });
    const sheet = workbook.Sheets['Price Index'];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
    
    let parsedData = {};

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // When we find Aluminium, it means we found a data block
      if (row[1] === 'Aluminium') {
        const monthRow = data[i - 1]; // Previous row contains the months
        const alRow = data[i];
        const crgoRow = data[i + 1];
        const steelRow = data[i + 2];
        const insulRow = data[i + 3];
        const oilRow = data[i + 4];
        let cpiRow = data[i + 5];
        
        // Handle case where CPI is on i+5 or i+6 (some formatting issues in excel)
        if (cpiRow && cpiRow[1] !== 'Consumer Price Index') {
           cpiRow = data[i + 6];
        }

        // Loop through the 12 columns
        for (let col = 2; col <= 13; col++) {
          const rawMonth = monthRow[col];
          const formattedMonth = formatMonthStr(rawMonth);
          if (formattedMonth) {
            // Clean up numbers (remove commas, handle missing)
            const parseNum = (val) => {
              if (val === undefined || val === null || val === '') return null;
              if (typeof val === 'string') return parseFloat(val.replace(/,/g, ''));
              return parseFloat(val);
            };

            const al = parseNum(alRow[col]);
            const crgo = parseNum(crgoRow[col]);
            const steel = parseNum(steelRow[col]);
            const insul = parseNum(insulRow[col]);
            const oil = parseNum(oilRow[col]);
            const cpi = parseNum(cpiRow ? cpiRow[col] : null);

            // Only add if at least some data exists
            if (al || crgo || steel || insul || oil || cpi) {
              parsedData[formattedMonth] = {
                month: formattedMonth,
                al: al || 0,
                cu: 0,
                crgo: crgo || 0,
                steel315: steel || 0,
                insulating3: insul || 0,
                oil: oil || 0,
                cpi: cpi || 0
              };
            }
          }
        }
      }
    }

    const records = Object.values(parsedData);
    console.log(`Parsed ${records.length} months of data from Excel.`);

    await client.connect();
    console.log("Connected to Supabase DB.");

    // Delete existing dummy data
    await client.query("DELETE FROM pv_indices");
    console.log("Cleared existing dummy data.");

    // Insert new data
    for (const record of records) {
      const sql = `
        INSERT INTO pv_indices (month, al, cu, crgo, steel315, insulating3, oil, cpi)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      const values = [record.month, record.al, record.cu, record.crgo, record.steel315, record.insulating3, record.oil, record.cpi];
      await client.query(sql, values);
    }

    console.log("Successfully imported real PV indices into Supabase!");
    
  } catch (err) {
    console.error("Error migrating PV data:", err.message);
  } finally {
    await client.end();
  }
}

run();
