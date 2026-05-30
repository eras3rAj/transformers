import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Zap, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useLogs } from '../context/LogContext';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { checkCredentials } = useUsers();
  const { addLog } = useLogs();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const user = checkCredentials(username, password);
    
    if (user) {
      if (user.status === 'inactive') {
        setError('Your account has been suspended. Please contact an administrator.');
        return;
      }
      
      login(user);
      
      // Log the login event
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: 'System Login',
        user: user.name,
        changes: [{ field: 'Role', oldValue: '', newValue: user.role }]
      });

      navigate('/');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
            <Zap size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>VoltForge Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your credentials to access the system</p>
        </div>

        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <ShieldAlert size={20} className="text-danger" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>This is a restricted area. Only authorized personnel are permitted.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. superadmin" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              autoFocus
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} /> Secure Login
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="#" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Forgot your password?</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
