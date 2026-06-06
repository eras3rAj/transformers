import { useState } from 'react';
import { Users, Shield, UserPlus, Settings, Check, PauseCircle, PlayCircle } from 'lucide-react';
import { useUsers } from '../context/UserContext';
import { useLogs } from '../context/LogContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

export const AVAILABLE_MODULES = [
  { id: 'purchase-orders', name: 'Purchase Orders' },
  { id: 'production', name: 'Production' },
  { id: 'inspections', name: 'Inspections' },
  { id: 'inventory', name: 'Inventory Stores' },
  { id: 'price-variation', name: 'Price Variation' },
  { id: 'warranty', name: 'Warranty claims' },
  { id: 'employees', name: 'Employees' },
  { id: 'vendor-purchasing', name: 'Vendor Purchasing' },
  { id: 'pending-tasks', name: 'Pending Tasks' },
  { id: 'milestones', name: 'Milestones' },
  { id: 'expenses', name: 'Daily Expenses' },
  { id: 'eod-summary', name: 'Daily Summary' },
  { id: 'bg-lc', name: 'Bank Guarantee & LC' },
  { id: 'custom-duty', name: 'Custom Duty' }
];

const UserManagement = () => {
  const { users, addUser, toggleUserStatus, updateUser } = useUsers();
  const { currentUser } = useAuth();
  const { addLog } = useLogs();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusPrompt, setStatusPrompt] = useState({ isOpen: false, user: null, action: '' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [editModulesModal, setEditModulesModal] = useState({ isOpen: false, user: null, modules: [] });
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'admin',
    modules: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleToggle = (moduleId, isEdit = false) => {
    if (isEdit) {
      setEditModulesModal(prev => {
        const hasModule = prev.modules.includes(moduleId);
        return {
          ...prev,
          modules: hasModule ? prev.modules.filter(m => m !== moduleId) : [...prev.modules, moduleId]
        };
      });
    } else {
      setFormData(prev => {
        const hasModule = prev.modules.includes(moduleId);
        return {
          ...prev,
          modules: hasModule ? prev.modules.filter(m => m !== moduleId) : [...prev.modules, moduleId]
        };
      });
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (users.some(u => u.username === formData.username)) {
      setAlertModal({ isOpen: true, message: "Username already exists! Please choose another one." });
      return;
    }
    const newUser = {
      username: formData.username,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      modules: formData.modules
    };
    addUser(newUser);
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: 'Created User Account',
      user: currentUser.name,
      changes: [
        { field: 'Name', oldValue: '', newValue: formData.name },
        { field: 'Username', oldValue: '', newValue: formData.username },
        { field: 'Role', oldValue: '', newValue: formData.role }
      ]
    });
    setFormData({ username: '', password: '', name: '', role: 'admin', modules: [] });
    setShowAddForm(false);
  };

  const confirmToggleStatus = async (user, action) => {
    const newStatus = action === 'suspend' ? 'inactive' : 'active';
    await toggleUserStatus(user.id, newStatus);
    
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: action === 'suspend' ? 'Suspended User' : 'Reactivated User',
      user: currentUser.name,
      changes: [
        { field: 'User', oldValue: '', newValue: user.name },
        { field: 'Status', oldValue: user.status || 'active', newValue: newStatus }
      ]
    });
    setStatusPrompt({ isOpen: false, user: null, action: '' });
  };

  const handleRoleChange = (userId, newRole, userName, oldRole) => {
    updateUser(userId, { role: newRole });
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: 'Updated User Role',
      user: currentUser.name,
      changes: [
        { field: 'User', oldValue: '', newValue: userName },
        { field: 'Role', oldValue: oldRole, newValue: newRole }
      ]
    });
  };

  const handleSaveModules = () => {
    updateUser(editModulesModal.user.id, { modules: editModulesModal.modules });
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: 'Updated User Modules',
      user: currentUser.name,
      changes: [
        { field: 'User', oldValue: '', newValue: editModulesModal.user.name },
        { field: 'Modules', oldValue: JSON.stringify(editModulesModal.user.modules || []), newValue: JSON.stringify(editModulesModal.modules) }
      ]
    });
    setEditModulesModal({ isOpen: false, user: null, modules: [] });
  };

  const canManageUser = (targetRole) => {
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'admin' && targetRole === 'normal') return true;
    return false;
  };

  const getVisibleUsername = (u) => {
    if (currentUser.role === 'superadmin') return u.username;
    if (currentUser.role === 'admin' && u.role === 'normal') return u.username;
    if (currentUser.id === u.id) return u.username; // Can always see own username
    return '********';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={28} color="var(--accent-primary)" />
            User Management
          </h1>
          <p>Create and manage employee accounts and their access roles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>NAME</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>USERNAME</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ROLE</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MODULES</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: u.status === 'inactive' ? 0.6 : 1 }} className="table-row">
                  <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</td>
                  <td style={{ padding: '1rem', fontWeight: '500', fontFamily: 'monospace' }}>{getVisibleUsername(u)}</td>
                  <td style={{ padding: '1rem' }}>
                    {u.role === 'superadmin' ? (
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', 
                        borderRadius: '50px', fontSize: '0.8rem', fontWeight: '600',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)'
                      }}>
                        <Shield size={12} />
                        Super Admin
                      </span>
                    ) : canManageUser(u.role) ? (
                      <select 
                        className="input-field" 
                        style={{ 
                          margin: 0, 
                          padding: '0.3rem 0.8rem', 
                          width: 'auto', 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          backgroundColor: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: u.role === 'admin' ? 'var(--accent-primary)' : 'var(--success)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.name, u.role)}
                      >
                        <option value="admin">Admin</option>
                        <option value="normal">Normal User</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: u.role === 'admin' ? 'var(--accent-primary)' : 'var(--success)' }}>
                        {u.role === 'admin' ? 'Admin' : 'Normal User'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    {u.role === 'superadmin' ? (
                      <span style={{ color: 'var(--text-muted)' }}>All Modules</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(u.modules || []).length > 0 ? (u.modules || []).slice(0,2).map(m => {
                          const modName = AVAILABLE_MODULES.find(mod => mod.id === m)?.name || m;
                          return <span key={m} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{modName}</span>
                        }) : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                        {(u.modules || []).length > 2 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>+{u.modules.length - 2} more</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {u.status === 'inactive' ? (
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Suspended</span>
                    ) : (
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {canManageUser(u.role) && u.id !== currentUser.id && u.id !== 'usr-1' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {u.role !== 'superadmin' && (
                          <button className="icon-btn" style={{ color: 'var(--accent-primary)' }} title="Edit Access Modules" onClick={() => setEditModulesModal({ isOpen: true, user: u, modules: u.modules || [] })}>
                            <Settings size={18} />
                          </button>
                        )}
                        
                        {u.status === 'inactive' ? (
                          <button className="icon-btn" style={{ color: 'var(--success)' }} title="Reactivate User" onClick={() => setStatusPrompt({ isOpen: true, user: u, action: 'reactivate' })}>
                            <PlayCircle size={18} />
                          </button>
                        ) : (
                          <button className="icon-btn" style={{ color: 'var(--warning)' }} title="Suspend User" onClick={() => setStatusPrompt({ isOpen: true, user: u, action: 'suspend' })}>
                            <PauseCircle size={18} />
                          </button>
                        )}
                      </div>
                    )}
                    {u.id === 'usr-1' && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System Default</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={24} color="var(--accent-primary)" /> Create New Account
            </h3>
            
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="e.g. John Doe" required autoFocus />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Username</label>
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="input-field" placeholder="e.g. jdoe123" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Password</label>
                  <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="input-field" placeholder="Must be provided to employee" required />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Access Role</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.8rem', border: `2px solid ${formData.role === 'normal' ? 'var(--success)' : 'var(--border-color)'}`, borderRadius: '8px', flex: 1 }}>
                    <input type="radio" name="role" value="normal" checked={formData.role === 'normal'} onChange={handleInputChange} />
                    <div><div style={{ fontWeight: '600', color: 'var(--success)' }}>Normal</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Financials</div></div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.8rem', border: `2px solid ${formData.role === 'admin' ? 'var(--accent-primary)' : 'var(--border-color)'}`, borderRadius: '8px', flex: 1 }}>
                    <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={handleInputChange} />
                    <div><div style={{ fontWeight: '600' }}>Admin</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Standard Access</div></div>
                  </label>
                  {currentUser.role === 'superadmin' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.8rem', border: `2px solid ${formData.role === 'superadmin' ? 'var(--danger)' : 'var(--border-color)'}`, borderRadius: '8px', flex: 1 }}>
                      <input type="radio" name="role" value="superadmin" checked={formData.role === 'superadmin'} onChange={handleInputChange} />
                      <div><div style={{ fontWeight: '600', color: 'var(--danger)' }}>Super Admin</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Full Control</div></div>
                    </label>
                  )}
                </div>
              </div>

              {formData.role !== 'superadmin' && (
                <div style={{ marginBottom: '2rem' }}>
                  <label className="input-label">Accessible Modules</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    {AVAILABLE_MODULES.map(module => (
                      <div key={module.id} onClick={() => handleModuleToggle(module.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '6px', border: `1px solid ${formData.modules.includes(module.id) ? 'var(--accent-primary)' : 'var(--border-color)'}`, backgroundColor: formData.modules.includes(module.id) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)', cursor: 'pointer', transition: 'var(--transition)' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${formData.modules.includes(module.id) ? 'var(--accent-primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: formData.modules.includes(module.id) ? 'var(--accent-primary)' : 'transparent' }}>
                          {formData.modules.includes(module.id) && <Check size={12} color="white" />}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: formData.modules.includes(module.id) ? '600' : '400', color: formData.modules.includes(module.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{module.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModulesModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={24} color="var(--accent-primary)" /> Edit Modules for {editModulesModal.user?.name}
            </h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <label className="input-label">Accessible Modules</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {AVAILABLE_MODULES.map(module => (
                  <div key={module.id} onClick={() => handleModuleToggle(module.id, true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '6px', border: `1px solid ${editModulesModal.modules.includes(module.id) ? 'var(--accent-primary)' : 'var(--border-color)'}`, backgroundColor: editModulesModal.modules.includes(module.id) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)', cursor: 'pointer', transition: 'var(--transition)' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${editModulesModal.modules.includes(module.id) ? 'var(--accent-primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: editModulesModal.modules.includes(module.id) ? 'var(--accent-primary)' : 'transparent' }}>
                      {editModulesModal.modules.includes(module.id) && <Check size={12} color="white" />}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: editModulesModal.modules.includes(module.id) ? '600' : '400', color: editModulesModal.modules.includes(module.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{module.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditModulesModal({ isOpen: false, user: null, modules: [] })}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveModules}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={statusPrompt.isOpen}
        title={statusPrompt.action === 'suspend' ? 'Suspend User Account' : 'Reactivate User Account'}
        message={statusPrompt.action === 'suspend' 
          ? "Are you sure you want to suspend this user? They will be immediately blocked from logging in." 
          : "Are you sure you want to reactivate this user? They will regain access to their assigned modules."}
        confirmText={statusPrompt.action === 'suspend' ? 'Suspend Account' : 'Reactivate Account'}
        confirmType={statusPrompt.action === 'suspend' ? 'warning' : 'primary'}
        onConfirm={() => confirmToggleStatus(statusPrompt.user, statusPrompt.action)}
        onCancel={() => setStatusPrompt({ isOpen: false, user: null, action: '' })}
      />

      <ConfirmModal 
        isOpen={alertModal.isOpen}
        title="Error"
        message={alertModal.message}
        confirmText="Okay"
        confirmType="danger"
        onConfirm={() => setAlertModal({ isOpen: false, message: '' })}
      />
    </div>
  );
};

export default UserManagement;
