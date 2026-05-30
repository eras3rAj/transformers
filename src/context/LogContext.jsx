import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LogContext = createContext();

export const useLogs = () => useContext(LogContext);

export const LogProvider = ({ children }) => {
  const [globalLogs, setGlobalLogs] = useState([]);

  const fetchLogs = async () => {
    const { data, error } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false });
    if (!error && data) {
      const mappedLogs = data.map(log => ({
        id: log.id,
        claimId: log.claim_id,
        timestamp: log.timestamp,
        action: log.action,
        user: log.user_name,
        changes: log.changes
      }));
      setGlobalLogs(mappedLogs);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);



  const addLog = async (logEntry) => {
    const dbRecord = {
      claim_id: logEntry.claimId || null,
      action: logEntry.action,
      user_name: logEntry.user,
      changes: logEntry.changes || []
    };
    // Let database set timestamp
    if (logEntry.timestamp) {
      dbRecord.timestamp = logEntry.timestamp;
    }

    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      const createdLog = {
        id: data[0].id,
        claimId: data[0].claim_id,
        timestamp: data[0].timestamp,
        action: data[0].action,
        user: data[0].user_name,
        changes: data[0].changes
      };
      setGlobalLogs(prev => [createdLog, ...prev]);
    } else {
      // Fallback local insert if offline
      setGlobalLogs(prev => [logEntry, ...prev]);
    }
  };

  return (
    <LogContext.Provider value={{ globalLogs, addLog }}>
      {children}
    </LogContext.Provider>
  );
};
