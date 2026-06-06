import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, FileText, DollarSign, Award, Calendar, AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react';
import { useBgLc } from '../context/BgLcContext';
import { usePO } from '../context/POContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

const BankGuaranteeLC = () => {
  const { lcs, bgs, addLC, deleteLC, addBG, deleteBG } = useBgLc();
  const { pos } = usePO();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('lc'); // 'lc' or 'bg'
  
  // Modals and form state
  const [showLcForm, setShowLcForm] = useState(false);
  const [editingLc, setEditingLc] = useState(null);
  const [showBgForm, setShowBgForm] = useState(false);
  const [editingBg, setEditingBg] = useState(null);
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '' });

  // Form input states - LC
  const [lcDateOfIssue, setLcDateOfIssue] = useState('');
  const [lcUsdAmount, setLcUsdAmount] = useState('');
  const [lcPaymentDueDays, setLcPaymentDueDays] = useState('');
  const [lcBlDate, setLcBlDate] = useState('');
  const [lcUsdToInrPrice, setLcUsdToInrPrice] = useState('');

  // Form input states - BG
  const [bgDateOfIssue, setBgDateOfIssue] = useState('');
  const [bgValidTill, setBgValidTill] = useState('');
  const [bgAmount, setBgAmount] = useState('');
  const [bgPoSelectionType, setBgPoSelectionType] = useState('existing'); // 'existing', 'custom', 'court_case'
  const [bgPoId, setBgPoId] = useState('');
  const [bgPoNo, setBgPoNo] = useState('');
  const [bgCourtCaseDetails, setBgCourtCaseDetails] = useState('');

  // Auxiliary formatting helpers
  const formatINR = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Date dynamic computations
  const getLcDueDate = (blDateStr, days) => {
    if (!blDateStr) return null;
    const date = new Date(blDateStr);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().split('T')[0];
  };

  const getDaysDiff = (targetDateStr) => {
    if (!targetDateStr) return 0;
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Financial Metrics Summaries
  const metrics = useMemo(() => {
    // LC Metrics
    let totalLcsUsd = 0;
    let totalLcsInr = 0;
    let activeLcsCount = 0;

    lcs.forEach(lc => {
      totalLcsUsd += lc.usdAmount;
      totalLcsInr += lc.usdAmount * lc.usdToInrPrice;
      const dueDate = getLcDueDate(lc.blDate, lc.paymentDueDays);
      if (dueDate && getDaysDiff(dueDate) >= 0) {
        activeLcsCount++;
      }
    });

    // BG Metrics
    let totalBgsAmount = 0;
    let activeBgsCount = 0;
    let totalCourtCaseAmount = 0;

    bgs.forEach(bg => {
      totalBgsAmount += bg.amount;
      const daysLeft = getDaysDiff(bg.validTill);
      if (daysLeft >= 0) {
        activeBgsCount++;
      }
      if (bg.isCourtCase) {
        totalCourtCaseAmount += bg.amount;
      }
    });

    return {
      totalLcsUsd,
      totalLcsInr,
      activeLcsCount,
      totalBgsAmount,
      activeBgsCount,
      totalCourtCaseAmount
    };
  }, [lcs, bgs]);

  // Form Handling - LC
  const handleOpenLcForm = (lc = null) => {
    if (lc) {
      setEditingLc(lc);
      setLcDateOfIssue(lc.dateOfIssue);
      setLcUsdAmount(lc.usdAmount);
      setLcPaymentDueDays(lc.paymentDueDays);
      setLcBlDate(lc.blDate);
      setLcUsdToInrPrice(lc.usdToInrPrice);
    } else {
      setEditingLc(null);
      setLcDateOfIssue('');
      setLcUsdAmount('');
      setLcPaymentDueDays('');
      setLcBlDate('');
      setLcUsdToInrPrice('');
    }
    setShowLcForm(true);
  };

  const handleSaveLc = async (e) => {
    e.preventDefault();
    const lcData = {
      id: editingLc?.id,
      dateOfIssue: lcDateOfIssue,
      usdAmount: Number(lcUsdAmount),
      paymentDueDays: Number(lcPaymentDueDays),
      blDate: lcBlDate,
      usdToInrPrice: Number(lcUsdToInrPrice)
    };

    const res = await addLC(lcData);
    if (res.success) {
      setShowLcForm(false);
    }
  };

  // Form Handling - BG
  const handleOpenBgForm = (bg = null) => {
    if (bg) {
      setEditingBg(bg);
      setBgDateOfIssue(bg.dateOfIssue);
      setBgValidTill(bg.validTill);
      setBgAmount(bg.amount);
      if (bg.isCourtCase) {
        setBgPoSelectionType('court_case');
        setBgCourtCaseDetails(bg.courtCaseDetails || '');
        setBgPoId('');
        setBgPoNo('');
      } else if (bg.poId) {
        setBgPoSelectionType('existing');
        setBgPoId(bg.poId);
        setBgPoNo('');
        setBgCourtCaseDetails('');
      } else {
        setBgPoSelectionType('custom');
        setBgPoNo(bg.poNo || '');
        setBgPoId('');
        setBgCourtCaseDetails('');
      }
    } else {
      setEditingBg(null);
      setBgDateOfIssue('');
      setBgValidTill('');
      setBgAmount('');
      setBgPoSelectionType('existing');
      setBgPoId(pos[0]?.id || '');
      setBgPoNo('');
      setBgCourtCaseDetails('');
    }
    setShowBgForm(true);
  };

  const handleSaveBg = async (e) => {
    e.preventDefault();
    const bgData = {
      id: editingBg?.id,
      dateOfIssue: bgDateOfIssue,
      validTill: bgValidTill,
      amount: Number(bgAmount),
      isCourtCase: bgPoSelectionType === 'court_case',
      courtCaseDetails: bgPoSelectionType === 'court_case' ? bgCourtCaseDetails : null,
      poId: bgPoSelectionType === 'existing' ? bgPoId : null,
      poNo: bgPoSelectionType === 'custom' ? bgPoNo : (bgPoSelectionType === 'existing' ? pos.find(p => p.id === bgPoId)?.poNo : null)
    };

    const res = await addBG(bgData);
    if (res.success) {
      setShowBgForm(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (deleteModal.type === 'lc') {
      await deleteLC(deleteModal.id);
    } else if (deleteModal.type === 'bg') {
      await deleteBG(deleteModal.id);
    }
    setDeleteModal({ isOpen: false, type: '', id: null, title: '' });
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Bank Guarantees & Letters of Credit</h1>
          <p>Monitor security guarantees, ongoing project LC periods, USD-INR exchange liabilities, and PSPCL court actions.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {activeTab === 'lc' ? (
            <button className="btn btn-primary" onClick={() => handleOpenLcForm()}>
              <Plus size={18} /> Create LC Entry
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => handleOpenBgForm()}>
              <Plus size={18} /> Create BG Entry
            </button>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
        <button 
          onClick={() => setActiveTab('lc')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'lc' ? '3px solid var(--accent-primary)' : '3px solid transparent',
            color: activeTab === 'lc' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Letters of Credit (LC)
        </button>
        <button 
          onClick={() => setActiveTab('bg')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'bg' ? '3px solid var(--accent-primary)' : '3px solid transparent',
            color: activeTab === 'bg' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Bank Guarantees (BG)
        </button>
      </div>

      {/* Dynamic Tab Layouts */}
      {activeTab === 'lc' ? (
        <div>
          {/* LC Metrics Panel */}
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={28} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Total Credit Volume</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{formatUSD(metrics.totalLcsUsd)}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Total INR Liability</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{formatINR(metrics.totalLcsInr)}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={28} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Active / Open LCs</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{metrics.activeLcsCount} active</h3>
              </div>
            </div>
          </div>

          {/* LCs List Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ISSUE DATE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CREDIT VALUE (USD)</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>BILL OF LADING DETAILS</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>USD/INR RATE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PAYMENT DUE DATE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>TOTAL VALUE DUE (INR)</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', width: '120px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {lcs.map((lc) => {
                  const dueDate = getLcDueDate(lc.blDate, lc.paymentDueDays);
                  const daysLeft = dueDate ? getDaysDiff(dueDate) : 0;
                  const totalInrValue = lc.usdAmount * lc.usdToInrPrice;

                  let dateBadgeColor = 'var(--text-secondary)';
                  let dateBadgeBg = 'var(--bg-tertiary)';
                  let dateLabel = `${daysLeft} days remaining`;

                  if (daysLeft < 0) {
                    dateBadgeColor = 'var(--danger)';
                    dateBadgeBg = 'rgba(239, 68, 68, 0.1)';
                    dateLabel = 'Overdue';
                  } else if (daysLeft <= 15) {
                    dateBadgeColor = 'var(--warning)';
                    dateBadgeBg = 'rgba(245, 158, 11, 0.1)';
                    dateLabel = `${daysLeft} days left (Critical)`;
                  }

                  return (
                    <tr key={lc.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        {formatDate(lc.dateOfIssue)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.05rem' }}>
                        {formatUSD(lc.usdAmount)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '500' }}>BL Date: {formatDate(lc.blDate)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Credit Term: {lc.paymentDueDays} days
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        {lc.usdToInrPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{formatDate(dueDate)}</div>
                        <div style={{
                          display: 'inline-block',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: dateBadgeColor,
                          backgroundColor: dateBadgeBg,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginTop: '0.3rem',
                          border: '1px solid var(--border-color)'
                        }}>
                          {dateLabel}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                        {formatINR(totalInrValue)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="icon-btn" title="Edit LC" onClick={() => handleOpenLcForm(lc)}>
                            <Edit size={16} />
                          </button>
                          <button className="icon-btn text-danger" style={{ color: 'var(--danger)' }} title="Delete LC" onClick={() => setDeleteModal({ isOpen: true, type: 'lc', id: lc.id, title: `LC of ${formatUSD(lc.usdAmount)}` })}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {lcs.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <FileText size={48} style={{ opacity: 0.15, margin: '0 auto 1rem auto' }} />
                      <p style={{ margin: 0 }}>No Letters of Credit listed. Create a new entry to begin tracking.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {/* BG Metrics Panel */}
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={28} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Total BG Value</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{formatINR(metrics.totalBgsAmount)}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={28} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>PSPCL Court Guarantees</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{formatINR(metrics.totalCourtCaseAmount)}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Active / Open Guarantees</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{metrics.activeBgsCount} active</h3>
              </div>
            </div>
          </div>

          {/* BGs List Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>GUARANTEE VALUE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DATE OF ISSUE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>VALIDITY DATE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>LIFETIME REMAINING</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>FAVOUR OF & SCOPE</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', width: '120px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bgs.map((bg) => {
                  const daysLeft = getDaysDiff(bg.validTill);
                  
                  let dateBadgeColor = 'var(--success)';
                  let dateBadgeBg = 'rgba(16, 185, 129, 0.1)';
                  let dateLabel = `${daysLeft} days left`;

                  if (daysLeft < 0) {
                    dateBadgeColor = 'var(--danger)';
                    dateBadgeBg = 'rgba(239, 68, 68, 0.1)';
                    dateLabel = 'Expired';
                  } else if (daysLeft <= 30) {
                    dateBadgeColor = 'var(--warning)';
                    dateBadgeBg = 'rgba(245, 158, 11, 0.1)';
                    dateLabel = `${daysLeft} days left (Expiring)`;
                  }

                  // Linked PO description details
                  let targetPoDetails = 'Unlinked';
                  if (bg.isCourtCase) {
                    targetPoDetails = 'PSPCL Court Action';
                  } else if (bg.poId) {
                    const matchedPO = pos.find(p => p.id === bg.poId);
                    targetPoDetails = matchedPO ? `PO: ${matchedPO.poNo} (${matchedPO.capacity})` : `PO ID: ${bg.poId}`;
                  } else if (bg.poNo) {
                    targetPoDetails = `Completed PO: ${bg.poNo}`;
                  }

                  return (
                    <tr key={bg.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                        {formatINR(bg.amount)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        {formatDate(bg.dateOfIssue)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>
                        {formatDate(bg.validTill)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'inline-block',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: dateBadgeColor,
                          backgroundColor: dateBadgeBg,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}>
                          {dateLabel}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: bg.isCourtCase ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {bg.isCourtCase ? 'PSPCL Court Case' : 'Project Security Bond'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {targetPoDetails}
                        </div>
                        {bg.courtCaseDetails && (
                          <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '0.3rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.3rem', borderRadius: '4px' }}>
                            Scope: {bg.courtCaseDetails}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="icon-btn" title="Edit BG" onClick={() => handleOpenBgForm(bg)}>
                            <Edit size={16} />
                          </button>
                          <button className="icon-btn text-danger" style={{ color: 'var(--danger)' }} title="Delete BG" onClick={() => setDeleteModal({ isOpen: true, type: 'bg', id: bg.id, title: `BG of ${formatINR(bg.amount)}` })}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bgs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Award size={48} style={{ opacity: 0.15, margin: '0 auto 1rem auto' }} />
                      <p style={{ margin: 0 }}>No Bank Guarantees listed. Create a new entry to begin tracking.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - LC Form */}
      {showLcForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', animation: 'scale-up 0.2s ease' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={22} className="text-accent" /> {editingLc ? 'Edit Letter of Credit' : 'Create Letter of Credit'}
            </h2>
            <form onSubmit={handleSaveLc}>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Date of Issue</label>
                <input 
                  type="date" 
                  value={lcDateOfIssue} 
                  onChange={(e) => setLcDateOfIssue(e.target.value)} 
                  className="input-field" 
                  style={{ width: '100%', marginBottom: 0 }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>USD Amount</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 50000" 
                  value={lcUsdAmount} 
                  onChange={(e) => setLcUsdAmount(e.target.value)} 
                  className="input-field" 
                  style={{ width: '100%', marginBottom: 0 }} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>BL Date</label>
                  <input 
                    type="date" 
                    value={lcBlDate} 
                    onChange={(e) => setLcBlDate(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0 }} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Credit Period (Days)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 90" 
                    value={lcPaymentDueDays} 
                    onChange={(e) => setLcPaymentDueDays(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0 }} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>USD to INR Conversion Price</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  placeholder="e.g. 83.45" 
                  value={lcUsdToInrPrice} 
                  onChange={(e) => setLcUsdToInrPrice(e.target.value)} 
                  className="input-field" 
                  style={{ width: '100%', marginBottom: 0 }} 
                  required 
                />
              </div>

              {lcUsdAmount && lcUsdToInrPrice && (
                <div style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated INR Due:</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{formatINR(Number(lcUsdAmount) * Number(lcUsdToInrPrice))}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLcForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save LC Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - BG Form */}
      {showBgForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', animation: 'scale-up 0.2s ease' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} className="text-accent" /> {editingBg ? 'Edit Bank Guarantee' : 'Create Bank Guarantee'}
            </h2>
            <form onSubmit={handleSaveBg}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Date of Issue</label>
                  <input 
                    type="date" 
                    value={bgDateOfIssue} 
                    onChange={(e) => setBgDateOfIssue(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0 }} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Valid Till</label>
                  <input 
                    type="date" 
                    value={bgValidTill} 
                    onChange={(e) => setBgValidTill(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0 }} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>BG Guarantee Amount (INR)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 250000" 
                  value={bgAmount} 
                  onChange={(e) => setBgAmount(e.target.value)} 
                  className="input-field" 
                  style={{ width: '100%', marginBottom: 0 }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Guarantee Scope / Favour</label>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.3rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      value="existing" 
                      checked={bgPoSelectionType === 'existing'} 
                      onChange={() => setBgPoSelectionType('existing')} 
                    /> Active PO
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      value="custom" 
                      checked={bgPoSelectionType === 'custom'} 
                      onChange={() => setBgPoSelectionType('custom')} 
                    /> Completed PO
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--danger)' }}>
                    <input 
                      type="radio" 
                      value="court_case" 
                      checked={bgPoSelectionType === 'court_case'} 
                      onChange={() => setBgPoSelectionType('court_case')} 
                    /> Court Case (PSPCL)
                  </label>
                </div>
              </div>

              {bgPoSelectionType === 'existing' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Select Active PO</label>
                  {pos.length > 0 ? (
                    <select 
                      value={bgPoId} 
                      onChange={(e) => setBgPoId(e.target.value)} 
                      className="input-field" 
                      style={{ width: '100%', marginBottom: 0 }}
                      required
                    >
                      <option value="">-- Choose Purchase Order --</option>
                      {pos.map(p => (
                        <option key={p.id} value={p.id}>{p.poNo} ({p.companyName} - {p.capacity})</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px' }}>
                      No active POs in database. Choose another scope.
                    </div>
                  )}
                </div>
              )}

              {bgPoSelectionType === 'custom' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Enter Completed PO Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PO-8849/Completed" 
                    value={bgPoNo} 
                    onChange={(e) => setBgPoNo(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0 }} 
                    required 
                  />
                </div>
              )}

              {bgPoSelectionType === 'court_case' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Court Case Case/Claim Details</label>
                  <textarea 
                    placeholder="Describe court claim details, case no, or PSPCL specific terms..." 
                    value={bgCourtCaseDetails} 
                    onChange={(e) => setBgCourtCaseDetails(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0, minHeight: '80px', fontFamily: 'inherit', padding: '0.6rem' }} 
                    required 
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBgForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save BG Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'lc' ? 'Delete Letter of Credit Entry' : 'Delete Bank Guarantee Entry'}
        message={`Are you sure you want to permanently delete this ${deleteModal.type === 'lc' ? 'LC' : 'BG'} record ("${deleteModal.title}")? This action cannot be undone.`}
        confirmText="Confirm Delete"
        confirmType="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, type: '', id: null, title: '' })}
      />
    </div>
  );
};

export default BankGuaranteeLC;
