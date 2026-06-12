with open('src/context/InventoryContext.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

transfer_stock_code = """
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
    return true;
  };

"""

if 'const transferStock =' not in code:
    code = code.replace('  const deleteEntity = async', transfer_stock_code + '  const deleteEntity = async')
    with open('src/context/InventoryContext.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print('Successfully inserted transferStock')
else:
    print('transferStock already exists')
