import { createContext, useContext, useEffect } from 'react';
import { useSupabaseCrud } from '../hooks/useSupabaseCrud';

const MilestoneContext = createContext();

export const useMilestones = () => useContext(MilestoneContext);

export const MilestoneProvider = ({ children }) => {
  const { data: milestones, loading, fetchAll, insert, update, remove } = useSupabaseCrud('milestones');

  useEffect(() => {
    fetchAll('target_date', true);
  }, [fetchAll]);

  const addMilestone = async (newMilestone) => {
    const { success } = await insert(newMilestone);
    return success;
  };

  const updateMilestoneStatus = async (id, status) => {
    const { success } = await update(id, { status });
    return success;
  };

  const deleteMilestone = async (id) => {
    const { success } = await remove(id);
    return success;
  };

  return (
    <MilestoneContext.Provider value={{ milestones, addMilestone, updateMilestoneStatus, deleteMilestone, loading }}>
      {children}
    </MilestoneContext.Provider>
  );
};

