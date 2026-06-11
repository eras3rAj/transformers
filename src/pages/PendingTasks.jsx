import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import '../components/layout/Layout.css';

const PendingTasks = () => {
  const { tasks, addTask, updateTaskStatus, addLatestUpdate, loading } = useTasks();
  const { currentUser } = useAuth();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); // Pending, In Progress, Completed
  
  const [taskData, setTaskData] = useState({
    title: '', description: '', assigned_to: '', priority: 'Medium', due_date: ''
  });

  const [updateModal, setUpdateModal] = useState({ isOpen: false, task: null, updateText: '' });

  const filteredTasks = tasks.filter(t => t.status === activeTab);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    await addTask(taskData);
    setTaskData({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' });
    setShowTaskForm(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (updateModal.task) {
      await addLatestUpdate(updateModal.task.id, updateModal.updateText);
    }
    setUpdateModal({ isOpen: false, task: null, updateText: '' });
  };

  if (loading) return <div style={{ padding: '2rem' }}><SkeletonLoader type="title" /><SkeletonLoader type="table" count={5} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListTodo size={28} color="var(--accent-primary)" />
            Task Management
          </h1>
          <p>Assign tasks, track progress, and post latest updates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem', overflowX: 'auto', minHeight: '60vh' }}>
        {['Pending', 'In Progress', 'Completed'].map(columnStatus => (
          <div 
            key={columnStatus}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              const taskId = e.dataTransfer.getData('taskId');
              if (taskId) {
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status !== columnStatus) {
                  await updateTaskStatus(taskId, columnStatus);
                }
              }
            }}
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              padding: '1rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              border: '1px solid var(--border-color)',
              minWidth: '300px'
            }}
          >
            <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--accent-primary)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              {columnStatus}
              <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                {tasks.filter(t => t.status === columnStatus).length}
              </span>
            </h3>

            {tasks.filter(t => t.status === columnStatus).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No tasks here.
              </div>
            ) : (
              tasks.filter(t => t.status === columnStatus).map(task => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                  className="card" 
                  style={{ 
                    padding: '1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderLeft: `4px solid ${task.priority === 'High' ? 'var(--danger)' : task.priority === 'Low' ? 'var(--success)' : 'var(--warning)'}`,
                    cursor: 'grab'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{task.title}</h4>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>{task.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span><strong>To:</strong> {task.assigned_to}</span>
                    <span><strong>From:</strong> {task.raised_by}</span>
                  </div>

                  {task.latest_update && (
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.8rem', fontSize: '0.75rem', borderLeft: '2px solid var(--accent-primary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Update:</strong> {task.latest_update}
                    </div>
                  )}

                  {task.status !== 'Completed' && (
                    <button className="btn btn-secondary" style={{ padding: '0.3rem', fontSize: '0.8rem', width: '100%', marginTop: 'auto' }} onClick={() => setUpdateModal({ isOpen: true, task, updateText: task.latest_update || '' })}>
                      Post Update
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* Task Form */}
      {showTaskForm && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h3>Assign New Task</h3>
            <form onSubmit={handleTaskSubmit}>
              <label className="input-label">Task Title *</label>
              <input type="text" className="input-field" required value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
              
              <label className="input-label">Description</label>
              <textarea className="input-field" rows="3" value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Assign To *</label>
                  <input type="text" className="input-field" required placeholder="User Name" value={taskData.assigned_to} onChange={e => setTaskData({...taskData, assigned_to: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Priority</label>
                  <select className="input-field" value={taskData.priority} onChange={e => setTaskData({...taskData, priority: e.target.value})}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              
              <label className="input-label">Due Date</label>
              <input type="date" className="input-field" value={taskData.due_date} onChange={e => setTaskData({...taskData, due_date: e.target.value})} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModal.isOpen && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h3>Post Latest Update</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Updating task: {updateModal.task?.title}</p>
            <form onSubmit={handleUpdateSubmit}>
              <textarea 
                className="input-field" 
                rows="4" 
                placeholder="What is the current status of this task?"
                required 
                value={updateModal.updateText} 
                onChange={e => setUpdateModal({...updateModal, updateText: e.target.value})} 
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setUpdateModal({ isOpen: false, task: null, updateText: '' })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingTasks;
