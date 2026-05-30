import React, { useState, useMemo } from 'react';
import { Shield, Plus, MoreVertical, FileText, Filter, Edit, Trash, Clock, CheckCircle, EyeOff } from 'lucide-react';
import WarrantyForm from '../components/warranty/WarrantyForm';
import AuditHistoryModal from '../components/warranty/AuditHistoryModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { useLogs } from '../context/LogContext';
import { usePO } from '../context/POContext';
import { useAuth } from '../context/AuthContext';
import { useWarranty } from '../context/WarrantyContext';
import '../components/layout/Layout.css';

const WarrantyManagement = () => {
  const { globalLogs, addLog } = useLogs();
  const { pos } = usePO();
  const { currentUser } = useAuth();
  const { claims, addOrUpdateClaim, updateClaimStatus } = useWarranty();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  const [showForm, setShowForm] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const [showHistoryFor, setShowHistoryFor] = useState(null); // claimId to view history
  const [deletionPrompt, setDeletionPrompt] = useState({ isOpen: false, claimId: null, reason: '' });
  const [systemConfirm, setSystemConfirm] = useState({ isOpen: false });
  
  // Filter state
  const [filters, setFilters] = useState({
    utilityBoard: '',
    status: '',
    storeName: '',
    showHidden: false
  });



  // Helper to extract changed fields
  const getChanges = (oldData, newData) => {
    const changes = [];
    const fieldsToIgnore = ['id', 'isHidden'];
    
    Object.keys(newData).forEach(key => {
      if (fieldsToIgnore.includes(key)) return;
      if (oldData[key] !== newData[key]) {
        changes.push({
          field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Format camelCase to Title Case
          oldValue: oldData[key],
          newValue: newData[key]
        });
      }
    });
    return changes;
  };

  const handleAddOrUpdateClaim = async (claimData) => {
    let savedClaim;
    if (editingClaim) {
      const changes = getChanges(editingClaim, claimData);
      savedClaim = await addOrUpdateClaim(claimData);
      
      if (changes.length > 0 && savedClaim) {
        // Record an edit log
        const newLog = {
          claimId: savedClaim.id,
          action: 'Edited Claim',
          user: currentUser.name,
          changes: changes
        };
        addLog(newLog);
      }
    } else {
      // Record a creation log
      savedClaim = await addOrUpdateClaim(claimData);
      if (savedClaim) {
        const newLog = {
          claimId: savedClaim.id,
          action: 'Created Claim',
          user: currentUser.name,
          changes: []
        };
        addLog(newLog);
      }
    }
    setShowForm(false);
    setEditingClaim(null);
  };

  const submitDeletionRequest = async () => {
    const { claimId, reason } = deletionPrompt;
    if (reason && reason.trim().length > 0) {
      const claim = claims.find(c => c.id === claimId);
      const newLog = {
        claimId: claimId,
        action: 'Requested Deletion', user: currentUser.name,
        changes: [
          { field: 'Status', oldValue: claim.status, newValue: 'Pending Deletion' },
          { field: 'Deletion Reason', oldValue: '', newValue: reason.trim() }
        ]
      };
      addLog(newLog);
      await updateClaimStatus(claimId, 'Pending Deletion', false, reason.trim());
      setDeletionPrompt({ isOpen: false, claimId: null, reason: '' });
    }
  };

  const initiateApproveDeletion = (id) => {
    setSystemConfirm({
      isOpen: true,
      title: 'Approve Deletion',
      message: 'Are you sure you want to approve this soft-deletion? This will hide the record permanently from the main view.',
      confirmText: 'Approve',
      confirmType: 'danger',
      onConfirm: async () => {
        const claim = claims.find(c => c.id === id);
        const newLog = {
          claimId: id,
          action: 'Approved Deletion', user: currentUser.name,
          changes: [
            { field: 'Status', oldValue: claim.status, newValue: 'Deleted' },
            { field: 'Visibility', oldValue: 'Visible', newValue: 'Hidden' }
          ]
        };
        addLog(newLog);
        await updateClaimStatus(id, 'Deleted', true);
        setSystemConfirm({ isOpen: false });
      }
    });
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      // Visibility Filter
      if (claim.isHidden && !filters.showHidden) return false;
      
      const matchBoard = claim.utilityBoard.toLowerCase().includes(filters.utilityBoard.toLowerCase());
      const matchStore = claim.storeName.toLowerCase().includes(filters.storeName.toLowerCase());
      const matchStatus = filters.status === '' || claim.status === filters.status;
      return matchBoard && matchStore && matchStatus;
    });
  }, [claims, filters]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Deleted': return 'var(--danger)';
      case 'Pending Deletion': return 'var(--danger)';
      case 'To be lifted from store': return '#3b82f6'; // blue
      case 'Pending Return': return 'var(--warning)';
      case 'Under Repair': return 'var(--accent-primary)';
      case 'Resolved': return 'var(--success)';
      case 'Inspected': return '#a855f7'; // purple
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="warranty-management">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Warranty Claims</h1>
          <p>Manage damaged transformers, tracking, and warranty repairs.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setEditingClaim(null); setShowForm(true); }}>
            <Plus size={18} /> New Warranty Claim
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem', flexWrap: 'wrap' }}>
        <Filter size={20} color="var(--text-muted)" />
        <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>Filters:</span>
        
        <input type="text" name="utilityBoard" placeholder="Filter by Board..." value={filters.utilityBoard} onChange={handleFilterChange} className="input-field" style={{ width: '180px', padding: '0.4rem 0.8rem', marginBottom: 0 }} />
        <input type="text" name="storeName" placeholder="Filter by Store Name..." value={filters.storeName} onChange={handleFilterChange} className="input-field" style={{ width: '180px', padding: '0.4rem 0.8rem', marginBottom: 0 }} />
        
        <select name="status" value={filters.status} onChange={handleFilterChange} className="input-field" style={{ width: '180px', padding: '0.4rem 0.8rem', marginBottom: 0 }}>
          <option value="">All Statuses</option>
          <option value="To be lifted from store">To be lifted from store</option>
          <option value="Pending Return">Pending Return</option>
          <option value="Pending Deletion">Pending Deletion</option>
          <option value="Inspected">Inspected</option>
          <option value="Under Repair">Under Repair</option>
          <option value="Resolved">Resolved</option>
          <option value="Deleted">Deleted</option>
        </select>

        <div style={{ flex: 1 }} />
        
        {isSuperAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: filters.showHidden ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500', transition: 'var(--transition)' }}>
            <div className="toggle-switch">
              <input type="checkbox" name="showHidden" checked={filters.showHidden} onChange={handleFilterChange} />
              <span className="toggle-slider"></span>
            </div>
            <EyeOff size={16} /> Show Deleted
          </label>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>TRANSFORMER ID</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>LOCATION & UTILITY</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>RETURN DEADLINE</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map((claim) => (
              <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: claim.isHidden ? 0.5 : 1 }} className="table-row">
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: '600' }}>{claim.slNo} {claim.isHidden && <span style={{ color: 'var(--danger)', fontSize: '0.7rem', padding: '2px 6px', border: '1px solid var(--danger)', borderRadius: '4px', marginLeft: '4px' }}>DELETED</span>}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.capacity}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: '500' }}>{claim.utilityBoard}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{claim.storeName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>PO: {claim.poNo}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: '500', color: new Date(claim.returnDate) < new Date() ? 'var(--danger)' : 'inherit' }}>
                    {claim.returnDate}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Intimated: {claim.intimationDate}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '50px', 
                    fontSize: '0.8rem', fontWeight: '600', 
                    backgroundColor: `${getStatusColor(claim.status)}20`,
                    color: getStatusColor(claim.status)
                  }}>
                    {claim.status}
                  </span>
                  {(claim.status === 'Pending Deletion' || claim.status === 'Deleted') && claim.deletionReason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', fontStyle: 'italic', maxWidth: '150px' }}>
                      Reason: {claim.deletionReason}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                  <button className="icon-btn" title="View History" onClick={() => setShowHistoryFor(claim.id)}><Clock size={18} /></button>
                  
                  {!claim.isHidden && claim.status !== 'Pending Deletion' && (
                    <>
                      <button className="icon-btn" title="Edit Claim" onClick={() => { setEditingClaim(claim); setShowForm(true); }}><Edit size={18} /></button>
                      <button className="icon-btn" title="Request Deletion" onClick={() => setDeletionPrompt({ isOpen: true, claimId: claim.id, reason: '' })} style={{ color: 'var(--danger)' }}><Trash size={18} /></button>
                    </>
                  )}

                  {isSuperAdmin && claim.status === 'Pending Deletion' && !claim.isHidden && (
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', backgroundColor: 'var(--danger)' }} onClick={() => initiateApproveDeletion(claim.id)}>
                      Approve Deletion
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredClaims.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Shield size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p>No warranty claims match your filters.</p>
          </div>
        )}
      </div>

      {showForm && (
        <WarrantyForm 
          onSubmit={handleAddOrUpdateClaim} 
          onClose={() => { setShowForm(false); setEditingClaim(null); }} 
          initialData={editingClaim}
          availablePOs={pos}
        />
      )}

      {showHistoryFor && (
        <AuditHistoryModal claimId={showHistoryFor} logs={globalLogs} onClose={() => setShowHistoryFor(null)} />
      )}

      {deletionPrompt.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--danger)' }}>Request Deletion</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Please enter a brief reason (3-4 words) for why this record should be deleted. This will be reviewed by the Super Admin.
            </p>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Created by mistake" 
              value={deletionPrompt.reason}
              onChange={(e) => setDeletionPrompt({...deletionPrompt, reason: e.target.value})}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletionPrompt({ isOpen: false, claimId: null, reason: '' })}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={submitDeletionRequest}
                disabled={!deletionPrompt.reason.trim()}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={systemConfirm.isOpen}
        title={systemConfirm.title}
        message={systemConfirm.message}
        confirmText={systemConfirm.confirmText}
        confirmType={systemConfirm.confirmType}
        onConfirm={systemConfirm.onConfirm}
        onCancel={() => setSystemConfirm({ isOpen: false })}
      />
    </div>
  );
};

export default WarrantyManagement;
