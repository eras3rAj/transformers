import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventoryData = async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .in('action', ['inv_loc', 'inv_unit', 'inv_item', 'inv_txn', 'inv_company'])
      .order('timestamp', { ascending: true });

    if (!error && data) {
      const locs = [];
      const uns = [];
      const itms = [];
      const comps = [];
      const txns = [];

      data.forEach(log => {
        const payload = log.changes || {};
        if (log.action === 'inv_loc') locs.push({ id: log.id, name: payload.name });
        else if (log.action === 'inv_unit') uns.push({ id: log.id, name: payload.name });
        else if (log.action === 'inv_item') itms.push({ id: log.id, name: payload.name, unit: payload.unit });
        else if (log.action === 'inv_company') comps.push({ id: log.id, name: payload.name });
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
            user: log.user_name,
            timestamp: log.timestamp
          });
        }
      });

      setLocations(locs);
      setUnits(uns);
      setItems(itms);
      setCompanies(comps);
      setTransactions(txns);
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

  const addCompany = async (name) => {
    if (companies.find(c => c.name.toLowerCase() === name.toLowerCase())) return false;

    const dbRecord = {
      action: 'inv_company',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setCompanies(prev => [...prev, { id: data[0].id, name }]);
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

  const addItem = async (name, unit) => {
    if (items.find(i => i.name.toLowerCase() === name.toLowerCase())) return false; // duplicate

    const dbRecord = {
      action: 'inv_item',
      user_name: currentUser?.name || 'System',
      claim_id: 'SYSTEM',
      changes: { name, unit }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setItems(prev => [...prev, { id: data[0].id, name, unit }]);
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
        unitPrice: txnData.unitPrice
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

  // Helper to get total stock for an item at a specific location
  const getStockAtLocation = (itemName, locationName) => {
    const txns = transactions.filter(t => t.item === itemName && t.location === locationName);
    return txns.reduce((sum, t) => {
      return t.type === 'IN' ? sum + t.qty : sum - t.qty;
    }, 0);
  };

  // Helper to get global stock for an item
  const getGlobalStock = (itemName) => {
    const txns = transactions.filter(t => t.item === itemName);
    return txns.reduce((sum, t) => {
      return t.type === 'IN' ? sum + t.qty : sum - t.qty;
    }, 0);
  };

  return (
    <InventoryContext.Provider value={{
      locations, units, items, companies, transactions, loading,
      addLocation, addUnit, addItem, addCompany, logTransaction, deleteTransaction,
      getStockAtLocation, getGlobalStock
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
