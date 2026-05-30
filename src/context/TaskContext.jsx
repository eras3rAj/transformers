import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pending_tasks')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (taskData) => {
    const { data, error } = await supabase
      .from('pending_tasks')
      .insert([{
        ...taskData,
        raised_by: currentUser?.name || 'Unknown User'
      }])
      .select();
      
    if (!error && data) {
      setTasks(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const updateTaskStatus = async (id, newStatus, latestUpdate) => {
    const updates = { status: newStatus };
    if (latestUpdate !== undefined) {
      updates.latest_update = latestUpdate;
    }
    
    // Automatically set updated_at
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('pending_tasks')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? data[0] : t));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const addLatestUpdate = async (id, latestUpdate) => {
    const { data, error } = await supabase
      .from('pending_tasks')
      .update({ 
        latest_update: latestUpdate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? data[0] : t));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('pending_tasks')
      .delete()
      .eq('id', id);
      
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id));
      return { success: true };
    }
    return { success: false, error };
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      loading,
      addTask, 
      updateTaskStatus,
      addLatestUpdate,
      deleteTask,
      refreshTasks: fetchTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
};
