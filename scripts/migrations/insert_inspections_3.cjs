const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

const data = [
  // Image 1: Final DH-3157/QH-I/2601 16kVA
  { poNo: "DH-3157/QH-I/2601", type: "Final", startDate: "2026-04-08", endDate: "2026-04-09", qtyOffered: 405, qtyInspected: 405, qtyAccepted: 405, remarks: "Memo: 4202610360 dt 6/4/26" },
  { poNo: "DH-3157/QH-I/2601", type: "Final", startDate: "2026-05-08", endDate: "2026-05-09", qtyOffered: 405, qtyInspected: 405, qtyAccepted: 405, remarks: "Memo: 4202610497 dtd 29/4/26, Remarks: 810" },

  // Image 2: Final HD-1022/Q-4022 63kVA
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2024-08-29", endDate: "2024-08-30", qtyOffered: 252, qtyInspected: 252, qtyAccepted: 250, remarks: "Memo: 4215 dtd 14/8/24" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-05-28", endDate: "2025-05-30", qtyOffered: 250, qtyInspected: 250, qtyAccepted: 249, remarks: "Memo: 5750 dtd 24/5/25, Remarks: 499" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-05-30", endDate: "2025-05-31", qtyOffered: 227, qtyInspected: 227, qtyAccepted: 226, remarks: "Memo: 5763 dtd 28/5/25, Remarks: 725" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-06-21", endDate: "2025-06-22", qtyOffered: 181, qtyInspected: 181, qtyAccepted: 180, remarks: "Memo: 5915 dtd 18/6/25, Remarks: 905" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-07-01", endDate: "2025-07-02", qtyOffered: 302, qtyInspected: 302, qtyAccepted: 300, remarks: "Memo: 6017 dtd 30/6/25, Remarks: 1205" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-07-12", endDate: "2025-07-13", qtyOffered: 302, qtyInspected: 302, qtyAccepted: 300, remarks: "Memo: 6098 dtd 7/7/25, Remarks: 1505" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-07-26", endDate: "2025-07-27", qtyOffered: 302, qtyInspected: 302, qtyAccepted: 300, remarks: "Memo: 6202 dtd 18/7/25, Remarks: 1805" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-08-02", endDate: "2025-08-03", qtyOffered: 227, qtyInspected: 227, qtyAccepted: 226, remarks: "Memo: 6310 dtd 1/8/25, Remarks: 2031" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-08-16", endDate: "2025-08-17", qtyOffered: 241, qtyInspected: 241, qtyAccepted: 240, remarks: "Memo: 6357 dtd 6/8/25, Remarks: 2271" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-08-20", endDate: "2025-08-22", qtyOffered: 250, qtyInspected: 250, qtyAccepted: 249, remarks: "Memo: 6387 dtd 12/8/25, Remarks: 2520" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-09-01", endDate: "2025-09-02", qtyOffered: 226, qtyInspected: 226, qtyAccepted: 225, remarks: "Memo: 6434 dtd 23/8/25, Remarks: 2745" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-09-10", endDate: "2025-09-11", qtyOffered: 250, qtyInspected: 250, qtyAccepted: 249, remarks: "Memo: 6604 dtd 9/9/25, Remarks: 2994" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-09-22", endDate: "2025-09-23", qtyOffered: 250, qtyInspected: 250, qtyAccepted: 249, remarks: "Memo: 6632 dtd 12/9/25, Remarks: 3243" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2025-09-30", endDate: "2025-10-01", qtyOffered: 250, qtyInspected: 250, qtyAccepted: 249, remarks: "Memo: 6691 dtd 24/9/25, Remarks: 3492" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2026-03-01", endDate: "2026-03-04", qtyOffered: 525, qtyInspected: 525, qtyAccepted: 522, remarks: "Memo: 531 dtd 25/2/26, Remarks: 4014" },
  { poNo: "HD-1022/Q-4022", type: "Final", startDate: "2026-05-19", endDate: "2026-05-20", qtyOffered: 174, qtyInspected: 174, qtyAccepted: 173, remarks: "Memo: 8081 dtd 18/5/26, Remarks: 4187" }
];

async function runInsert() {
  try {
    await client.connect();
    console.log('Connected to database.');

    let insertedCount = 0;

    for (const d of data) {
      const dbRecord = {
        action: 'po_inspection',
        user_name: 'admin',
        claim_id: d.poNo,
        changes: {
          type: d.type,
          startDate: d.startDate,
          endDate: d.endDate,
          qtyOffered: d.qtyOffered,
          qtyInspected: d.qtyInspected,
          qtyAccepted: d.qtyAccepted,
          weight: d.weight || "",
          remarks: d.remarks
        }
      };

      const query = `
        INSERT INTO system_logs (action, user_name, claim_id, changes)
        VALUES ($1, $2, $3, $4)
      `;
      const values = [dbRecord.action, dbRecord.user_name, dbRecord.claim_id, dbRecord.changes];
      
      await client.query(query, values);
      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} inspection records.`);
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runInsert();
