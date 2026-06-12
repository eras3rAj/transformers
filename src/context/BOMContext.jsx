import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLogs } from './LogContext';

const BOMContext = createContext();

export const useBOM = () => useContext(BOMContext);

export const BOMProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { addLog } = useLogs();
  
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBOMs = async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('action', 'bom_record')
      .order('timestamp', { ascending: true });

    if (!error && data) {
      const bomMap = new Map();
      data.forEach(log => {
        if (!log.changes.deleted) {
          bomMap.set(log.changes.rating, { id: log.id, ...log.changes });
        } else {
          bomMap.delete(log.changes.rating);
        }
      });
      setBoms(Array.from(bomMap.values()));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBOMs();

    const subscription = supabase
      .channel('bom_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs', filter: 'action=eq.bom_record' }, payload => {
        const log = payload.new;
        if (log.changes.deleted) {
          setBoms(prev => prev.filter(b => b.rating !== log.changes.rating));
        } else {
          setBoms(prev => {
            const existing = prev.find(b => b.rating === log.changes.rating);
            if (existing) {
              return prev.map(b => b.rating === log.changes.rating ? { id: log.id, ...log.changes } : b);
            }
            return [...prev, { id: log.id, ...log.changes }];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const saveBOM = async (rating, phase, materials, linkedPOs = []) => {
    const payload = {
      action: 'bom_record',
      user_name: currentUser?.name || 'System',
      changes: {
        rating,
        phase,
        materials, // Array of { itemId, quantity, unit }
        linkedPOs
      }
    };
    await addLog(payload.action, payload.changes, payload.user_name);
  };

  const deleteBOM = async (rating) => {
    const payload = {
      action: 'bom_record',
      user_name: currentUser?.name || 'System',
      changes: {
        rating,
        deleted: true
      }
    };
    await addLog(payload.action, payload.changes, payload.user_name);
  };

  return (
    <BOMContext.Provider value={{
      boms, loading, saveBOM, deleteBOM
    }}>
      {children}
    </BOMContext.Provider>
  );
};
