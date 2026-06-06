const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

const data = [
  // Image 1 & 2: Final HD-999/Q-4021
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-04-01", endDate: "2024-04-03", qtyOffered: 300, qtyInspected: 300, qtyAccepted: 298, remarks: "Memo: 3243 dtd 1/4/24" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-04-13", endDate: "2024-04-14", qtyOffered: 203, qtyInspected: 203, qtyAccepted: 202, remarks: "Memo: 3289 dtd 5/4/24" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-05-07", endDate: "2024-05-11", qtyOffered: 600, qtyInspected: 600, qtyAccepted: 597, remarks: "Memo: 3443 dtd 2/5/24" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-05-11", endDate: "2024-05-12", qtyOffered: 144, qtyInspected: 144, qtyAccepted: 143, remarks: "Memo: 3506 dtd 8/5/24, Remarks: 1240" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-05-28", endDate: "2024-05-31", qtyOffered: 553, qtyInspected: 553, qtyAccepted: 550, remarks: "Memo: 3612 dtd 22/5/24, Remarks: 1790" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-06-14", endDate: "2024-06-15", qtyOffered: 312, qtyInspected: 312, qtyAccepted: 310, remarks: "Memo: 3683 dtd 5/6/24, Remarks: 2100" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-06-26", endDate: "2024-06-28", qtyOffered: 427, qtyInspected: 427, qtyAccepted: 425, remarks: "Memo: 3786 dtd 21/6/24, Remarks: 2525" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-07-11", endDate: "2024-07-12", qtyOffered: 293, qtyInspected: 293, qtyAccepted: 291, remarks: "Memo: 3910 dtd 5/7/24, Remarks: 2816" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-07-21", endDate: "2024-07-23", qtyOffered: 282, qtyInspected: 282, qtyAccepted: 280, remarks: "Memo: 4034 dtd 21/7/24, Remarks: 3096" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-08-11", endDate: "2024-08-12", qtyOffered: 282, qtyInspected: 282, qtyAccepted: 280, remarks: "Memo: 4174 dtd 8/8/24, Remarks: 3376" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-09-16", endDate: "2024-09-17", qtyOffered: 306, qtyInspected: 306, qtyAccepted: 304, remarks: "Memo: 4373 dtd 4/9/24, Remarks: 3680" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2024-10-16", endDate: "2024-10-18", qtyOffered: 392, qtyInspected: 392, qtyAccepted: 390, remarks: "Memo: 4476 dtd 20/9/24, Remarks: 4070" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2025-03-25", endDate: "2025-03-26", qtyOffered: 111, qtyInspected: 111, qtyAccepted: 110, remarks: "Memo: 5385 dtd 24/3/25, Remarks: 4180" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2025-04-27", endDate: "2025-04-29", qtyOffered: 447, qtyInspected: 447, qtyAccepted: 445, remarks: "Memo: 5528 dtd 17/4/25, Remarks: 4625" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2025-05-03", endDate: "2025-05-06", qtyOffered: 497, qtyInspected: 497, qtyAccepted: 495, remarks: "Memo: 5529 dtd 17/4/25, Remarks: 5120" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2025-11-11", endDate: "2025-11-13", qtyOffered: 447, qtyInspected: 447, qtyAccepted: 445, remarks: "Memo: 6972 dtd 10/11/25, Remarks: 5565" },
  { poNo: "HD-999/Q-4021", type: "Final", startDate: "2026-05-09", endDate: "2026-05-12", qtyOffered: 500, qtyInspected: 500, qtyAccepted: 498, remarks: "Memo: 7981 dtd 6/5/26, Remarks: 6063" },

  // Image 3: Final HD-1197/QQ-4037
  { poNo: "HD-1197/QQ-4037", type: "Final", startDate: "2026-04-21", endDate: "2026-04-22", qtyOffered: 231, qtyInspected: 231, qtyAccepted: 230, remarks: "Memo: 7813 dtd 20/4/26" },
  { poNo: "HD-1197/QQ-4037", type: "Final", startDate: "2026-05-01", endDate: "2026-05-01", qtyOffered: 181, qtyInspected: 181, qtyAccepted: 180, remarks: "Memo: 7872 dtd 24/4/26, Remarks: 410" },
  { poNo: "HD-1197/QQ-4037", type: "Final", startDate: "2026-05-22", endDate: "2026-05-24", qtyOffered: 435, qtyInspected: 435, qtyAccepted: 433, remarks: "Memo: 8113 dtd 21/5/26, Remarks: 843" },

  // Image 4: Stage HD-1197/QQ-4037
  { poNo: "HD-1197/QQ-4037", type: "Stage", startDate: "2026-04-08", endDate: "2026-04-09", qtyOffered: 537, qtyInspected: 537, qtyAccepted: 537, weight: "27666.8", remarks: "Make: YUNLU, Memo: 7724 dtd 7/4/26, Place: IRTPL" },
  { poNo: "HD-1197/QQ-4037", type: "Stage", startDate: "2026-04-09", endDate: "2026-04-09", qtyOffered: 344, qtyInspected: 344, qtyAccepted: 344, weight: "17754.4", remarks: "Make: YUNLU, Memo: 7725 dtd 7/4/26, Place: IRTPL, Remarks: 881" },
  { poNo: "HD-1197/QQ-4037", type: "Stage", startDate: "2026-05-23", endDate: "2026-05-23", qtyOffered: 466, qtyInspected: 466, qtyAccepted: 466, weight: "24079.0", remarks: "Make: YUNLU, Memo: 8119 dtd 21/5/26, Place: IRTPL, Remarks: 1347" },

  // Image 5: Stage HD-999/Q-4021
  { poNo: "HD-999/Q-4021", type: "Stage", startDate: "2025-04-06", endDate: "2025-04-07", qtyOffered: 594, qtyInspected: 594, qtyAccepted: 594, weight: "52452.0", remarks: "Make: AT&M, Memo: 5441 dtd 3/4/25, Place: IRTPL, Remarks: 5980" },
  { poNo: "HD-999/Q-4021", type: "Stage", startDate: "2026-05-08", endDate: "2026-05-08", qtyOffered: 350, qtyInspected: 350, qtyAccepted: 350, weight: "30882.4", remarks: "Make: YUNLU, Memo: 7980 dtd 6/5/26, Place: IRTPL, Remarks: 6574" },
  { poNo: "HD-999/Q-4021", type: "Stage", startDate: "2026-05-09", endDate: "2026-05-09", qtyOffered: 140, qtyInspected: 140, qtyAccepted: 140, weight: "12397.8", remarks: "Make: YUNLU, Memo: 7979 dtd 6/5/26, Place: IRTPL, Remarks: 6924" },
  { poNo: "HD-999/Q-4021", type: "Stage", startDate: "2026-05-15", endDate: "2026-05-16", qtyOffered: 754, qtyInspected: 754, qtyAccepted: 754, weight: "66563.6", remarks: "Make: YUNLU, Memo: 8065 dtd 14/5/26, Place: IRTPL, Remarks: 7818" }
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
