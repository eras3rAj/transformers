import { useState, useMemo } from 'react';
import { Shield, Plus, Filter, Edit, Trash, Clock, EyeOff, Download, FileText, AlertTriangle, BarChart3, ListFilter, Building2 } from 'lucide-react';
import WarrantyForm from '../components/warranty/WarrantyForm';
import AuditHistoryModal from '../components/warranty/AuditHistoryModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { exportToCSV, printDocument } from '../utils/exportUtils';
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
  const [activeSubTab, setActiveSubTab] = useState('summary');
  
  // Filter state
  const [filters, setFilters] = useState({
    utilityBoard: '',
    status: '',
    storeName: '',
    showHidden: false,
    sortBy: 'nearest_deadline'
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };



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
    let result = claims.filter(claim => {
      // Visibility Filter
      if (claim.isHidden && !filters.showHidden) return false;
      
      const matchBoard = claim.utilityBoard.toLowerCase().includes(filters.utilityBoard.toLowerCase());
      const matchStore = claim.storeName.toLowerCase().includes(filters.storeName.toLowerCase());
      const matchStatus = filters.status === '' || claim.status === filters.status;
      return matchBoard && matchStore && matchStatus;
    });

    if (filters.sortBy === 'nearest_deadline') {
      result = result.sort((a, b) => {
        if (!a.returnDate) return 1;
        if (!b.returnDate) return -1;
        return new Date(a.returnDate) - new Date(b.returnDate);
      });
    }

    return result;
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

  // Summary statistics
  const summaryStats = useMemo(() => {
    const activeClaims = claims.filter(c => !c.isHidden);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Status breakdown
    const statusCounts = {};
    activeClaims.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    // Board breakdown
    const boardCounts = {};
    activeClaims.forEach(c => {
      boardCounts[c.utilityBoard] = (boardCounts[c.utilityBoard] || 0) + 1;
    });

    // Capacity breakdown
    const capacityCounts = {};
    activeClaims.forEach(c => {
      capacityCounts[c.capacity] = (capacityCounts[c.capacity] || 0) + 1;
    });

    // Overdue claims
    const overdue = activeClaims.filter(c => {
      if (!c.returnDate) return false;
      return new Date(c.returnDate) < today && c.status !== 'Resolved' && c.status !== 'Deleted';
    });

    // Upcoming deadlines (within next 30 days)
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const upcoming = activeClaims.filter(c => {
      if (!c.returnDate) return false;
      const rd = new Date(c.returnDate);
      return rd >= today && rd <= thirtyDays && c.status !== 'Resolved' && c.status !== 'Deleted';
    }).sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));

    return {
      total: activeClaims.length,
      statusCounts,
      boardCounts,
      capacityCounts,
      overdue,
      upcoming,
      resolved: activeClaims.filter(c => c.status === 'Resolved').length,
      pendingDeletion: activeClaims.filter(c => c.status === 'Pending Deletion').length
    };
  }, [claims]);

  return (
    <div className="warranty-management">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Warranty Claims</h1>
          <p>Manage damaged transformers, tracking, and warranty repairs.</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', padding: '0.4rem' }}>
        <button
          onClick={() => setActiveSubTab('summary')}
          style={{ flex: 1, padding: '0.8rem', backgroundColor: activeSubTab === 'summary' ? 'var(--accent-primary)' : 'transparent', color: activeSubTab === 'summary' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <BarChart3 size={18} /> Summary
        </button>
        <button
          onClick={() => setActiveSubTab('claims')}
          style={{ flex: 1, padding: '0.8rem', backgroundColor: activeSubTab === 'claims' ? 'var(--accent-primary)' : 'transparent', color: activeSubTab === 'claims' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <ListFilter size={18} /> Claims List
        </button>
      </div>

      {activeSubTab === 'summary' ? (
        <div className="animate-fade-in">
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Active Claims</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{summaryStats.total}</div>
            </div>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Overdue</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>{summaryStats.overdue.length}</div>
            </div>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Due Within 30 Days</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>{summaryStats.upcoming.length}</div>
            </div>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Resolved</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>{summaryStats.resolved}</div>
            </div>
          </div>

          {/* Status Breakdown + Board Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Status Breakdown */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--accent-primary)" /> Status Breakdown
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>STATUS</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summaryStats.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                    <tr key={status} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: `${getStatusColor(status)}20`, color: getStatusColor(status) }}>{status}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>{count}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700' }}>Total</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{summaryStats.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Capacity Distribution */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} color="var(--accent-primary)" /> Claims by Capacity
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {Object.entries(summaryStats.capacityCounts).sort((a, b) => b[1] - a[1]).map(([cap, count]) => (
                  <div key={cap} className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '140px' }}>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{cap}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: '700', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overdue Claims Table */}
          {summaryStats.overdue.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <AlertTriangle size={20} /> Overdue Claims ({summaryStats.overdue.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TRANSFORMER ID</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>UTILITY / STORE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>RETURN DEADLINE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>DAYS OVERDUE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryStats.overdue.sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate)).map(c => {
                    const daysOverdue = Math.floor((new Date() - new Date(c.returnDate)) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '600' }}>{c.slNo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.capacity}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500' }}>{c.utilityBoard}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.storeName}</div>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--danger)', fontWeight: '500' }}>{formatDate(c.returnDate)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>{daysOverdue} days</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: `${getStatusColor(c.status)}20`, color: getStatusColor(c.status) }}>{c.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Upcoming Deadlines */}
          {summaryStats.upcoming.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                <Clock size={20} /> Upcoming Deadlines - Next 30 Days ({summaryStats.upcoming.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TRANSFORMER ID</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>UTILITY / STORE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>RETURN DEADLINE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>DAYS LEFT</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryStats.upcoming.map(c => {
                    const daysLeft = Math.floor((new Date(c.returnDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '600' }}>{c.slNo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.capacity}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500' }}>{c.utilityBoard}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.storeName}</div>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{formatDate(c.returnDate)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: daysLeft <= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: daysLeft <= 7 ? 'var(--danger)' : 'var(--warning)' }}>{daysLeft} days</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: `${getStatusColor(c.status)}20`, color: getStatusColor(c.status) }}>{c.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Board Breakdown */}
          {Object.keys(summaryStats.boardCounts).length > 0 && (
            <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="var(--accent-primary)" /> Claims by Utility Board
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>UTILITY BOARD</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summaryStats.boardCounts).sort((a, b) => b[1] - a[1]).map(([board, count]) => (
                    <tr key={board} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{board}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
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

        <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="input-field" style={{ width: '180px', padding: '0.4rem 0.8rem', marginBottom: 0 }}>
          <option value="newest">Sort: Newest First</option>
          <option value="nearest_deadline">Sort: Nearest Deadline</option>
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
        
        <button className="btn btn-secondary" title="Download CSV" onClick={() => {
          const exportData = filteredClaims.map(c => ({
            'Transformer ID': c.slNo || '',
            'Capacity': c.capacity || '',
            'Utility Board': c.utilityBoard || '',
            'Store Name': c.storeName || '',
            'PO No': c.poNo || '',
            'Intimation Date': formatDate(c.intimationDate),
            'Return Deadline': formatDate(c.returnDate),
            'Status': c.status || '',
            'Deletion Reason': c.deletionReason || ''
          }));
          exportToCSV(exportData, `Warranty_Claims_${new Date().toISOString().slice(0,10)}.csv`);
        }}>
          <Download size={16} /> CSV
        </button>
        
        <button className="btn btn-secondary" title="Print / Save as PDF" onClick={() => {
          const exportData = filteredClaims.map(c => ({
            'Transformer ID': c.slNo || '',
            'Capacity': c.capacity || '',
            'Utility Board': c.utilityBoard || '',
            'Store Name': c.storeName || '',
            'PO No': c.poNo || '',
            'Intimation Date': formatDate(c.intimationDate),
            'Return Deadline': formatDate(c.returnDate),
            'Status': c.status || ''
          }));
          printDocument('Warranty Claims Report', exportData);
        }}>
          <FileText size={16} /> PDF
        </button>

        <button className="btn btn-primary" onClick={() => { setEditingClaim(null); setShowForm(true); }}>
          <Plus size={18} /> New Claim
        </button>
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
                    {formatDate(claim.returnDate)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Intimated: {formatDate(claim.intimationDate)}</div>
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
      </div>
      )}

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
