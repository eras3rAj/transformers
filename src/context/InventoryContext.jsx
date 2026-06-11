import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLogs } from './LogContext';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { addLog } = useLogs();
  
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventoryData = async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .in('action', ['inv_loc', 'inv_unit', 'inv_item', 'inv_txn', 'inv_company', 'inv_category', 'inv_department'])
      .order('timestamp', { ascending: true });

    if (!error && data) {
      const locsMap = new Map();
      const unsMap = new Map();
      const itmsMap = new Map();
      const compsMap = new Map();
      const deptsMap = new Map();
      const txns = [];
      const catsMap = new Map();

      data.forEach(log => {
        const payload = log.changes || {};
        if (log.action === 'inv_category') catsMap.set(payload.name, { id: log.id, name: payload.name, suppliers: payload.suppliers || [] });
        else if (log.action === 'inv_loc') locsMap.set(payload.name, { id: log.id, name: payload.name });
        else if (log.action === 'inv_unit') unsMap.set(payload.name, { id: log.id, name: payload.name });
        else if (log.action === 'inv_department') deptsMap.set(payload.name, { id: log.id, name: payload.name });
        else if (log.action === 'inv_item') {
          itmsMap.set(log.id, { 
            id: log.id, 
            name: payload.name, 
            unit: payload.unit,
            category: payload.category || 'Uncategorized',
            suppliers: payload.suppliers || [],
            minStockLevels: payload.minStockLevels || {}
          });
        }
        else if (log.action === 'inv_company') compsMap.set(payload.name, { id: log.id, name: payload.name, address: payload.address || '', mobile: payload.mobile || '', poc: payload.poc || '', gst: payload.gst || '' });
        else if (log.action === 'inv_txn') {
          txns.push({
            id: log.id,
            location: payload.location,
            item: payload.item,
            type: payload.type, // 'IN' or 'OUT'
            qty: Number(payload.qty),
            date: payload.date,
            remarks: payload.remarks || '',
            companyName: payload.companyName || '',
            billNo: payload.billNo || '',
            receivingDate: payload.receivingDate || '',
            billDate: payload.billDate || '',
            unitPrice: payload.unitPrice || '',
            usageType: payload.usageType || '',
            department: payload.department || '',
            user: log.user_name,
            timestamp: log.timestamp
          });
        }
      });

      setLocations(Array.from(locsMap.values()));
      setUnits(Array.from(unsMap.values()));
      setItems(Array.from(itmsMap.values()));
      setCompanies(Array.from(compsMap.values()));
      setDepartments(Array.from(deptsMap.values()));
      setTransactions(txns);
      setCategories(Array.from(catsMap.values()));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const addLocation = async (name) => {
    if (locations.find(l => l.name.toLowerCase() === name.toLowerCase())) return false; // duplicate

    const dbRecord = {
      action: 'inv_loc',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setLocations(prev => [...prev, { id: data[0].id, name }]);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: 'Added Inventory Location',
        user: currentUser?.name,
        changes: [{ field: 'Location Name', oldValue: '', newValue: name }]
      });
      return true;
    }
    return false;
  };

  const addCompany = async (name, address = '', mobile = '', poc = '', gst = '') => {
    if (companies.find(c => c.name.toLowerCase() === name.toLowerCase())) return false;

    const dbRecord = {
      action: 'inv_company',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name, address, mobile, poc, gst }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setCompanies(prev => [...prev, { id: data[0].id, name, address, mobile, poc, gst }].sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    }
    return false;
  };

  const addDepartment = async (name) => {
    if (departments.find(d => d.name.toLowerCase() === name.toLowerCase())) return false;

    const dbRecord = {
      action: 'inv_department',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setDepartments(prev => [...prev, { id: data[0].id, name }]);
      return true;
    }
    return false;
  };

  const addUnit = async (name) => {
    if (units.find(u => u.name.toLowerCase() === name.toLowerCase())) return false; // duplicate

    const dbRecord = {
      action: 'inv_unit',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setUnits(prev => [...prev, { id: data[0].id, name }]);
      return true;
    }
    return false;
  };

  const addItem = async (name, unit, category = 'Uncategorized', suppliers = [], minStockLevels = {}, secondaryUnit = '', conversionFactor = '') => {
    if (items.find(i => i.name.toLowerCase() === name.toLowerCase() && (i.category || 'Uncategorized').toLowerCase() === category.toLowerCase())) return false; // duplicate

    const dbRecord = {
      action: 'inv_item',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name, unit, category, suppliers, minStockLevels, secondaryUnit, conversionFactor }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setItems(prev => [...prev, { id: data[0].id, name, unit, category, suppliers, minStockLevels, secondaryUnit, conversionFactor }]);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: 'Added Inventory Item',
        user: currentUser?.name,
        changes: [{ field: 'Item Name', oldValue: '', newValue: name }, { field: 'Unit', oldValue: '', newValue: unit }]
      });
      return true;
    }
    return false;
  };

  const saveCategory = async (name, suppliers) => {
    const dbRecord = {
      action: 'inv_category',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name, suppliers }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setCategories(prev => {
        const existing = prev.find(c => c.name === name);
        if (existing) {
          return prev.map(c => c.name === name ? { ...c, suppliers } : c);
        }
        return [...prev, { id: data[0].id, name, suppliers }];
      });
      return true;
    }
    return false;
  };

  const logTransaction = async (txnData) => {
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
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setTransactions(prev => [...prev, {
        id: data[0].id,
        ...txnData,
        user: dbRecord.user_name,
        timestamp: data[0].timestamp
      }]);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: `Inventory Stock ${txnData.type}`,
        user: currentUser?.name,
        changes: [
          { field: 'Item', oldValue: '', newValue: txnData.item },
          { field: 'Location', oldValue: '', newValue: txnData.location },
          { field: 'Quantity', oldValue: '', newValue: `${txnData.type === 'IN' ? '+' : '-'}${txnData.qty}` }
        ]
      });
      return true;
    }
    return false;
  };

  const logBatchTransactions = async (txnsData) => {
    if (!txnsData || txnsData.length === 0) return true;

    const dbRecords = txnsData.map(txnData => ({
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
        companyName: txnData.companyName || '',
        billNo: txnData.billNo || '',
        receivingDate: txnData.receivingDate || '',
        billDate: txnData.billDate || '',
        unitPrice: txnData.unitPrice || '',
        usageType: txnData.usageType || '',
        department: txnData.department || ''
      }
    }));

    const { data, error } = await supabase.from('system_logs').insert(dbRecords).select();
    
    if (!error && data) {
      const newTransactions = txnsData.map((txn, index) => ({
        id: data[index].id,
        ...txn,
        user: dbRecords[index].user_name,
        timestamp: data[index].timestamp
      }));
      
      setTransactions(prev => [...prev, ...newTransactions]);
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: `Batch Inventory Stock Update`,
        user: currentUser?.name,
        changes: [
          { field: 'Batch Size', oldValue: '', newValue: `${txnsData.length} items` },
          { field: 'Location', oldValue: '', newValue: txnsData[0].location }
        ]
      });
      return true;
    }
    return false;
  };

  const deleteTransaction = async (txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return false;

    const { error } = await supabase.from('system_logs').delete().eq('id', txnId);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== txnId));
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: `Deleted Inventory Transaction`,
        user: currentUser?.name,
        changes: [
          { field: 'Item', oldValue: txn.item, newValue: 'DELETED' },
          { field: 'Location', oldValue: txn.location, newValue: 'DELETED' },
          { field: 'Quantity', oldValue: `${txn.type === 'IN' ? '+' : '-'}${txn.qty}`, newValue: 'DELETED' }
        ]
      });
      return true;
    }
    return false;
  };

  const deleteEntity = async (type, id, name) => {
    // Validation
    if (type === 'inv_loc' && transactions.some(t => t.location === name)) return { success: false, message: 'Location has active transactions.' };
    if (type === 'inv_company' && (transactions.some(t => t.companyName === name) || categories.some(c => c.suppliers.includes(name)) || items.some(i => i.suppliers.includes(name)))) return { success: false, message: 'Company is in use by transactions, categories, or items.' };
    if (type === 'inv_category' && items.some(i => i.category === name)) return { success: false, message: 'Category contains items.' };
    if (type === 'inv_item' && transactions.some(t => t.item === name)) return { success: false, message: 'Item has active transactions.' };
    
    // Delete log
    const { error } = await supabase.from('system_logs').delete().eq('id', id);
    if (!error) {
      if (type === 'inv_loc') setLocations(prev => prev.filter(l => l.id !== id));
      if (type === 'inv_unit') setUnits(prev => prev.filter(u => u.id !== id));
      if (type === 'inv_company') setCompanies(prev => prev.filter(c => c.id !== id));
      if (type === 'inv_category') setCategories(prev => prev.filter(c => c.id !== id));
      if (type === 'inv_item') setItems(prev => prev.filter(i => i.id !== id));
      if (type === 'inv_department') setDepartments(prev => prev.filter(d => d.id !== id));
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: `Deleted Master ${type}`,
        user: currentUser?.name,
        changes: [{ field: 'Deleted', oldValue: name, newValue: '' }]
      });
      return { success: true };
    }
    return { success: false, message: 'Database error' };
  };

  const editEntity = async (type, id, oldName, newName, extraData = {}) => {
    // Check if newName already exists
    if (oldName.toLowerCase() !== newName.toLowerCase()) {
      if (type === 'inv_loc' && locations.some(l => l.name.toLowerCase() === newName.toLowerCase() && l.id !== id)) return { success: false, message: 'Name already exists.' };
      if (type === 'inv_unit' && units.some(u => u.name.toLowerCase() === newName.toLowerCase() && u.id !== id)) return { success: false, message: 'Name already exists.' };
      if (type === 'inv_company' && companies.some(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== id)) return { success: false, message: 'Name already exists.' };
      if (type === 'inv_category' && categories.some(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== id)) return { success: false, message: 'Name already exists.' };
      if (type === 'inv_item' && items.some(i => i.name.toLowerCase() === newName.toLowerCase() && (i.category || 'Uncategorized').toLowerCase() === (extraData.category || 'Uncategorized').toLowerCase() && i.id !== id)) return { success: false, message: 'Item already exists in this category.' };
      if (type === 'inv_department' && departments.some(d => d.name.toLowerCase() === newName.toLowerCase() && d.id !== id)) return { success: false, message: 'Name already exists.' };
    }

    let changes = { name: newName };
    if (type === 'inv_company') changes = { name: newName, address: extraData.address, mobile: extraData.mobile, poc: extraData.poc, gst: extraData.gst };
    if (type === 'inv_item') changes = { name: newName, unit: extraData.unit, category: extraData.category, suppliers: extraData.suppliers, minStockLevels: extraData.minStockLevels, secondaryUnit: extraData.secondaryUnit, conversionFactor: extraData.conversionFactor };
    if (type === 'inv_category') changes = { name: newName, suppliers: extraData.suppliers };

    const { error } = await supabase.from('system_logs').update({ changes }).eq('id', id);
    if (error) return { success: false, message: 'Database error on update.' };

    if (type === 'inv_loc') setLocations(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
    if (type === 'inv_unit') setUnits(prev => prev.map(u => u.id === id ? { ...u, name: newName } : u));
    if (type === 'inv_company') setCompanies(prev => prev.map(c => c.id === id ? { ...c, name: newName, address: extraData.address, mobile: extraData.mobile, poc: extraData.poc, gst: extraData.gst } : c));
    if (type === 'inv_category') setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName, suppliers: extraData.suppliers } : c));
    if (type === 'inv_item') setItems(prev => prev.map(i => i.id === id ? { ...i, name: newName, unit: extraData.unit, category: extraData.category, suppliers: extraData.suppliers, minStockLevels: extraData.minStockLevels, secondaryUnit: extraData.secondaryUnit, conversionFactor: extraData.conversionFactor } : i));
    if (type === 'inv_department') setDepartments(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));

    // Cascading updates for name changes
    if (oldName !== newName) {
      if (type === 'inv_loc') {
        const affected = transactions.filter(t => t.location === oldName);
        for (const t of affected) {
          const newTxnChanges = { location: newName, item: t.item, type: t.type, qty: t.qty, date: t.date, remarks: t.remarks, companyName: t.companyName, billNo: t.billNo, receivingDate: t.receivingDate, billDate: t.billDate, unitPrice: t.unitPrice, department: t.department, usageType: t.usageType };
          await supabase.from('system_logs').update({ changes: newTxnChanges, claim_id: newName }).eq('id', t.id);
        }
        setTransactions(prev => prev.map(t => t.location === oldName ? { ...t, location: newName } : t));
      }
      if (type === 'inv_company') {
        const affected = transactions.filter(t => t.companyName === oldName);
        for (const t of affected) {
          const newTxnChanges = { location: t.location, item: t.item, type: t.type, qty: t.qty, date: t.date, remarks: t.remarks, companyName: newName, billNo: t.billNo, receivingDate: t.receivingDate, billDate: t.billDate, unitPrice: t.unitPrice, department: t.department, usageType: t.usageType };
          await supabase.from('system_logs').update({ changes: newTxnChanges }).eq('id', t.id);
        }
        setTransactions(prev => prev.map(t => t.companyName === oldName ? { ...t, companyName: newName } : t));
        
        const affectedCats = categories.filter(c => c.suppliers.includes(oldName));
        for (const c of affectedCats) {
          const newSuppliers = c.suppliers.map(s => s === oldName ? newName : s);
          await supabase.from('system_logs').update({ changes: { name: c.name, suppliers: newSuppliers } }).eq('id', c.id);
        }
        setCategories(prev => prev.map(c => c.suppliers.includes(oldName) ? { ...c, suppliers: c.suppliers.map(s => s === oldName ? newName : s) } : c));
        
        const affectedItems = items.filter(i => i.suppliers.includes(oldName));
        for (const i of affectedItems) {
          const newSuppliers = i.suppliers.map(s => s === oldName ? newName : s);
          await supabase.from('system_logs').update({ changes: { name: i.name, unit: i.unit, category: i.category, suppliers: newSuppliers, minStockLevels: i.minStockLevels } }).eq('id', i.id);
        }
        setItems(prev => prev.map(i => i.suppliers.includes(oldName) ? { ...i, suppliers: i.suppliers.map(s => s === oldName ? newName : s) } : i));
      }
      if (type === 'inv_category') {
        const affected = items.filter(i => i.category === oldName);
        for (const i of affected) {
          await supabase.from('system_logs').update({ changes: { name: i.name, unit: i.unit, category: newName, suppliers: i.suppliers, minStockLevels: i.minStockLevels } }).eq('id', i.id);
        }
        setItems(prev => prev.map(i => i.category === oldName ? { ...i, category: newName } : i));
      }
      if (type === 'inv_item') {
        const affected = transactions.filter(t => t.item === oldName);
        for (const t of affected) {
          const newTxnChanges = { location: t.location, item: newName, type: t.type, qty: t.qty, date: t.date, remarks: t.remarks, companyName: t.companyName, billNo: t.billNo, receivingDate: t.receivingDate, billDate: t.billDate, unitPrice: t.unitPrice, department: t.department, usageType: t.usageType };
          await supabase.from('system_logs').update({ changes: newTxnChanges }).eq('id', t.id);
        }
        setTransactions(prev => prev.map(t => t.item === oldName ? { ...t, item: newName } : t));
      }
      if (type === 'inv_department') {
        const affected = transactions.filter(t => t.department === oldName);
        for (const t of affected) {
          const newTxnChanges = { location: t.location, item: t.item, type: t.type, qty: t.qty, date: t.date, remarks: t.remarks, companyName: t.companyName, billNo: t.billNo, receivingDate: t.receivingDate, billDate: t.billDate, unitPrice: t.unitPrice, department: newName, usageType: t.usageType };
          await supabase.from('system_logs').update({ changes: newTxnChanges }).eq('id', t.id);
        }
        setTransactions(prev => prev.map(t => t.department === oldName ? { ...t, department: newName } : t));
      }
    }

    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: `Edited Master ${type}`,
      user: currentUser?.name,
      changes: [{ field: 'Name', oldValue: oldName, newValue: newName }]
    });

    return { success: true };
  };

  const { globalStockMap, locationStockMap } = useMemo(() => {
    const globalMap = {};
    const locMap = {};
    transactions.forEach(t => {
      if (!globalMap[t.item]) globalMap[t.item] = 0;
      globalMap[t.item] += (t.type === 'IN' ? Number(t.qty) : -Number(t.qty));

      const locKey = `${t.location}_${t.item}`;
      if (!locMap[locKey]) locMap[locKey] = 0;
      locMap[locKey] += (t.type === 'IN' ? Number(t.qty) : -Number(t.qty));
    });
    return { globalStockMap: globalMap, locationStockMap: locMap };
  }, [transactions]);

  // Helper to get total stock for an item at a specific location
  const getStockAtLocation = (itemName, locationName) => {
    return locationStockMap[`${locationName}_${itemName}`] || 0;
  };

  // Helper to get global stock for an item
  const getGlobalStock = (itemName) => {
    return globalStockMap[itemName] || 0;
  };

  return (
    <InventoryContext.Provider value={{
      locations, units, items, companies, departments, transactions, categories, loading,
      addLocation, addUnit, addItem, addCompany, addDepartment, logTransaction, logBatchTransactions, deleteTransaction,
      getStockAtLocation, getGlobalStock, saveCategory, deleteEntity, editEntity
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
