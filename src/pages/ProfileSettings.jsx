import React, { useState } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useLogs } from '../context/LogContext';

const ProfileSettings = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { users, updateUser } = useUsers();
  const { addLog } = useLogs();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    username: currentUser?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' }); // Clear message on typing
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Grab the actual user record from the database to check the current password
    const dbUser = users.find(u => u.id === currentUser.id);
    
    if (!dbUser) {
      setMessage({ type: 'error', text: 'Error finding user record.' });
      return;
    }

    // If they are trying to change their password, they MUST provide the correct current password
    if (formData.newPassword || formData.currentPassword) {
      if (dbUser.password !== formData.currentPassword) {
        setMessage({ type: 'error', text: 'Incorrect current password.' });
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }
    
    // Check if new username is taken by someone else
    if (formData.username !== currentUser.username) {
      if (users.some(u => u.username === formData.username && u.id !== currentUser.id)) {
        setMessage({ type: 'error', text: 'Username is already taken by another user.' });
        return;
      }
    }

    const updatedFields = {
      name: formData.name,
      username: formData.username,
    };
    
    if (formData.newPassword) {
      updatedFields.password = formData.newPassword;
    }

    // Update global database
    updateUser(currentUser.id, updatedFields);
    
    // Update local session
    const newSessionUser = { ...currentUser, name: formData.name, username: formData.username };
    updateCurrentUser(newSessionUser);
    
    // Audit Log
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: 'Updated Profile Settings',
      user: newSessionUser.name,
      changes: [
        { field: 'Name', oldValue: currentUser.name, newValue: formData.name },
        { field: 'Username', oldValue: currentUser.username, newValue: formData.username },
        { field: 'Password', oldValue: '***', newValue: formData.newPassword ? '(Changed)' : '***' }
      ]
    });

    setMessage({ type: 'success', text: 'Profile updated successfully!' });
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={28} color="var(--accent-primary)" />
          My Profile
        </h1>
        <p>Update your personal account details and password.</p>
      </div>

      <div className="card">
        {message.text && (
          <div style={{ 
            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', 
            padding: '1rem', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}>
            {message.type === 'success' && <CheckCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Personal Information</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required />
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label className="input-label">Username (Used for login)</label>
            <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="input-field" required />
          </div>

          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} /> Change Password
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Leave these fields blank if you do not want to change your password.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Current Password</label>
            <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} className="input-field" placeholder="Enter current password to authorize changes" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label className="input-label">New Password</label>
              <input type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} className="input-field" disabled={!formData.currentPassword} />
            </div>
            <div>
              <label className="input-label">Confirm New Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="input-field" disabled={!formData.currentPassword} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
