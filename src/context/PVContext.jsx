import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PVContext = createContext();

export const usePV = () => useContext(PVContext);

export const PVProvider = ({ children }) => {
  const [indices, setIndices] = useState([]);

  const fetchIndices = async () => {
    const { data, error } = await supabase.from('pv_indices').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const mappedIndices = data.map(idx => ({
        id: idx.id,
        month: idx.month,
        al: Number(idx.al),
        cu: Number(idx.cu),
        crgo: Number(idx.crgo),
        steel315: Number(idx.steel315),
        insulating3: Number(idx.insulating3),
        oil: Number(idx.oil),
        cpi: Number(idx.cpi),
        fixed: Number(idx.fixed)
      }));
      setIndices(mappedIndices);
    }
  };

  useEffect(() => {
    fetchIndices();
  }, []);



  const addIndex = async (newIndex) => {
    const dbRecord = {
      month: newIndex.month,
      al: newIndex.al,
      cu: newIndex.cu,
      crgo: newIndex.crgo,
      steel315: newIndex.steel315,
      insulating3: newIndex.insulating3,
      oil: newIndex.oil,
      cpi: newIndex.cpi,
      fixed: newIndex.fixed || 100
    };

    const { data, error } = await supabase.from('pv_indices').insert([dbRecord]).select();
    if (!error && data) {
      const createdIndex = { ...newIndex, id: data[0].id };
      setIndices(prev => [createdIndex, ...prev]);
      return createdIndex;
    }
    return null;
  };

  const updateIndex = async (id, updatedValues) => {
    const dbRecord = {
      al: updatedValues.al,
      cu: updatedValues.cu,
      crgo: updatedValues.crgo,
      steel315: updatedValues.steel315,
      insulating3: updatedValues.insulating3,
      oil: updatedValues.oil,
      cpi: updatedValues.cpi
    };

    const { data, error } = await supabase.from('pv_indices').update(dbRecord).eq('id', id).select();
    if (!error && data) {
      setIndices(prev => prev.map(idx => idx.id === id ? { ...idx, ...updatedValues } : idx));
      return true;
    }
    return false;
  };

  const getIndexByMonth = (monthString) => {
    return indices.find(i => i.month.toLowerCase() === monthString.toLowerCase());
  };

  return (
    <PVContext.Provider value={{ indices, addIndex, updateIndex, getIndexByMonth }}>
      {children}
    </PVContext.Provider>
  );
};
