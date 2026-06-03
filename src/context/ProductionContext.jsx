import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProductionContext = createContext();

export const useProduction = () => useContext(ProductionContext);

export const ProductionProvider = ({ children }) => {
  const [productionLogs, setProductionLogs] = useState([]);
  const [productionLines, setProductionLines] = useState(['Line 1', 'Line 2', 'Line 3']); // Defaults

  const fetchLogs = async () => {
    const { data, error } = await supabase.from('system_logs').select('*').in('action', ['daily_production', 'production_settings']).order('timestamp', { ascending: false });
    if (!error && data) {
      const mappedLogs = [];
      let loadedLines = null;

      data.forEach(log => {
        if (log.action === 'daily_production') {
          const pData = log.changes || {};
          mappedLogs.push({
            id: log.id,
            date: log.claim_id,
            batches: Array.isArray(pData.batches) ? pData.batches : []
          });
        } else if (log.action === 'production_settings' && !loadedLines) {
          // Take the most recent settings
          if (log.changes && Array.isArray(log.changes.lines)) {
            loadedLines = log.changes.lines;
          }
        }
      });
      
      setProductionLogs(mappedLogs);
      if (loadedLines && loadedLines.length > 0) {
        setProductionLines(loadedLines);
      }
    }
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('custom-all-channel-${Date.now()}-system_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs' }, (payload) => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveBatchesForDate = async (date, batchesArray) => {
    const existingIdx = productionLogs.findIndex(l => l.date === date);
    
    const dbRecord = {
      action: 'daily_production',
      user_name: 'system', 
      claim_id: date,
      timestamp: new Date(date).toISOString(),
      changes: {
        batches: batchesArray
      }
    };

    if (existingIdx >= 0) {
      const existingId = productionLogs[existingIdx].id;
      const { data, error } = await supabase.from('system_logs').update(dbRecord).eq('id', existingId).select();
      if (!error && data) {
        setProductionLogs(prev => prev.map(l => l.date === date ? { date, batches: batchesArray, id: data[0].id } : l));
        return true;
      }
    } else {
      const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
      if (!error && data) {
        setProductionLogs(prev => [{ date, batches: batchesArray, id: data[0].id }, ...prev]);
        return true;
      }
    }
    return false;
  };

  const saveLines = async (newLinesArray) => {
    const dbRecord = {
      action: 'production_settings',
      user_name: 'system',
      claim_id: 'settings',
      changes: { lines: newLinesArray }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]);
    if (!error) {
      setProductionLines(newLinesArray);
      return true;
    }
    return false;
  };

  return (
    <ProductionContext.Provider value={{ productionLogs, productionLines, saveBatchesForDate, saveLines }}>
      {children}
    </ProductionContext.Provider>
  );
};
