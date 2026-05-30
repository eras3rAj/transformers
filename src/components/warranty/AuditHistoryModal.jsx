import React from 'react';
import { X, Clock, ArrowRight } from 'lucide-react';
import '../layout/Layout.css';

const AuditHistoryModal = ({ claimId, logs, onClose }) => {
  // Filter logs for this specific claim
  const claimLogs = logs.filter(log => log.claimId === claimId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={24} color="var(--accent-primary)" />
            <h2 style={{ margin: 0 }}>Audit History</h2>
          </div>
          <button onClick={onClose} className="icon-btn" type="button"><X size={24} /></button>
        </div>

        {claimLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
            <p>No edits have been made to this claim yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {claimLogs.map(log => (
              <div key={log.id} style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '1.5rem', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', left: '-7px', top: 0, width: '12px', height: '12px', 
                  backgroundColor: 'var(--accent-primary)', borderRadius: '50%' 
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>{log.action}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatTime(log.timestamp)} by {log.user}</span>
                </div>
                
                {log.changes && log.changes.length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {log.changes.map((change, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', marginBottom: idx !== log.changes.length - 1 ? '0.5rem' : 0 }}>
                        <span style={{ width: '120px', fontWeight: '500', color: 'var(--text-secondary)' }}>{change.field}:</span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--danger)', flex: 1 }}>{change.oldValue || '—'}</span>
                        <ArrowRight size={14} color="var(--text-muted)" />
                        <span style={{ color: 'var(--success)', flex: 1, fontWeight: '500' }}>{change.newValue || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditHistoryModal;
