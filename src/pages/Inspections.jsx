import React
import { formatDate } from '../utils/dateUtils';, { useState, useMemo } from 'react';
import { usePO } from '../context/POContext';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, Calendar, Truck, Save, Check, Plus, AlertCircle, FileText, TrendingUp, Package, X, Edit, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/common/ConfirmModal';
import PromptModal from '../components/common/PromptModal';
import '../components/layout/Layout.css';

const Inspections = () => {
  const { pos, companies } = usePO();
  const { schedules, inspections, saveSchedule, logInspection, updateInspection, deleteInspection, getStatsForPO } = useInspection();
  const { currentUser } = useAuth();

  const [companyFilter, setCompanyFilter] = useState('All');
  const [selectedPoNo, setSelectedPoNo] = useState('');
  const [inspectionFilter, setInspectionFilter] = useState('All');
  
  // Forms state
  const [scheduleForm, setScheduleForm] = useState({ date: '', quantity: '' });
  const [editingInspectionId, setEditingInspectionId] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({ 
    type: 'Stage', 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0], 
    qtyOffered: '', 
    qtyInspected: '', 
    qtyAccepted: '', 
    weight: '',
    remarks: '' 
  });

  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, inspectionId: null });
  const [promptModal, setPromptModal] = useState({ isOpen: false, scheduleId: null });

  const selectedPO = useMemo(() => pos.find(p => p.poNo === selectedPoNo), [pos, selectedPoNo]);
  
  const stats = useMemo(() => {
    if (!selectedPO) return null;
    return getStatsForPO(selectedPoNo, selectedPO.quantity);
  }, [selectedPoNo, selectedPO, schedules, inspections, getStatsForPO]);

  const inspectionSummary = useMemo(() => {
    if (!selectedPoNo) return null;
    const poInsp = inspections.filter(i => i.poNo === selectedPoNo);
    
    const stageInsp = poInsp.filter(i => i.type === 'Stage');
    const finalInsp = poInsp.filter(i => i.type === 'Final');

    const totalStageOffered = stageInsp.reduce((sum, i) => sum + Number(i.qtyOffered || 0), 0);
    const totalStageInspected = stageInsp.reduce((sum, i) => sum + Number(i.qtyInspected || 0), 0);
    
    // Parse numeric weight from strings
    const totalStageWeight = stageInsp.reduce((sum, i) => {
      const match = String(i.weight || '').match(/[\d.]+/);
      return sum + (match ? Number(match[0]) : 0);
    }, 0);

    const totalFinalInspected = finalInsp.reduce((sum, i) => sum + Number(i.qtyInspected || 0), 0);
    const totalFinalAccepted = finalInsp.reduce((sum, i) => sum + Number(i.qtyAccepted || 0), 0);

    return { totalStageInspected, totalStageWeight, totalFinalInspected, totalFinalAccepted };
  }, [inspections, selectedPoNo]);

  const globalSummary = useMemo(() => {
    // Only include POs matching companyFilter
    const validPONos = pos.filter(po => companyFilter === 'All' || po.companyName === companyFilter).map(p => p.poNo);
    const filteredInspections = inspections.filter(i => validPONos.includes(i.poNo));
    
    const stageInsp = filteredInspections.filter(i => i.type === 'Stage');
    const finalInsp = filteredInspections.filter(i => i.type === 'Final');

    const totalStageInspected = stageInsp.reduce((sum, i) => sum + Number(i.qtyInspected || 0), 0);
    const totalStageWeight = stageInsp.reduce((sum, i) => {
      const match = String(i.weight || '').match(/[\d.]+/);
      return sum + (match ? Number(match[0]) : 0);
    }, 0);

    const totalFinalInspected = finalInsp.reduce((sum, i) => sum + Number(i.qtyInspected || 0), 0);
    const totalFinalAccepted = finalInsp.reduce((sum, i) => sum + Number(i.qtyAccepted || 0), 0);

    return { totalStageInspected, totalStageWeight, totalFinalInspected, totalFinalAccepted };
  }, [inspections, pos, companyFilter]);

  // Handle Schedule Add
  const handleAddSchedule = async () => {
    if (!scheduleForm.date || !scheduleForm.quantity) return;
    const currentSchedules = schedules.find(s => s.poNo === selectedPoNo)?.schedules || [];
    const newSchedule = { id: Date.now().toString(), date: scheduleForm.date, quantity: Number(scheduleForm.quantity) };
    const updatedSchedules = [...currentSchedules, newSchedule].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await supabase.from('system_logs').insert([{
      action: 'Schedule Entry Added',
      user_name: currentUser?.name || currentUser?.email || 'User',
      claim_id: selectedPoNo,
      changes: { addedSchedule: newSchedule }
    }]);

    await saveSchedule(selectedPoNo, updatedSchedules);
    setScheduleForm({ date: '', quantity: '' });
  };

  const handleRemoveSchedule = (idToRemove) => {
    setPromptModal({ isOpen: true, scheduleId: idToRemove });
  };

  const confirmRemoveSchedule = async (reason) => {
    if (!reason || !reason.trim()) {
      setPromptModal({ isOpen: false, scheduleId: null });
      setAlertModal({ isOpen: true, message: "Deletion cancelled. A valid reason is required." });
      return;
    }

    const idToRemove = promptModal.scheduleId;
    const currentSchedules = schedules.find(s => s.poNo === selectedPoNo)?.schedules || [];
    const scheduleToDelete = currentSchedules.find(s => s.id === idToRemove);
    const updatedSchedules = currentSchedules.filter(s => s.id !== idToRemove);

    await supabase.from('system_logs').insert([{
      action: 'Schedule Entry Deleted',
      user_name: currentUser?.name || currentUser?.email || 'User',
      claim_id: selectedPoNo,
      changes: { deletedSchedule: scheduleToDelete, reason: reason.trim() }
    }]);

    await saveSchedule(selectedPoNo, updatedSchedules);
    setPromptModal({ isOpen: false, scheduleId: null });
  };

  const handleAddInspection = async () => {
    if (!inspectionForm.qtyInspected) return;

    const isFinal = inspectionForm.type === 'Final';
    const qtyToAccept = isFinal ? Number(inspectionForm.qtyAccepted) : Number(inspectionForm.qtyInspected);

    if (isFinal && stats) {
      const oldInsp = editingInspectionId ? inspections.find(i => i.id === editingInspectionId) : null;
      const oldQty = oldInsp ? Number(oldInsp.qtyAccepted) : 0;
      const availableBalance = stats.balanceStageQty + oldQty;
      
      if (qtyToAccept > availableBalance) {
        setAlertModal({ isOpen: true, message: `Error: Cannot final inspect more than the available Stage Balance (${availableBalance}).` });
        return;
      }
    }

    const payload = {
      poNo: selectedPoNo,
      type: inspectionForm.type,
      startDate: inspectionForm.startDate,
      endDate: inspectionForm.endDate,
      qtyOffered: Number(inspectionForm.qtyInspected), // Same as inspected
      qtyInspected: Number(inspectionForm.qtyInspected),
      qtyAccepted: qtyToAccept,
      weight: inspectionForm.type === 'Stage' ? inspectionForm.weight : '',
      remarks: inspectionForm.remarks
    };

    if (editingInspectionId) {
      await updateInspection(editingInspectionId, payload);
    } else {
      await logInspection(payload);
    }

    setEditingInspectionId(null);
    setInspectionForm({ 
      type: 'Stage', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0], 
      qtyOffered: '', qtyInspected: '', qtyAccepted: '', weight: '', remarks: '' 
    });
  };

  const handleEditInspection = (insp) => {
    setEditingInspectionId(insp.id);
    setInspectionForm({
      type: insp.type,
      startDate: insp.startDate,
      endDate: insp.endDate,
      qtyOffered: insp.qtyOffered,
      qtyInspected: insp.qtyInspected,
      qtyAccepted: insp.qtyAccepted,
      weight: insp.weight || '',
      remarks: insp.remarks || ''
    });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-primary)' }}>
          <ClipboardCheck size={28} color="var(--accent-primary)" />
          Inspections & Delivery Tracking
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track delivery schedules, stage/final inspections, and dispatches per PO.</p>
      </div>

      {/* PO Selector & Filters */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>FILTER BY COMPANY</label>
          <select 
            className="input-field" 
            value={companyFilter} 
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setSelectedPoNo(''); // Reset PO when company changes
            }}
            style={{ width: '100%', padding: '0.8rem' }}
          >
            <option value="All">All Companies</option>
            {companies?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div style={{ flex: '2', minWidth: '300px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>SELECT PURCHASE ORDER</label>
          <select 
            className="input-field" 
            value={selectedPoNo} 
            onChange={(e) => setSelectedPoNo(e.target.value)}
            style={{ width: '100%', padding: '0.8rem' }}
          >
            <option value="">-- Select a PO --</option>
            {pos.filter(po => companyFilter === 'All' || po.companyName === companyFilter).map(po => (
              <option key={po.id} value={po.poNo}>{po.poNo} ({po.utilityBoard}) - {po.capacity ? `${po.capacity} - ` : ''}{po.quantity} Units</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPO && globalSummary && (
        <div className="animate-fade-in card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <ClipboardCheck size={24} color="var(--accent-primary)" />
            Global Inspection Summary {companyFilter !== 'All' ? `(${companyFilter})` : ''}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>TOTAL STAGE INSPECTIONS</h5>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Units Inspected</span><strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{globalSummary.totalStageInspected}</strong></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Total Weight</span><strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{globalSummary.totalStageWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg</strong></div>
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: 'var(--warning)', fontSize: '0.9rem' }}>TOTAL FINAL INSPECTIONS</h5>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Units Accepted</span><strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{globalSummary.totalFinalAccepted}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPO && stats && (
        <div className="animate-fade-in">
          
          {/* Global Summary Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>TOTAL ORDERED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedPO.quantity}</div>
            </div>
            
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>SCHEDULED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{stats.scheduledQty}</div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>STAGE INSPECTED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{stats.stageInspectedQty}</div>
            </div>
            
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '2px solid var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '0.5rem' }}>BALANCE STAGE QTY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{stats.balanceStageQty}</div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>FINAL ACCEPTED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--success)' }}>{stats.acceptedQty}</div>
            </div>
            
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '2px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '600', marginBottom: '0.5rem' }}>BALANCE PO QTY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--danger)' }}>{stats.balanceQty}</div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '2px solid var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: '600', marginBottom: '0.5rem' }}>NEXT SCHEDULE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--warning)', marginTop: '0.5rem' }}>
                {stats.nextSchedule ? new Date(stats.nextSchedule.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'None'}
              </div>
              {stats.nextSchedule && (
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', opacity: 0.8, marginTop: '0.2rem' }}>
                  {stats.nextSchedule.balanceQty} units pending
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
            
            {/* Delivery Schedule Module */}
            <div className="card" style={{ flex: '1 1 300px', maxWidth: '450px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginTop: 0 }}>
                <Calendar size={20} /> Delivery Schedule
              </h3>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input type="date" className="input-field" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} style={{ flex: 1 }} />
                <input type="number" className="input-field" placeholder="Qty" value={scheduleForm.quantity} onChange={e => setScheduleForm({...scheduleForm, quantity: e.target.value})} style={{ width: '80px' }} />
                <button className="btn btn-primary" onClick={handleAddSchedule}><Plus size={18} /></button>
              </div>

              <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '1rem' }}>
                {(schedules.find(s => s.poNo === selectedPoNo)?.schedules || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>No schedule added yet.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {(schedules.find(s => s.poNo === selectedPoNo)?.schedules || []).map((s, idx) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.8rem 0', fontWeight: '500' }}>Lot {idx + 1}</td>
                          <td style={{ padding: '0.8rem 0' }}>{new Date(s.date).toLocaleDateString()}</td>
                          <td style={{ padding: '0.8rem 0', fontWeight: '600', color: 'var(--accent-primary)' }}>{s.quantity} Units</td>
                          <td style={{ padding: '0.8rem 0', textAlign: 'right' }}>
                            <button onClick={() => handleRemoveSchedule(s.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Inspections Module */}
            <div className="card" style={{ flex: '3 1 600px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginTop: 0 }}>
                <ClipboardCheck size={20} /> Inspections
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select className="input-field" value={inspectionForm.type} onChange={e => setInspectionForm({...inspectionForm, type: e.target.value})} style={{ flex: 1 }}>
                    <option value="Stage">Stage Inspection</option>
                    <option value="Final">Final Inspection</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 2 }}>
                    <input type="date" className="input-field" value={inspectionForm.startDate} onChange={e => setInspectionForm({...inspectionForm, startDate: e.target.value})} title="Start Date" />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input type="date" className="input-field" value={inspectionForm.endDate} onChange={e => setInspectionForm({...inspectionForm, endDate: e.target.value})} title="End Date" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="number" className="input-field" placeholder="Qty Inspected" value={inspectionForm.qtyInspected} onChange={e => setInspectionForm({...inspectionForm, qtyInspected: e.target.value})} style={{ flex: 1 }} />
                  {inspectionForm.type === 'Final' && (
                    <input type="number" className="input-field" placeholder="Qty Accepted" value={inspectionForm.qtyAccepted} onChange={e => setInspectionForm({...inspectionForm, qtyAccepted: e.target.value})} style={{ flex: 1 }} />
                  )}
                  {inspectionForm.type === 'Stage' && (
                    <input type="text" className="input-field" placeholder="Weight (e.g. 500kg)" value={inspectionForm.weight} onChange={e => setInspectionForm({...inspectionForm, weight: e.target.value})} style={{ flex: 1 }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="text" className="input-field" placeholder="Remarks / Report No" value={inspectionForm.remarks} onChange={e => setInspectionForm({...inspectionForm, remarks: e.target.value})} style={{ flex: 1 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {editingInspectionId && (
                      <button className="btn btn-secondary" onClick={() => {
                        setEditingInspectionId(null);
                        setInspectionForm({ type: 'Stage', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], qtyOffered: '', qtyInspected: '', qtyAccepted: '', weight: '', remarks: '' });
                      }}>Cancel</button>
                    )}
                    <button className="btn btn-primary" onClick={handleAddInspection} style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>
                      {editingInspectionId ? 'Update Inspection' : 'Log Inspection'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Logged Inspections</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['All', 'Stage', 'Final'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setInspectionFilter(f)}
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '20px', 
                        border: 'none', 
                        fontSize: '0.8rem', 
                        fontWeight: '600',
                        cursor: 'pointer',
                        backgroundColor: inspectionFilter === f ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: inspectionFilter === f ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {inspections.filter(i => i.poNo === selectedPoNo && (inspectionFilter === 'All' || i.type === inspectionFilter)).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>No {inspectionFilter !== 'All' ? inspectionFilter.toLowerCase() : ''} inspections logged.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {/* Reverse map to show newest first */}
                    {[...inspections.filter(i => i.poNo === selectedPoNo && (inspectionFilter === 'All' || i.type === inspectionFilter))].reverse().map((insp) => (
                      <div key={insp.id} style={{ padding: '0.8rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', borderLeft: `3px solid ${insp.type === 'Final' ? 'var(--warning)' : 'var(--accent-primary)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600' }}>{insp.type} Inspection</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {insp.startDate === insp.endDate ? 
                                new Date(insp.startDate).toLocaleDateString() : 
                                `${new Date(insp.startDate).toLocaleDateString()} - ${new Date(insp.endDate).toLocaleDateString()}`
                              }
                            </span>
                            {currentUser?.role === 'superadmin' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditInspection(insp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => setConfirmModal({ isOpen: true, inspectionId: insp.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                          <span>Inspected: <strong>{insp.qtyInspected}</strong></span>
                          {insp.type === 'Stage' && insp.weight && <span style={{ color: 'var(--text-secondary)' }}>Weight: <strong>{insp.weight}</strong></span>}
                          {insp.type === 'Final' && <span style={{ color: 'var(--success)' }}>Accepted: <strong>{insp.qtyAccepted}</strong></span>}
                        </div>
                        {insp.remarks && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{insp.remarks}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Custom Modals */}
      <ConfirmModal 
        isOpen={alertModal.isOpen}
        title="Notice"
        message={alertModal.message}
        confirmText="Okay"
        confirmType="danger"
        onConfirm={() => setAlertModal({ isOpen: false, message: '' })}
      />
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Delete Inspection Log"
        message="Are you sure you want to permanently delete this inspection log? This action cannot be undone and will affect balance quantities."
        confirmText="Delete Log"
        confirmType="danger"
        onConfirm={() => {
          deleteInspection(confirmModal.inspectionId);
          setConfirmModal({ isOpen: false, inspectionId: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, inspectionId: null })}
      />

      <PromptModal 
        isOpen={promptModal.isOpen}
        title="Delete Schedule"
        message="Please provide a reason for deleting this delivery schedule:"
        placeholder="Enter reason..."
        confirmText="Delete Schedule"
        confirmType="danger"
        onConfirm={confirmRemoveSchedule}
        onCancel={() => setPromptModal({ isOpen: false, scheduleId: null })}
      />

    </div>
  );
};

export default Inspections;
