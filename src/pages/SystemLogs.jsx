import { useState } from 'react';
import { Shield, Search, Filter, AlertTriangle } from 'lucide-react';
import { useLogs } from '../context/LogContext';
import '../components/layout/Layout.css';

const SystemLogs = () => {
  const { globalLogs, hasMoreLogs, loadingLogs, loadMoreLogs } = useLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [showEmptyLogs, setShowEmptyLogs] = useState(false);

  const filteredLogs = globalLogs.filter(log => {
    const matchesSearch = log.claimId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = userFilter === 'All' || log.user === userFilter;
    
    let hasChanges = false;
    if (log.changes) {
      if (Array.isArray(log.changes)) {
        hasChanges = log.changes.length > 0;
      } else if (typeof log.changes === 'object') {
        hasChanges = Object.keys(log.changes).length > 0;
      }
    }
    
    if (!showEmptyLogs && !hasChanges) return false;

    return matchesSearch && matchesUser;
  });

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="system-logs animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={28} color="var(--danger)" />
            Global System Audit Logs
          </h1>
          <p>Master chronological feed of all administrative and super administrative actions.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem', flexWrap: 'wrap' }}>
        <Filter size={20} color="var(--text-muted)" />
        <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>Filters:</span>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="Search by Action or Record ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="input-field" 
            style={{ paddingLeft: '2rem', marginBottom: 0, width: '100%' }} 
          />
        </div>

        <select 
          value={userFilter} 
          onChange={(e) => setUserFilter(e.target.value)} 
          className="input-field" 
          style={{ width: '200px', marginBottom: 0 }}
        >
          <option value="All">All Users</option>
          <option value="Admin User">Admin User</option>
          <option value="Super Admin">Super Admin</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          <input type="checkbox" checked={showEmptyLogs} onChange={(e) => setShowEmptyLogs(e.target.checked)} />
          Show Routine System Logs
        </label>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', width: '180px' }}>TIMESTAMP</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', width: '150px' }}>USER</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTION</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>TARGET RECORD</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CHANGES MADE</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {formatTime(log.timestamp)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: log.user === 'Super Admin' ? 'var(--danger)' : 'var(--text-primary)',
                    backgroundColor: log.user === 'Super Admin' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    padding: log.user === 'Super Admin' ? '4px 8px' : '0',
                    borderRadius: '4px'
                  }}>
                    {log.user === 'Super Admin' && <Shield size={12} style={{ marginRight: '4px', display: 'inline' }} />}
                    {log.user}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>
                  <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    backgroundColor: log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove') ? 'rgba(239, 68, 68, 0.15)' : 
                                     log.action.toLowerCase().includes('add') || log.action.toLowerCase().includes('create') ? 'rgba(34, 197, 94, 0.15)' : 
                                     log.action.toLowerCase().includes('edit') || log.action.toLowerCase().includes('update') ? 'rgba(59, 130, 246, 0.15)' : 
                                     'rgba(107, 114, 128, 0.15)',
                    color: log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove') ? 'var(--danger)' : 
                           log.action.toLowerCase().includes('add') || log.action.toLowerCase().includes('create') ? 'var(--success)' : 
                           log.action.toLowerCase().includes('edit') || log.action.toLowerCase().includes('update') ? 'var(--accent-primary)' : 
                           'var(--text-muted)'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                  {log.claimId || 'System'}
                </td>
                <td style={{ padding: '1rem' }}>
                  {log.changes && Array.isArray(log.changes) && log.changes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                      {log.changes.map((change, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{change.field}:</span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--danger)' }}>{change.oldValue || '—'}</span>
                          <span>→</span>
                          <span style={{ color: 'var(--success)', fontWeight: '500' }}>{change.newValue || '—'}</span>
                        </div>
                      ))}
                    </div>
                  ) : log.changes && typeof log.changes === 'object' && !Array.isArray(log.changes) && Object.keys(log.changes).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                      {Object.entries(log.changes).map(([key, val], idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}:</span>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: '500', wordBreak: 'break-all' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No data fields changed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && !loadingLogs && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertTriangle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <h3>No Audit Logs Found</h3>
            <p>System activity will appear here across all modules.</p>
          </div>
        )}

        {hasMoreLogs && (
          <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className="btn btn-secondary" 
              onClick={loadMoreLogs}
              disabled={loadingLogs}
              style={{ minWidth: '150px' }}
            >
              {loadingLogs ? 'Loading...' : 'Load Next 50 Logs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
