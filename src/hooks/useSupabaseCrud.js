import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabaseCrud = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (orderColumn = 'id', ascending = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .order(orderColumn, { ascending });
      
      if (error) throw error;
      setData(result || []);
      return result;
    } catch (err) {
      console.error(`Error fetching from ${tableName}:`, err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const insert = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      if (result) setData(prev => [result, ...prev]);
      return { success: true, data: result };
    } catch (err) {
      console.error(`Error inserting into ${tableName}:`, err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const update = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      if (result) {
        setData(prev => prev.map(item => item.id === id ? result : item));
      }
      return { success: true, data: result };
    } catch (err) {
      console.error(`Error updating ${tableName}:`, err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const remove = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (err) {
      console.error(`Error deleting from ${tableName}:`, err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  return { data, loading, error, fetchAll, insert, update, remove, setData };
};
