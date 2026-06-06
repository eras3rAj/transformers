const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Supabase@47@db.jedcblwqhiakgqpvsdlk.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

const data = [
  // Image 1: Stage DH-3157/QH-I/2601 16kVA
  { poNo: "DH-3157/QH-I/2601", type: "Stage", startDate: "2026-04-04", endDate: "2026-04-04", qtyOffered: 450, qtyInspected: 450, qtyAccepted: 450, remarks: "Memo: 320268286 dtd 20/3/26" },
  { poNo: "DH-3157/QH-I/2601", type: "Stage", startDate: "2026-04-26", endDate: "2026-04-26", qtyOffered: 400, qtyInspected: 400, qtyAccepted: 400, remarks: "Memo: 4202610426 dtd 20/4/26, Remarks: 850" },
  { poNo: "DH-3157/QH-I/2601", type: "Stage", startDate: "2026-05-16", endDate: "2026-05-16", qtyOffered: 360, qtyInspected: 360, qtyAccepted: 360, remarks: "Memo: 5202610551 dtd 11/5/26, Remarks: 1210" },

  // Image 2: Stage HD-1201/QQ-4034/ 10kVA
  { poNo: "HD-1201/QQ-4034", type: "Stage", startDate: "2026-04-01", endDate: "2026-04-02", qtyOffered: 768, qtyInspected: 768, qtyAccepted: 768, weight: "36491.2", remarks: "Make: YUNLU, Memo: 7667 dtd 1/4/26, Place: IRTPL" },
  { poNo: "HD-1201/QQ-4034", type: "Stage", startDate: "2026-04-04", endDate: "2026-04-05", qtyOffered: 933, qtyInspected: 933, qtyAccepted: 933, weight: "44349.4", remarks: "Make: YUNLU, Memo: 7666 dtd 1/4/26, Place: IRTPL, Remarks: 1701" },
  { poNo: "HD-1201/QQ-4034", type: "Stage", startDate: "2026-04-17", endDate: "2026-04-18", qtyOffered: 1386, qtyInspected: 1386, qtyAccepted: 1386, weight: "66127.6", remarks: "Make: YUNLU, Memo: 7800 dtd 15/4/26, Place: IRTPL, Remarks: 3087" },
  { poNo: "HD-1201/QQ-4034", type: "Stage", startDate: "2026-05-06", endDate: "2026-05-07", qtyOffered: 1251, qtyInspected: 1251, qtyAccepted: 1251, weight: "59707.2", remarks: "Make: YUNLU, Memo: 7975 dtd 6/5/26, Place: IRTPL, Remarks: 4338" },
  { poNo: "HD-1201/QQ-4034", type: "Stage", startDate: "2026-05-07", endDate: "2026-05-07", qtyOffered: 130, qtyInspected: 130, qtyAccepted: 130, weight: "6241.4", remarks: "Make: YUNLU, Memo: 7976 dtd 6/5/26, Place: IRTPL, Remarks: 4468" },
  { poNo: "HD-1201/QQ-4034", type: "Stage", startDate: "2026-05-28", endDate: "2026-05-29", qtyOffered: 795, qtyInspected: 795, qtyAccepted: 795, weight: "37945.0", remarks: "Make: YUNLU, Memo: 8161 dtd 27/5/26, Place: IRTPL, Remarks: 5263" },

  // Image 3: Stage HD-1134/QQ-4033/ 200kVA
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-01-06", endDate: "2026-01-06", qtyOffered: 47, qtyInspected: 47, qtyAccepted: 47, weight: "22104.1", remarks: "Make: YUNLU, Memo: 7216 dtd 5/1/26, Place: IRTPL, Remarks: 95" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-01-11", endDate: "2026-01-11", qtyOffered: 48, qtyInspected: 48, qtyAccepted: 48, weight: "22584.4", remarks: "Make: YUNLU, Memo: 7234 dtd 7/1/26, Place: IRTPL, Remarks: 143" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-01-25", endDate: "2026-01-25", qtyOffered: 48, qtyInspected: 48, qtyAccepted: 48, weight: "22674.4", remarks: "Make: YUNLU, Memo: 7302 dtd 20/1/26, Place: IRTPL" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-01", endDate: "2026-02-01", qtyOffered: 23, qtyInspected: 23, qtyAccepted: 23, weight: "11286.4", remarks: "Make: Material, Memo: 7337 dtd 28/1/26, Place: IRTPL, Remarks: 166" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-01", endDate: "2026-02-01", qtyOffered: 6, qtyInspected: 6, qtyAccepted: 6, weight: "3019.2", remarks: "Make: Material, Memo: 7338 dtd 28/1/26, Place: IRTPL, Remarks: 172" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-01", endDate: "2026-02-01", qtyOffered: 8, qtyInspected: 8, qtyAccepted: 8, weight: "3777.0", remarks: "Make: Material, Memo: 7339 dtd 28/1/26, Place: IRTPL, Remarks: 180" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-12", endDate: "2026-02-12", qtyOffered: 3, qtyInspected: 3, qtyAccepted: 3, weight: "1515.2", remarks: "Make: AT&M, Memo: 7340 dtd 28/1/26, Place: IRTPL, Remarks: 183" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-12", endDate: "2026-02-12", qtyOffered: 50, qtyInspected: 50, qtyAccepted: 50, weight: "23935.0", remarks: "Make: AT&M, Memo: 7408 dtd 11/2/26, Place: IRTPL, Remarks: 233" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-28", endDate: "2026-02-28", qtyOffered: 39, qtyInspected: 39, qtyAccepted: 39, weight: "18453.9", remarks: "Make: YUNLU, Memo: 534 dtd 25/2/26, Place: IRTPL, Remarks: 272" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-02-28", endDate: "2026-02-28", qtyOffered: 15, qtyInspected: 15, qtyAccepted: 15, weight: "7279.7", remarks: "Make: YUNLU, Memo: 535 dtd 25/2/26, Place: IRTPL, Remarks: 287" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-03-01", endDate: "2026-03-03", qtyOffered: 198, qtyInspected: 198, qtyAccepted: 198, weight: "93438.9", remarks: "Make: YUNLU, Memo: 552 dtd 27/2/26, Place: IRTPL, Remarks: 485" },
  { poNo: "HD-1134/QQ-4033", type: "Stage", startDate: "2026-04-19", endDate: "2026-04-19", qtyOffered: 36, qtyInspected: 36, qtyAccepted: 36, weight: "17394.3", remarks: "Make: YUNLU, Memo: 7812 dtd 17/4/26, Place: IRTPL, Remarks: 521" },

  // Image 4: Stage HD-1022/Q-4022/ 63kVA II
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-08-02", endDate: "2025-08-03", qtyOffered: 259, qtyInspected: 259, qtyAccepted: 259, weight: "45269.0", remarks: "Make: AT&M, Memo: 6286 dtd 30/7/25, Place: IRTPL, Remarks: 2676" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-08-16", endDate: "2025-08-17", qtyOffered: 257, qtyInspected: 257, qtyAccepted: 257, weight: "44845.4", remarks: "Make: YUNLU, Memo: 6365 dtd 8/8/25, Place: IRTPL, Remarks: 2933" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-08-20", endDate: "2025-08-22", qtyOffered: 374, qtyInspected: 374, qtyAccepted: 374, weight: "65305.0", remarks: "Make: YUNLU, Memo: 6391 dtd 13/8/25, Place: IRTPL, Remarks: 3307" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-08-25", endDate: "2025-08-26", qtyOffered: 236, qtyInspected: 236, qtyAccepted: 236, weight: "41322.7", remarks: "Make: YUNLU, Memo: 6470 dtd 22/8/25, Place: IRTPL, Remarks: 3543" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-08-26", endDate: "2025-08-26", qtyOffered: 151, qtyInspected: 151, qtyAccepted: 151, weight: "26460.1", remarks: "Make: YUNLU, Memo: 6471 dtd 22/8/25, Place: IRTPL, Remarks: 3694" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-09-01", endDate: "2025-09-02", qtyOffered: 330, qtyInspected: 330, qtyAccepted: 330, weight: "57594.9", remarks: "Make: YUNLU, Memo: 6516 dtd 28/8/25, Place: IRTPL, Remarks: 4024" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-09-02", endDate: "2025-09-04", qtyOffered: 373, qtyInspected: 373, qtyAccepted: 373, weight: "65141.4", remarks: "Make: YUNLU, Memo: 6541 dtd 1/9/25, Place: IRTPL, Remarks: 4397" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-09-10", endDate: "2025-09-11", qtyOffered: 226, qtyInspected: 226, qtyAccepted: 226, weight: "39518.0", remarks: "Make: YUNLU, Memo: 6606 dtd 9/9/25, Place: IRTPL, Remarks: 4623" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2025-12-20", endDate: "2025-12-20", qtyOffered: 183, qtyInspected: 183, qtyAccepted: 183, weight: "31923.5", remarks: "Make: YUNLU, Memo: 7152 dtd 17/12/25, Place: IRTPL, Remarks: 4806" },
  { poNo: "HD-1022/Q-4022", type: "Stage", startDate: "2026-03-17", endDate: "2026-03-17", qtyOffered: 194, qtyInspected: 194, qtyAccepted: 194, weight: "33835.9", remarks: "Make: YUNLU, Memo: 7547 dtd 13/3/26, Place: IRTPL, Remarks: 5000" },

  // Image 5: Final HD-1134/Q-4033 200kVA
  { poNo: "HD-1134/Q-4033", type: "Final", startDate: "2026-01-11", endDate: "2026-01-12", qtyOffered: 26, qtyInspected: 26, qtyAccepted: 25, remarks: "Memo: 7245 dtd 9/1/26" },
  { poNo: "HD-1134/Q-4033", type: "Final", startDate: "2026-02-02", endDate: "2026-02-03", qtyOffered: 51, qtyInspected: 51, qtyAccepted: 50, remarks: "Memo: 7324 dtd 27/1/26, Remarks: 75" },
  { poNo: "HD-1134/Q-4033", type: "Final", startDate: "2026-02-11", endDate: "2026-02-12", qtyOffered: 101, qtyInspected: 101, qtyAccepted: 100, remarks: "Memo: 7377 dtd 6/2/26, Remarks: 175" },
  { poNo: "HD-1134/Q-4033", type: "Final", startDate: "2026-02-28", endDate: "2026-03-01", qtyOffered: 58, qtyInspected: 58, qtyAccepted: 57, remarks: "Memo: 522 dtd 23/2/26, Remarks: 232" },
  { poNo: "HD-1134/Q-4033", type: "Final", startDate: "2026-04-01", endDate: "2026-04-02", qtyOffered: 121, qtyInspected: 121, qtyAccepted: 120, remarks: "Memo: 7627 dtd 27/3/26, Remarks: 352" },
  { poNo: "HD-1134/Q-4033", type: "Final", startDate: "2026-05-03", endDate: "2026-05-04", qtyOffered: 47, qtyInspected: 47, qtyAccepted: 46, remarks: "Memo: 7903 dtd 29/4/26, Remarks: 398" }
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
