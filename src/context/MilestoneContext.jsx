import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MilestoneContext = createContext();

export const useMilestones = () => useContext(MilestoneContext);

export const MilestoneProvider = ({ children }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('milestones').select('*').order('target_date', { ascending: true });
    if (!error && data) {
      setMilestones(data);
    } else if (error) {
      console.error('Error fetching milestones:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const addMilestone = async (newMilestone) => {
    const { data, error } = await supabase.from('milestones').insert([newMilestone]).select();
    if (!error && data) {
      setMilestones(prev => [...prev, data[0]]);
      return true;
    }
    console.error('Error adding milestone:', error);
    return false;
  };

  const updateMilestoneStatus = async (id, status) => {
    const { data, error } = await supabase.from('milestones').update({ status }).eq('id', id).select();
    if (!error && data) {
      setMilestones(prev => prev.map(m => m.id === id ? data[0] : m));
      return true;
    }
    console.error('Error updating milestone:', error);
    return false;
  };

  const deleteMilestone = async (id) => {
    const { error } = await supabase.from('milestones').delete().eq('id', id);
    if (!error) {
      setMilestones(prev => prev.filter(m => m.id !== id));
      return true;
    }
    console.error('Error deleting milestone:', error);
    return false;
  };

  return (
    <MilestoneContext.Provider value={{ milestones, addMilestone, updateMilestoneStatus, deleteMilestone, loading }}>
      {children}
    </MilestoneContext.Provider>
  );
};
