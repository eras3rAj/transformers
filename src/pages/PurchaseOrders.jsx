import React, { useState } from 'react';
import { Plus, Edit, FileText, Anchor, Trash2 } from 'lucide-react';
import POForm from '../components/po/POForm';
import ConfirmModal from '../components/common/ConfirmModal';
import { usePO } from '../context/POContext';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import '../components/layout/Layout.css';

const PurchaseOrders = () => {
  const { pos, addPO, deletePO, companies } = usePO();
  const { inspections } = useInspection();
  const { currentUser } = useAuth();
  
  const canViewFinancials = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [companyFilter, setCompanyFilter] = useState('All');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, poId: null, poNo: '' });

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSavePO = async (poData) => {
    await addPO(poData);
    setShowForm(false);
    setEditingPO(null);
  };

  const globalSummary = React.useMemo(() => {
    let totalContractValue = 0;
    let totalPendingValue = 0;
    let totalQuantity = 0;
    let totalPendingQuantity = 0;
    
    pos.forEach(po => {
      const unitTotal = (po.exWorks || 0) + (po.freight || 0) + (((po.exWorks || 0) + (po.freight || 0)) * ((po.gstRate || 0) / 100));
      totalContractValue += unitTotal * (po.quantity || 1);
      totalQuantity += (po.quantity || 1);

      const poFinalInspections = inspections?.filter(i => i.poNo === po.poNo && i.type === 'Final') || [];
      const totalAccepted = poFinalInspections.reduce((sum, i) => sum + Number(i.qtyAccepted || 0), 0);
      const pendingQty = Math.max(0, (po.quantity || 1) - totalAccepted);
      totalPendingValue += unitTotal * pendingQty;
      totalPendingQuantity += pendingQty;
    });

    return { totalContractValue, totalPendingValue, totalQuantity, totalPendingQuantity };
  }, [pos, inspections]);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Purchase Orders</h1>
          <p>Manage Purchase Orders, financials, and custom PV Formulas.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Company:</span>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="input-field" style={{ marginBottom: 0, minWidth: '150px' }}>
              <option value="All">All Companies</option>
              {companies?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {currentUser?.role === 'superadmin' && (
            <button className="btn btn-primary" onClick={() => { setEditingPO(null); setShowForm(true); }}>
              <Plus size={18} /> Create PO
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PO NUMBER & DETAILS</th>
              {canViewFinancials && (
                <>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>FINANCIALS</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CONTRACT VALUE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PENDING VALUE</th>
                </>
              )}
              {currentUser?.role === 'superadmin' && (
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTIONS</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pos.filter(po => companyFilter === 'All' || po.companyName === companyFilter).map((po) => {
              const unitTotal = (po.exWorks || 0) + (po.freight || 0) + (((po.exWorks || 0) + (po.freight || 0)) * ((po.gstRate || 0) / 100));
              const totalValue = unitTotal * (po.quantity || 1);
              
              const poFinalInspections = inspections?.filter(i => i.poNo === po.poNo && i.type === 'Final') || [];
              const totalAccepted = poFinalInspections.reduce((sum, i) => sum + Number(i.qtyAccepted || 0), 0);
              const pendingQty = Math.max(0, (po.quantity || 1) - totalAccepted);
              const pendingValue = unitTotal * pendingQty;
              
              return (
              <tr key={po.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'inline-block', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.4rem', border: '1px solid var(--border-color)' }}>
                    {po.companyName}
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{po.poNo}</div>
                  <div style={{ fontWeight: '500' }}>{po.utilityBoard} - {po.capacity} {po.noOfPhases === '3-Phase' ? '(3-Phase)' : ''}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Qty: {po.quantity} | Delivered: <span style={{ color: 'var(--success)' }}>{totalAccepted}</span> | Balance: <span style={{ color: pendingQty > 0 ? 'var(--warning)' : 'var(--success)' }}>{pendingQty}</span>
                  </div>
                  {po.remarks && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontStyle: 'italic', backgroundColor: 'var(--bg-tertiary)', padding: '0.3rem', borderRadius: '4px' }}>
                      Note: {po.remarks}
                    </div>
                  )}
                </td>
                {canViewFinancials && (
                  <>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>Ex-Works: <strong>{formatCurrency(po.exWorks)}</strong></div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Freight: {formatCurrency(po.freight)}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', paddingBottom: '0.2rem', borderBottom: '1px dashed var(--border-color)' }}>
                        Per Unit: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(unitTotal)}</strong> 
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>(w/ {po.gstRate}% GST)</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Base: {po.baseMonthStr}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {formatCurrency(totalValue)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Total
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: pendingQty > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {formatCurrency(pendingValue)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Pending ({pendingQty} units)
                      </div>
                    </td>
                  </>
                )}
                {currentUser?.role === 'superadmin' && (
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="icon-btn" title="Edit PO" onClick={() => { setEditingPO(po); setShowForm(true); }}>
                        <Edit size={18} />
                      </button>
                      <button className="icon-btn" style={{ color: 'var(--danger)' }} title="Delete PO" onClick={() => setDeleteModal({ isOpen: true, poId: po.id, poNo: po.poNo })}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
        {pos.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Anchor size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p>No Purchase Orders found. Create one to get started.</p>
          </div>
        )}
        {canViewFinancials && pos.length > 0 && (
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem 2rem', borderTop: '2px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>TOTAL CONTRACT VALUE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {formatCurrency(globalSummary.totalContractValue)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{globalSummary.totalQuantity} total units ordered</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>PENDING ORDERS (IN HAND)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--warning)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {formatCurrency(globalSummary.totalPendingValue)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{globalSummary.totalPendingQuantity} units pending dispatch</div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <POForm 
          onSubmit={handleSavePO} 
          onClose={() => { setShowForm(false); setEditingPO(null); }} 
          initialData={editingPO}
        />
      )}

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Purchase Order"
        message={`Are you sure you want to permanently delete PO "${deleteModal.poNo}"? This action cannot be undone.`}
        confirmText="Delete PO"
        confirmType="danger"
        onConfirm={async () => {
          if (deleteModal.poId) {
            await deletePO(deleteModal.poId);
          }
          setDeleteModal({ isOpen: false, poId: null, poNo: '' });
        }}
        onCancel={() => setDeleteModal({ isOpen: false, poId: null, poNo: '' })}
      />
    </div>
  );
};

export default PurchaseOrders;
