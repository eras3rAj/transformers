const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('PV Prices.xlsx', { cellDates: true });
  
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    // Use raw: false to get formatted strings (like 'Jan-26') instead of raw numbers
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
    
    data.forEach(row => {
      console.log(row.join(' | '));
    });
  }
} catch (err) {
  console.error("Error reading Excel file:", err.message);
}
