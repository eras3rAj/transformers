import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import { FileText, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';

const DailyExpenses = () => {
  const { expenses, addExpense, updateExpenseStatus, loading } = useExpenses();
  const { currentUser } = useAuth();
  const { addLog } = useLogs();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reason: '',
    payable_to: ''
  });
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', expenseId: null });

  const isApprover = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.reason || !formData.payable_to) return;
    
    const newExpense = {
      ...formData,
      amount: parseFloat(formData.amount),
      submitted_by: currentUser.name,
      status: 'Pending'
    };
    
    const res = await addExpense(newExpense);
    
    if (res.success) {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: 'Submitted Daily Expense',
        user: currentUser.name,
        changes: [
          { field: 'Amount', oldValue: '', newValue: `₹${newExpense.amount}` },
          { field: 'Reason', oldValue: '', newValue: newExpense.reason }
        ]
      });
      setFormData({ date: new Date().toISOString().split('T')[0], amount: '', reason: '', payable_to: '' });
      setShowAddForm(false);
    }
  };

  const confirmAction = async (expenseId, type) => {
    const status = type === 'approve' ? 'Approved' : 'Rejected';
    const res = await updateExpenseStatus(expenseId, status, currentUser.name);
    
    if (res.success) {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: `${status} Expense`,
        user: currentUser.name,
        changes: [
          { field: 'Expense ID', oldValue: '', newValue: expenseId },
          { field: 'Status', oldValue: 'Pending', newValue: status }
        ]
      });
    }
    setActionModal({ isOpen: false, type: '', expenseId: null });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Approved</span>;
      case 'Rejected':
        return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Rejected</span>;
      default:
        return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pending</span>;
    }
  };

  // Filter expenses: normal users see only their own, admins see all
  const visibleExpenses = isApprover ? expenses : expenses.filter(exp => exp.submitted_by === currentUser.name);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Daily Expenses
          </h1>
          <p>Submit and track daily operational expenses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={18} /> Log Expense
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DATE</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>AMOUNT</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>REASON</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PAYABLE TO</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>SUBMITTED BY</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
                {isApprover && <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isApprover ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading expenses...</td></tr>
              ) : visibleExpenses.length === 0 ? (
                <tr><td colSpan={isApprover ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses logged yet.</td></tr>
              ) : (
                visibleExpenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(exp.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>₹{Number(exp.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td style={{ padding: '1rem' }}>{exp.reason}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{exp.payable_to}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{exp.submitted_by}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {renderStatusBadge(exp.status)}
                        {exp.approved_by && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {exp.approved_by}</span>}
                      </div>
                    </td>
                    {isApprover && (
                      <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {exp.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="icon-btn" style={{ color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', width: '28px', height: '28px' }} onClick={() => setActionModal({ isOpen: true, type: 'approve', expenseId: exp.id })} title="Approve">
                              <CheckCircle size={14} />
                            </button>
                            <button className="icon-btn" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', width: '28px', height: '28px' }} onClick={() => setActionModal({ isOpen: true, type: 'reject', expenseId: exp.id })} title="Reject">
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actioned</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={24} color="var(--accent-primary)" /> Log Daily Expense
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="input-field" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Amount (₹)</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="input-field" placeholder="0.00" min="0" step="0.01" required />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Payable To</label>
                <input type="text" name="payable_to" value={formData.payable_to} onChange={handleInputChange} className="input-field" placeholder="Vendor / Person Name" required />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Reason / Description</label>
                <textarea name="reason" value={formData.reason} onChange={handleInputChange} className="input-field" placeholder="What was this expense for?" rows="3" required style={{ resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? 'Approve Expense' : 'Reject Expense'}
        message={`Are you sure you want to ${actionModal.type} this expense request?`}
        confirmText={actionModal.type === 'approve' ? 'Approve' : 'Reject'}
        confirmType={actionModal.type === 'approve' ? 'primary' : 'danger'}
        onConfirm={() => confirmAction(actionModal.expenseId, actionModal.type)}
        onCancel={() => setActionModal({ isOpen: false, type: '', expenseId: null })}
      />
    </div>
  );
};

export default DailyExpenses;
