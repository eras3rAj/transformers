import { createContext, useContext, useEffect } from 'react';
import { useSupabaseCrud } from '../hooks/useSupabaseCrud';
import { useAuth } from './AuthContext';
import { useUsers } from './UserContext';
import { useNotifications } from './NotificationContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { users } = useUsers();
  const { createNotification } = useNotifications();
  const { data: tasks, loading, fetchAll, insert, update, remove } = useSupabaseCrud('pending_tasks');

  useEffect(() => {
    fetchAll('created_at', false);
  }, [fetchAll]);

  const addTask = async (taskData) => {
    const res = await insert({
      ...taskData,
      raised_by: currentUser?.name || 'Unknown User'
    });
    
    if (res.success && res.data) {
      const assignedUser = users.find(u => u.name === taskData.assigned_to);
      if (assignedUser) {
        await createNotification({
          userId: assignedUser.id,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${taskData.task_title}" by ${currentUser?.name || 'Admin'}`,
          linkUrl: '/pending-tasks'
        });
      }
    }
    return res;
  };

  const updateTaskStatus = async (id, newStatus, latestUpdate) => {
    const updates = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (latestUpdate !== undefined) {
      updates.latest_update = latestUpdate;
    }
    const res = await update(id, updates);
    if (res.success) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        // notify the person who raised it (if possible, but we don't store raised_by_id, only string name)
        const raiser = users.find(u => u.name === task.raised_by);
        if (raiser && raiser.id !== currentUser?.id) {
          await createNotification({
            userId: raiser.id,
            title: 'Task Status Updated',
            message: `Task "${task.task_title}" status was changed to ${newStatus}.`,
            linkUrl: '/pending-tasks'
          });
        }
      }
    }
    return res;
  };

  const addLatestUpdate = async (id, latestUpdate) => {
    return await update(id, {
      latest_update: latestUpdate,
      updated_at: new Date().toISOString()
    });
  };

  const deleteTask = async (id) => {
    return await remove(id);
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      loading,
      addTask, 
      updateTaskStatus,
      addLatestUpdate,
      deleteTask,
      refreshTasks: () => fetchAll('created_at', false)
    }}>
      {children}
    </TaskContext.Provider>
  );
};

