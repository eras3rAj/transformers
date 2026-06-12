import { formatDate } from '../utils/dateUtils';
import { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import { useUsers } from '../context/UserContext';
import { FileText, Plus, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { exportToCSV, printDocument } from '../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DailyExpenses = () => {
  const { expenses, addExpense, updateExpenseStatus, updateExpenseComment, loading } = useExpenses();
  const { currentUser } = useAuth();
  const { addLog } = useLogs();
  const { users } = useUsers();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reason: '',
    payable_to: ''
  });
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', expenseId: null });

  const isApprover = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const getSubmitterRole = (submitterName) => {
    const user = users.find(u => u.name === submitterName);
    return user ? user.role : 'employee'; // default to employee if not found
  };

  const canApproveExpense = (exp) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true; // Superadmins can approve anything
    if (currentUser.role === 'admin') {
      const submitterRole = getSubmitterRole(exp.submitted_by);
      return submitterRole === 'employee'; // Admins can only approve employee expenses
    }
    return false;
  };

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

  const confirmAction = async (comment) => {
    const { expenseId, type } = actionModal;
    
    if (type === 'comment') {
      if (!comment) {
        setActionModal({ isOpen: false, type: '', expenseId: null });
        return;
      }
      const res = await updateExpenseComment(expenseId, comment);
      if (res.success) {
        addLog({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: `Added Comment to Expense`,
          user: currentUser.name,
          changes: [
            { field: 'Expense ID', oldValue: '', newValue: expenseId },
            { field: 'Comment', oldValue: '', newValue: comment }
          ]
        });
      }
      setActionModal({ isOpen: false, type: '', expenseId: null });
      return;
    }

    const status = type === 'approve' ? 'Approved' : 'Rejected';
    const res = await updateExpenseStatus(expenseId, status, currentUser.name, comment);
    
    if (res.success) {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: `${status} Expense`,
        user: currentUser.name,
        changes: [
          { field: 'Expense ID', oldValue: '', newValue: expenseId },
          { field: 'Status', oldValue: 'Pending', newValue: status },
          ...(comment ? [{ field: 'Approver Comment', oldValue: '', newValue: comment }] : [])
        ]
      });
    } else {
      alert('Failed to update expense: ' + (res.error || 'Unknown error'));
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



  // Compute Chart Data (Last 7 Days)
  const chartData = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = visibleExpenses
      .filter(exp => exp.date === dateStr && exp.status !== 'Rejected')
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    return { name: formatDate(d), total: dayTotal };
  });

  const handleExportPDF = () => {
    const data = visibleExpenses.map(exp => ({
      Date: formatDate(exp.date),
      'Amount (INR)': Number(exp.amount).toFixed(2),
      Reason: exp.reason,
      'Payable To': exp.payable_to,
      'Submitted By': exp.submitted_by,
      Status: exp.status
    }));
    printDocument('Daily Expenses Report', data);
  };

  const handleExportExcel = () => {
    const data = visibleExpenses.map(exp => ({
      Date: formatDate(exp.date),
      'Amount (INR)': Number(exp.amount).toFixed(2),
      Reason: exp.reason,
      'Payable To': exp.payable_to,
      'Submitted By': exp.submitted_by,
      Status: exp.status
    }));
    exportToCSV(data, 'daily_expenses_report.csv');
  };

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            Export PDF
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Log Expense
          </button>
        </div>
      </div>

      {visibleExpenses.length > 0 && (
        <div className="card animate-fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', height: '220px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>LAST 7 DAYS TREND (APPROVED & PENDING)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={val => '₹' + val} />
              <Tooltip 
                cursor={{ fill: 'var(--bg-tertiary)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                formatter={(value) => [`₹${value}`, 'Total']}
              />
              <Bar dataKey="total" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2rem' }}><SkeletonLoader type="table" count={3} /></td></tr>
              ) : visibleExpenses.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses logged yet.</td></tr>
              ) : (
                visibleExpenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>₹{Number(exp.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td style={{ padding: '1rem' }}>{exp.reason}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{exp.payable_to}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{exp.submitted_by}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {renderStatusBadge(exp.status)}
                        {exp.approved_by && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {exp.approved_by}</span>}
                        {exp.approver_comment && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{exp.approver_comment}"</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {exp.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {canApproveExpense(exp) ? (
                            <>
                              <button className="icon-btn" style={{ color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', width: '28px', height: '28px' }} onClick={() => setActionModal({ isOpen: true, type: 'approve', expenseId: exp.id })} title="Approve">
                                <CheckCircle size={14} />
                              </button>
                              <button className="icon-btn" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', width: '28px', height: '28px' }} onClick={() => setActionModal({ isOpen: true, type: 'reject', expenseId: exp.id })} title="Reject">
                                <XCircle size={14} />
                              </button>
                              <button className="icon-btn" style={{ color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '4px', width: '28px', height: '28px' }} onClick={() => setActionModal({ isOpen: true, type: 'comment', expenseId: exp.id })} title="Raise Comment">
                                <MessageSquare size={14} />
                              </button>
                            </>
                          ) : (
                            exp.submitted_by === currentUser?.name ? (
                              <button className="icon-btn" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', width: 'auto', height: '28px', padding: '0 8px' }} onClick={() => setActionModal({ isOpen: true, type: 'reject', expenseId: exp.id })} title="Cancel/Reject Own Request">
                                <XCircle size={14} style={{ marginRight: '4px' }}/> Cancel
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting Superadmin</span>
                            )
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actioned</span>
                      )}
                    </td>
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
        title={actionModal.type === 'approve' ? 'Approve Expense' : actionModal.type === 'reject' ? 'Reject Expense' : 'Raise Comment'}
        message={actionModal.type === 'comment' ? 'Add a comment or query for this expense request without changing its pending status.' : `Are you sure you want to ${actionModal.type} this expense request?`}
        confirmText={actionModal.type === 'approve' ? 'Approve' : actionModal.type === 'reject' ? 'Reject' : 'Add Comment'}
        confirmType={actionModal.type === 'approve' ? 'primary' : actionModal.type === 'reject' ? 'danger' : 'primary'}
        showInput={true}
        inputPlaceholder={actionModal.type === 'comment' ? "Type your comment here..." : "Add an optional comment..."}
        onConfirm={(comment) => confirmAction(comment)}
        onCancel={() => setActionModal({ isOpen: false, type: '', expenseId: null })}
      />
    </div>
  );
};

export default DailyExpenses;
