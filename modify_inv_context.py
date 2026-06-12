with open('src/context/InventoryContext.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'const transferStock =' not in c:
    transfer_func = """  const logTransaction = async (txnData) => {
    try {
      const dbRecord = {
        action: 'inv_txn',
        user_name: currentUser?.name || 'System',
        claim_id: txnData.location,
        changes: {
          location: txnData.location,
          item: txnData.item,
          type: txnData.type,
          qty: txnData.qty,
          date: txnData.date,
          remarks: txnData.remarks,
          companyName: txnData.companyName,
          billNo: txnData.billNo,
          receivingDate: txnData.receivingDate,
          billDate: txnData.billDate,
          unitPrice: txnData.unitPrice,
          usageType: txnData.usageType,
          department: txnData.department
        }
      };
      await addLog(dbRecord.action, dbRecord.changes, dbRecord.user_name, dbRecord.claim_id);
    } catch (error) {
      console.error("Error logging transaction:", error);
    }
  };

  const transferStock = async (itemId, fromLoc, toLoc, qty, companyName = '', remarks = '') => {
    // 1. Stock OUT from fromLoc
    await logTransaction({
      location: fromLoc,
      item: itemId,
      type: 'OUT',
      qty: qty,
      date: new Date().toISOString(),
      remarks: `Transfer to ${toLoc} - ${remarks}`,
      companyName: companyName,
      usageType: 'Production Transfer'
    });

    // 2. Stock IN to toLoc
    await logTransaction({
      location: toLoc,
      item: itemId,
      type: 'IN',
      qty: qty,
      date: new Date().toISOString(),
      remarks: `Transfer from ${fromLoc} - ${remarks}`,
      companyName: companyName,
      usageType: 'Production Transfer'
    });
  };"""
    
    # We will replace the original logTransaction block
    # We need to find the original logTransaction logic
    
    old_logTransaction = """  const logTransaction = async (txnData) => {
    try {
      const dbRecord = {
        action: 'inv_txn',
        user_name: currentUser?.name || 'System',
        claim_id: txnData.location,
        changes: {
          location: txnData.location,
          item: txnData.item,
          type: txnData.type,
          qty: txnData.qty,
          date: txnData.date,
          remarks: txnData.remarks,
          companyName: txnData.companyName,
          billNo: txnData.billNo,
          receivingDate: txnData.receivingDate,
          billDate: txnData.billDate,
          unitPrice: txnData.unitPrice,
          usageType: txnData.usageType,
          department: txnData.department
        }
      };
      await addLog(dbRecord.action, dbRecord.changes, dbRecord.user_name, dbRecord.claim_id);
    } catch (error) {
      console.error("Error logging transaction:", error);
    }
  };"""
    
    c = c.replace(old_logTransaction, transfer_func)

    provider_old = "addLocation, addUnit, addItem, addCompany, addDepartment, logTransaction, logBatchTransactions, deleteTransaction,"
    provider_new = "addLocation, addUnit, addItem, addCompany, addDepartment, logTransaction, logBatchTransactions, deleteTransaction, transferStock,"
    c = c.replace(provider_old, provider_new)

    with open('src/context/InventoryContext.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated InventoryContext.jsx")
else:
    print("Already updated")
