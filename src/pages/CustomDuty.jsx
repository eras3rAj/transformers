import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Percent, Info, DollarSign, Activity } from 'lucide-react';
import { useCustomDuty } from '../context/CustomDutyContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

const CustomDuty = () => {
  const { customDuties, addCustomDuty, deleteCustomDuty } = useCustomDuty();
  const { currentUser } = useAuth();

  // Modals and form state
  const [showForm, setShowForm] = useState(false);
  const [editingDuty, setEditingDuty] = useState(null);
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });

  // Form input states
  const [title, setTitle] = useState('');
  const [importSource, setImportSource] = useState('China'); // 'China', 'Japan'
  const [currency, setCurrency] = useState('USD'); // 'USD', 'INR'
  const [exchangeRate, setExchangeRate] = useState('83.50');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [seaFreight, setSeaFreight] = useState('');
  const [insurance, setInsurance] = useState('');

  // Auxiliary formatting helpers
  const formatINR = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculation Math Logic (Reusable for Row rendering and Live Preview)
  const calculateTaxes = (source, curr, rate, invoice, freight, ins) => {
    const rateNum = curr === 'USD' ? Number(rate || 1) : 1;
    const invNum = Number(invoice || 0);
    const freightNum = Number(freight || 0);
    const insNum = Number(ins || 0);

    const assessmentOriginal = invNum + freightNum + insNum;
    const assessmentINR = assessmentOriginal * rateNum;

    let cd = 0;
    let bcd = 0;
    let gst = 0;

    if (source === 'China') {
      cd = 0.10 * assessmentINR;
      bcd = 0.05 * (assessmentINR + cd);
      gst = 0.18 * (assessmentINR + cd + bcd);
    } else if (source === 'Japan') {
      cd = 0;
      bcd = 0;
      gst = 0.18 * assessmentINR;
    }

    const totalDuty = cd + bcd + gst;
    const landedCost = assessmentINR + totalDuty;

    return {
      assessmentOriginal,
      assessmentINR,
      cd,
      bcd,
      gst,
      totalDuty,
      landedCost
    };
  };

  // Global Metrics Panel
  const metrics = useMemo(() => {
    let totalDutyPaid = 0;
    let totalAssessmentValue = 0;
    let count = customDuties.length;

    customDuties.forEach(d => {
      const taxes = calculateTaxes(d.importSource, d.currency, d.exchangeRate, d.invoiceValue, d.seaFreight, d.insurance);
      totalDutyPaid += taxes.totalDuty;
      totalAssessmentValue += taxes.assessmentINR;
    });

    const averageRate = totalAssessmentValue > 0 ? (totalDutyPaid / totalAssessmentValue) * 100 : 0;

    return {
      totalDutyPaid,
      totalAssessmentValue,
      count,
      averageRate
    };
  }, [customDuties]);

  // Live real-time calculations based on active form state
  const livePreview = useMemo(() => {
    return calculateTaxes(importSource, currency, exchangeRate, invoiceValue, seaFreight, insurance);
  }, [importSource, currency, exchangeRate, invoiceValue, seaFreight, insurance]);

  // Form Handling
  const handleOpenForm = (duty = null) => {
    if (duty) {
      setEditingDuty(duty);
      setTitle(duty.title);
      setImportSource(duty.importSource);
      setCurrency(duty.currency);
      setExchangeRate(String(duty.exchangeRate));
      setInvoiceValue(String(duty.invoiceValue));
      setSeaFreight(String(duty.seaFreight));
      setInsurance(String(duty.insurance));
    } else {
      setEditingDuty(null);
      setTitle('');
      setImportSource('China');
      setCurrency('USD');
      setExchangeRate('83.50');
      setInvoiceValue('');
      setSeaFreight('');
      setInsurance('');
    }
    setShowForm(true);
  };

  const handleSaveDuty = async (e) => {
    e.preventDefault();
    const dutyData = {
      id: editingDuty?.id,
      title,
      importSource,
      currency,
      exchangeRate: currency === 'USD' ? Number(exchangeRate) : 1.0,
      invoiceValue: Number(invoiceValue),
      seaFreight: Number(seaFreight),
      insurance: Number(insurance)
    };

    const res = await addCustomDuty(dutyData);
    if (res.success) {
      setShowForm(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (deleteModal.id) {
      await deleteCustomDuty(deleteModal.id);
    }
    setDeleteModal({ isOpen: false, id: null, title: '' });
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Custom Duty Calculator</h1>
          <p>Compute and record customs clearing duties, Basic Custom Duty (BCD), and import GST on materials from China and Japan.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Calculate New Duty
          </button>
        </div>
      </div>

      {/* Global Metrics Panels */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Percent size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Total Custom Duty paid</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{formatINR(metrics.totalDutyPaid)}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Total Imports Assessment</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{formatINR(metrics.totalAssessmentValue)}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Average Duty Rate</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>{metrics.averageRate.toFixed(2)}% average</h3>
          </div>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>SHIPMENT / ITEM</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ORIGIN & DATE</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DECLARED VALUE</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ASSESSMENT VALUE (INR)</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DUTY BREAKDOWN (INR)</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>TOTAL DUTY</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', width: '120px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {customDuties.map((d) => {
              const taxes = calculateTaxes(d.importSource, d.currency, d.exchangeRate, d.invoiceValue, d.seaFreight, d.insurance);
              
              return (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                  <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {d.title}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: d.importSource === 'China' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: d.importSource === 'China' ? 'var(--danger)' : 'var(--accent-primary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '0.3rem',
                      border: '1px solid var(--border-color)'
                    }}>
                      {d.importSource}
                    </div>
                    <div style={{ fontSize: '0.8-rem', color: 'var(--text-muted)' }}>{formatDate(d.createdAt)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.9rem' }}>Invoice: {d.currency === 'USD' ? formatUSD(d.invoiceValue) : formatINR(d.invoiceValue)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Freight: {d.currency === 'USD' ? formatUSD(d.seaFreight) : formatINR(d.seaFreight)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Insurance: {d.currency === 'USD' ? formatUSD(d.insurance) : formatINR(d.insurance)}</div>
                    {d.currency === 'USD' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                        Rate: 1 USD = {d.exchangeRate.toFixed(2)} INR
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {formatINR(taxes.assessmentINR)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {d.importSource === 'China' ? (
                      <>
                        <div style={{ fontSize: '0.85rem' }}>CD (10%): <strong style={{ color: 'var(--text-primary)' }}>{formatINR(taxes.cd)}</strong></div>
                        <div style={{ fontSize: '0.85rem' }}>BCD (5%): <strong style={{ color: 'var(--text-primary)' }}>{formatINR(taxes.bcd)}</strong></div>
                        <div style={{ fontSize: '0.85rem' }}>GST (18%): <strong style={{ color: 'var(--text-primary)' }}>{formatINR(taxes.gst)}</strong></div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CD (0%): {formatINR(0)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>BCD (0%): {formatINR(0)}</div>
                        <div style={{ fontSize: '0.85rem' }}>GST (18%): <strong style={{ color: 'var(--text-primary)' }}>{formatINR(taxes.gst)}</strong></div>
                      </>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--danger)', fontSize: '1.1rem' }}>
                      {formatINR(taxes.totalDuty)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Landed: {formatINR(taxes.landedCost)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="icon-btn" title="Edit Calculation" onClick={() => handleOpenForm(d)}>
                        <Edit size={16} />
                      </button>
                      <button className="icon-btn text-danger" style={{ color: 'var(--danger)' }} title="Delete" onClick={() => setDeleteModal({ isOpen: true, id: d.id, title: d.title })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {customDuties.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Percent size={48} style={{ opacity: 0.15, margin: '0 auto 1rem auto' }} />
                  <p style={{ margin: 0 }}>No Custom Duty calculations logged. Open the calculator to begin.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - Calculation Form */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', padding: '2rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', animation: 'scale-up 0.2s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Left side: Inputs */}
            <div>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Percent size={22} className="text-accent" /> {editingDuty ? 'Edit Custom Duty Entry' : 'Custom Duty Calculator'}
              </h2>
              <form onSubmit={handleSaveDuty}>
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Shipment / Item Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Copper wire coil shipment" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="input-field" 
                    style={{ width: '100%', marginBottom: 0 }} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Import Origin</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="importSource" 
                          value="China" 
                          checked={importSource === 'China'} 
                          onChange={() => setImportSource('China')} 
                        /> China
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="importSource" 
                          value="Japan" 
                          checked={importSource === 'Japan'} 
                          onChange={() => setImportSource('Japan')} 
                        /> Japan
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Billing Currency</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="currency" 
                          value="USD" 
                          checked={currency === 'USD'} 
                          onChange={() => setCurrency('USD')} 
                        /> USD ($)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="currency" 
                          value="INR" 
                          checked={currency === 'INR'} 
                          onChange={() => setCurrency('INR')} 
                        /> INR (₹)
                      </label>
                    </div>
                  </div>
                </div>

                {currency === 'USD' && (
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Exchange Rate (USD to INR)</label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      placeholder="e.g. 83.50" 
                      value={exchangeRate} 
                      onChange={(e) => setExchangeRate(e.target.value)} 
                      className="input-field" 
                      style={{ width: '100%', marginBottom: 0 }} 
                      required 
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '600' }}>Invoice Value</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Invoice" 
                      value={invoiceValue} 
                      onChange={(e) => setInvoiceValue(e.target.value)} 
                      className="input-field" 
                      style={{ width: '100%', marginBottom: 0 }} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '600' }}>Sea Freight</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Freight" 
                      value={seaFreight} 
                      onChange={(e) => setSeaFreight(e.target.value)} 
                      className="input-field" 
                      style={{ width: '100%', marginBottom: 0 }} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '600' }}>Insurance</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Insurance" 
                      value={insurance} 
                      onChange={(e) => setInsurance(e.target.value)} 
                      className="input-field" 
                      style={{ width: '100%', marginBottom: 0 }} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Calculations</button>
                </div>
              </form>
            </div>

            {/* Right side: Real-time Live Preview Panel */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={16} className="text-accent" /> Live Calculation Breakdown
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Declared Sum ({currency}):</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {currency === 'USD' ? formatUSD(livePreview.assessmentOriginal) : formatINR(livePreview.assessmentOriginal)}
                    </strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assessment Value (INR):</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatINR(livePreview.assessmentINR)}</strong>
                  </div>

                  {importSource === 'China' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Custom Duty (CD @ 10%):</span>
                        <strong>{formatINR(livePreview.cd)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Basic Custom Duty (BCD @ 5%):</span>
                        <strong>{formatINR(livePreview.bcd)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>(on Assessment + CD)</span>
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{formatINR(livePreview.assessmentINR + livePreview.cd)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Import GST (@ 18%):</span>
                        <strong>{formatINR(livePreview.gst)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>(on Assessment + CD + BCD)</span>
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{formatINR(livePreview.assessmentINR + livePreview.cd + livePreview.bcd)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Custom Duty (CD @ 0%):</span>
                        <span>{formatINR(0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Basic Custom Duty (BCD @ 0%):</span>
                        <span>{formatINR(0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Import GST (@ 18%):</span>
                        <strong>{formatINR(livePreview.gst)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>(on Assessment Value)</span>
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{formatINR(livePreview.assessmentINR)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>TOTAL DUTY DUE:</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>{formatINR(livePreview.totalDuty)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Final Landed Cost:</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatINR(livePreview.landedCost)}</strong>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Custom Duty Entry"
        message={`Are you sure you want to permanently delete custom duty calculation "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Confirm Delete"
        confirmType="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
      />
    </div>
  );
};

export default CustomDuty;
