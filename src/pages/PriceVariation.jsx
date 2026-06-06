import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Plus, TrendingUp, FileText, Check, X, Edit, Calendar, TrendingDown, ChevronDown } from 'lucide-react';
import PVCalculatorModal from '../components/pv/PVCalculatorModal';
import { usePV } from '../context/PVContext';
import { usePO } from '../context/POContext';
import { useAuth } from '../context/AuthContext';
import { calculatePVFinancials } from '../utils/pvCalculator';
import '../components/layout/Layout.css';

const PriceVariation = () => {
  const { indices, addIndex, updateIndex, getIndexByMonth } = usePV();
  const { pos, addPO, boards, addBoard, capacities, addCapacity, gstRates, addGstRate } = usePO();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('contracts'); // 'rates' or 'contracts'
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndexId, setEditingIndexId] = useState(null);

  const [showAddPOForm, setShowAddPOForm] = useState(false);
  const [activePoForCalc, setActivePoForCalc] = useState(null);

  const [formData, setFormData] = useState({ month: '', al: '', cu: '', crgo: '', steel315: '', insulating3: '', oil: '', cpi: '' });
  const [poFormData, setPoFormData] = useState({ 
    poNo: '', utilityBoard: '', conductorType: 'Aluminium', capacity: '', baseMonthStr: '', exWorks: '', freight: '', gstRate: '18', quantity: 1 
  });
  
  const [addingNew, setAddingNew] = useState({ board: false, capacity: false, gstRate: false, poNo: false });
  const [newValues, setNewValues] = useState({ board: '', capacity: '', gstRate: '', poNo: '' });

  const [pendingPO, setPendingPO] = useState(null);

  // Derive unique years from indices for the filter
  const availableYears = useMemo(() => {
    if (!indices || !Array.isArray(indices)) return [];
    const years = indices.map(i => {
      const parts = (i?.month || '').split(' ');
      return parts[parts.length - 1];
    }).filter(y => y && !isNaN(parseInt(y)));
    return [...new Set(years)].sort((a, b) => parseInt(b) - parseInt(a));
  }, [indices]);

  const latestIndex = useMemo(() => {
    if (!indices || !Array.isArray(indices) || indices.length === 0) return null;
    const monthOrder = { 'January':0, 'February':1, 'March':2, 'April':3, 'May':4, 'June':5, 'July':6, 'August':7, 'September':8, 'October':9, 'November':10, 'December':11 };
    return [...indices].sort((a, b) => {
      const [m1, y1] = (a?.month || '').split(' ');
      const [m2, y2] = (b?.month || '').split(' ');
      
      const year1 = parseInt(y1) || 0;
      const year2 = parseInt(y2) || 0;
      
      if (year1 !== year2) return year2 - year1;
      return (monthOrder[m2] || 0) - (monthOrder[m1] || 0);
    })[0];
  }, [indices]);

  // Set default year if not in list
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Sort year data chronologically
  const yearDataSorted = useMemo(() => {
    if (!indices || !Array.isArray(indices)) return [];
    const yearData = indices.filter(i => (i?.month || '').includes(selectedYear));
    const monthOrder = { 'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12 };

    return yearData.sort((a, b) => {
      const m1 = (a?.month || '').split(' ')[0];
      const m2 = (b?.month || '').split(' ')[0];
      return (monthOrder[m1] || 0) - (monthOrder[m2] || 0);
    });
  }, [indices, selectedYear]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePoInputChange = (e) => {
    const { name, value } = e.target;
    if (value === '__NEW__') {
      const typeKey = name === 'utilityBoard' ? 'board' : name === 'capacity' ? 'capacity' : name === 'gstRate' ? 'gstRate' : name === 'poNo' ? 'poNo' : name;
      setAddingNew(prev => ({ ...prev, [typeKey]: true }));
      setPoFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      if (name === 'poNo') {
        const selectedPo = pos.find(p => p.poNo === value);
        if (selectedPo) {
          setPoFormData({ ...selectedPo });
          return;
        }
      }
      setPoFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddNew = (type) => {
    const val = newValues[type].trim();
    if (val) {
      if (type === 'board') { addBoard(val); setPoFormData(prev => ({ ...prev, utilityBoard: val })); }
      if (type === 'capacity') { addCapacity(val); setPoFormData(prev => ({ ...prev, capacity: val })); }
      if (type === 'gstRate') { addGstRate(val); setPoFormData(prev => ({ ...prev, gstRate: val })); }
      if (type === 'poNo') { setPoFormData(prev => ({ ...prev, poNo: val })); }
    }
    setAddingNew(prev => ({ ...prev, [type]: false }));
    setNewValues(prev => ({ ...prev, [type]: '' }));
  };

  const finalizePO = (monthString) => {
    const newPO = {
      poNo: poFormData.poNo,
      utilityBoard: poFormData.utilityBoard,
      conductorType: poFormData.conductorType,
      capacity: poFormData.capacity,
      quantity: parseInt(poFormData.quantity) || 1,
      baseMonthStr: monthString || poFormData.baseMonthStr,
      exWorks: parseFloat(poFormData.exWorks) || 0,
      freight: parseFloat(poFormData.freight) || 0,
      gstRate: parseFloat(poFormData.gstRate) || 18,
    };
    addPO(newPO);
    setShowAddPOForm(false);
    setPoFormData({ poNo: '', utilityBoard: '', conductorType: 'Aluminium', capacity: '', baseMonthStr: '', exWorks: '', freight: '', gstRate: '18', quantity: 1 });
    setPendingPO(null);
  };

  const handleAddPO = (e) => {
    e.preventDefault();
    const existingMonth = getIndexByMonth(poFormData.baseMonthStr);
    
    if (!existingMonth) {
      setPendingPO(true);
      setFormData(prev => ({ ...prev, month: poFormData.baseMonthStr })); 
      setShowAddForm(true);
      return; 
    }
    finalizePO(existingMonth.month);
  };

  const openEditForm = (item) => {
    setEditingIndexId(item.id);
    setFormData({
      month: item.month,
      al: item.al, cu: item.cu, crgo: item.crgo,
      steel315: item.steel315, insulating3: item.insulating3,
      oil: item.oil, cpi: item.cpi
    });
    setShowAddForm(true);
  };

  const handleAddIndex = async (e) => {
    e.preventDefault();
    const parsedData = {
      month: formData.month,
      al: parseFloat(formData.al) || 0, 
      cu: parseFloat(formData.cu) || 0,
      crgo: parseFloat(formData.crgo) || 0, 
      steel315: parseFloat(formData.steel315) || 0, 
      insulating3: parseFloat(formData.insulating3) || 0,
      oil: parseFloat(formData.oil) || 0,
      cpi: parseFloat(formData.cpi) || 0,
      fixed: 100
    };

    let savedMonthStr = parsedData.month;

    if (editingIndexId) {
      await updateIndex(editingIndexId, parsedData);
    } else {
      const savedIndex = await addIndex(parsedData);
      if (savedIndex) savedMonthStr = savedIndex.month;
    }
    
    setShowAddForm(false);
    setEditingIndexId(null);
    setFormData({ month: '', al: '', cu: '', crgo: '', steel315: '', insulating3: '', oil: '', cpi: '' });

    if (pendingPO) finalizePO(savedMonthStr);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={28} color="var(--accent-primary)" />
            Price Variation (PV) System
          </h1>
          <p>Track IEEMA indices, manage historical rates, and calculate PV for active contracts.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('rates')} 
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'rates' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'rates' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', transition: 'var(--transition)' }}
        >
          Monthly Rates Database
        </button>
        <button 
          onClick={() => setActiveTab('contracts')} 
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'contracts' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'contracts' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', transition: 'var(--transition)' }}
        >
          PV Calculator & Contracts
        </button>
      </div>

      {/* TAB 1: MONTHLY RATES */}
      {activeTab === 'rates' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>IEEMA Circular Rates</h3>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', minWidth: '100px', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{selectedYear}</span>
                  </div>
                  <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isYearDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition)' }} />
                </div>
                
                {isYearDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                    {availableYears.map(y => (
                      <div 
                        key={y} 
                        onClick={() => { setSelectedYear(y); setIsYearDropdownOpen(false); }}
                        style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontWeight: '500', color: selectedYear === y ? 'var(--accent-primary)' : 'var(--text-primary)', backgroundColor: selectedYear === y ? 'var(--bg-tertiary)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}
                        onMouseEnter={(e) => { if (selectedYear !== y) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={(e) => { if (selectedYear !== y) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {currentUser?.role === 'superadmin' && (
              <button className="btn btn-secondary" onClick={() => { setEditingIndexId(null); setShowAddForm(true); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Monthly Rates
              </button>
            )}
          </div>
          
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem', borderTop: '3px solid var(--accent-primary)' }}>
            <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.8rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>MONTH</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALUMINIUM</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CRGO</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STEEL</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>INSULATING</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>OIL</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPI</th>
                    {currentUser?.role === 'superadmin' && (
                      <th style={{ padding: '0.8rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {yearDataSorted.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No indices found for {selectedYear}.</td>
                    </tr>
                  ) : (
                    yearDataSorted.map((item) => (
                      <tr key={item.id || Math.random()} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                        <td style={{ padding: '0.8rem 1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.month || '—'}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>₹{Number(item.al || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>₹{Number(item.crgo || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>₹{Number(item.steel315 || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>₹{Number(item.insulating3 || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>₹{Number(item.oil || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>{Number(item.cpi || 0).toFixed(2)}</td>
                        {currentUser?.role === 'superadmin' && (
                          <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right' }}>
                            <button onClick={() => openEditForm(item)} className="icon-btn" style={{ padding: '0.4rem', color: 'var(--text-muted)' }} title="Edit Rates">
                              <Edit size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>Active Purchase Orders</h3>
            <button className="btn btn-primary" onClick={() => navigate('/purchase-orders?create=true')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Purchase Order
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: '3px solid var(--accent-primary)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PO DETAILS</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>BASE MONTH</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>LATEST MONTH</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>BASE TOTAL</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>LATEST PV TOTAL</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {(pos || []).map((po, index) => {
                    const baseData = po.baseMonthStr ? getIndexByMonth(po.baseMonthStr) : null;
                    const calcResult = (baseData && latestIndex) ? calculatePVFinancials(po, baseData, latestIndex) : null;
                    const baseTotal = po.exWorks + po.freight + ((po.exWorks + po.freight) * (po.gstRate / 100));
                    
                    return (
                    <tr key={po.id || `po-${index}`} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={16} color="var(--accent-primary)" />{po.poNo || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{po.capacity || '—'} | Qty: {po.quantity || 1}</div>
                      </td>
                      <td style={{ padding: '1rem' }}><span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{po.baseMonthStr || '—'}</span></td>
                      <td style={{ padding: '1rem' }}><span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500' }}>{latestIndex ? latestIndex.month : '—'}</span></td>
                      <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-muted)' }}>₹{Number(baseTotal || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>
                        {calcResult ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>₹{Number(calcResult.newTotal || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                            {Number(calcResult.totalDiff) > 0 ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)', fontSize: '0.85rem' }} title={`+${calcResult.percentageChange}% (Ex-Works)`}>
                                <TrendingUp size={14} /> +{calcResult.percentageChange}%
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--danger)', fontSize: '0.85rem' }} title={`${calcResult.percentageChange}% (Ex-Works)`}>
                                <TrendingDown size={14} /> {calcResult.percentageChange}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button className="btn btn-primary" onClick={() => setActivePoForCalc(po)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                          <Calculator size={14} style={{ marginRight: '4px' }} /> View Details
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '750px', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: pendingPO ? 'var(--danger)' : 'inherit' }}>
              {pendingPO ? 'Missing IEEMA Rates Detected' : (editingIndexId ? 'Edit IEEMA Circular Rates' : 'Add IEEMA Circular Rates')}
            </h3>
            {pendingPO && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You entered a Base Month that doesn't exist in the database yet. Please provide the rates for this month to continue saving the PO.</p>}
            
            <form onSubmit={handleAddIndex}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Month & Year (e.g. January 2026)</label>
                <input type="text" name="month" value={formData.month} onChange={handleInputChange} className="input-field" required readOnly={pendingPO || editingIndexId} style={(pendingPO || editingIndexId) ? { backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' } : {}} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><label className="input-label">Aluminium</label><input type="number" step="0.01" name="al" value={formData.al} onChange={handleInputChange} className="input-field" required autoFocus /></div>
                <div><label className="input-label">Copper</label><input type="number" step="0.01" name="cu" value={formData.cu} onChange={handleInputChange} className="input-field" required /></div>
                <div><label className="input-label">CRGO</label><input type="number" step="0.01" name="crgo" value={formData.crgo} onChange={handleInputChange} className="input-field" required /></div>
                <div><label className="input-label">Steel (3.15mm)</label><input type="number" step="0.01" name="steel315" value={formData.steel315} onChange={handleInputChange} className="input-field" required /></div>
                <div><label className="input-label">Insulating Mat. (3mm)</label><input type="number" step="0.01" name="insulating3" value={formData.insulating3} onChange={handleInputChange} className="input-field" required /></div>
                <div><label className="input-label">Transformer Oil</label><input type="number" step="0.01" name="oil" value={formData.oil} onChange={handleInputChange} className="input-field" required /></div>
                <div><label className="input-label">Consumer Price Index</label><input type="number" step="0.01" name="cpi" value={formData.cpi} onChange={handleInputChange} className="input-field" required /></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddForm(false); setPendingPO(null); setEditingIndexId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingIndexId ? 'Update Rates' : 'Save Rates'} {pendingPO ? '& Resume PO' : ''}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPOForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 900, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '650px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Add Global Purchase Order</h3>
              <button type="button" onClick={() => setShowAddPOForm(false)} className="icon-btn"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddPO}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="input-label">PO Number</label>
                    {addingNew.poNo && <button type="button" onClick={() => setAddingNew({...addingNew, poNo: false})} className="icon-btn" style={{ padding: 0, color: 'var(--danger)' }}><X size={14}/></button>}
                  </div>
                  {addingNew.poNo ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" autoFocus value={newValues.poNo} onChange={(e) => setNewValues({...newValues, poNo: e.target.value})} className="input-field" placeholder="New PO Number" style={{ marginBottom: 0 }} />
                      <button type="button" onClick={() => handleAddNew('poNo')} className="btn btn-primary" style={{ padding: '0 0.5rem' }}><Check size={18} /></button>
                    </div>
                  ) : (
                    <select name="poNo" value={poFormData.poNo} onChange={handlePoInputChange} className="input-field" required>
                      <option value="">-- Select PO --</option>
                      {pos.map(p => <option key={p.id} value={p.poNo}>{p.poNo}</option>)}
                      <option value="__NEW__" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+ Add New PO Number...</option>
                    </select>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="input-label">Utility Board</label>
                    {addingNew.board && <button type="button" onClick={() => setAddingNew({...addingNew, board: false})} className="icon-btn" style={{ padding: 0, color: 'var(--danger)' }}><X size={14}/></button>}
                  </div>
                  {addingNew.board ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" autoFocus value={newValues.board} onChange={(e) => setNewValues({...newValues, board: e.target.value})} className="input-field" placeholder="New Board Name" style={{ marginBottom: 0 }} />
                      <button type="button" onClick={() => handleAddNew('board')} className="btn btn-primary" style={{ padding: '0 0.5rem' }}><Check size={18} /></button>
                    </div>
                  ) : (
                    <select name="utilityBoard" value={poFormData.utilityBoard} onChange={handlePoInputChange} className="input-field" required>
                      <option value="">-- Select Board --</option>
                      {boards.map(b => <option key={b} value={b}>{b}</option>)}
                      <option value="__NEW__" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+ Add New Board...</option>
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="input-label">Capacity (Rating)</label>
                    {addingNew.capacity && <button type="button" onClick={() => setAddingNew({...addingNew, capacity: false})} className="icon-btn" style={{ padding: 0, color: 'var(--danger)' }}><X size={14}/></button>}
                  </div>
                  {addingNew.capacity ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" autoFocus value={newValues.capacity} onChange={(e) => setNewValues({...newValues, capacity: e.target.value})} className="input-field" placeholder="e.g. 750kVA" style={{ marginBottom: 0 }} />
                      <button type="button" onClick={() => handleAddNew('capacity')} className="btn btn-primary" style={{ padding: '0 0.5rem' }}><Check size={18} /></button>
                    </div>
                  ) : (
                    <select name="capacity" value={poFormData.capacity} onChange={handlePoInputChange} className="input-field" required>
                      <option value="">-- Select Rating --</option>
                      {capacities.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="__NEW__" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+ Add New Rating...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="input-label">Conductor Type</label>
                  <select name="conductorType" value={poFormData.conductorType} onChange={handlePoInputChange} className="input-field" required>
                    <option value="Aluminium">Aluminium</option>
                    <option value="Copper">Copper</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="input-label">Base Month (e.g. April 2026)</label>
                  <input type="text" name="baseMonthStr" list="month-suggestions" value={poFormData.baseMonthStr} onChange={handlePoInputChange} className="input-field" placeholder="Type month..." required />
                  <datalist id="month-suggestions">{indices.map(i => <option key={i.id} value={i.month} />)}</datalist>
                </div>
                <div>
                  <label className="input-label">Quantity</label>
                  <input type="number" name="quantity" value={poFormData.quantity} onChange={handlePoInputChange} className="input-field" min="1" required />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Ex-Works Price (₹) [Number Only]</label>
                <input type="number" step="0.01" name="exWorks" value={poFormData.exWorks} onChange={handlePoInputChange} className="input-field" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="input-label">Freight (₹) [Number Only]</label>
                  <input type="number" step="0.01" name="freight" value={poFormData.freight} onChange={handlePoInputChange} className="input-field" required />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="input-label">GST Rate (%)</label>
                    {addingNew.gstRate && <button type="button" onClick={() => setAddingNew({...addingNew, gstRate: false})} className="icon-btn" style={{ padding: 0, color: 'var(--danger)' }}><X size={14}/></button>}
                  </div>
                  {addingNew.gstRate ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="number" step="0.1" autoFocus value={newValues.gstRate} onChange={(e) => setNewValues({...newValues, gstRate: e.target.value})} className="input-field" placeholder="e.g. 15" style={{ marginBottom: 0 }} />
                      <button type="button" onClick={() => handleAddNew('gstRate')} className="btn btn-primary" style={{ padding: '0 0.5rem' }}><Check size={18} /></button>
                    </div>
                  ) : (
                    <select name="gstRate" value={poFormData.gstRate} onChange={handlePoInputChange} className="input-field" required>
                      <option value="">-- Select GST --</option>
                      {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
                      <option value="__NEW__" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+ Add New GST Rate...</option>
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPOForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Global PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activePoForCalc && <PVCalculatorModal po={activePoForCalc} indices={indices} onClose={() => setActivePoForCalc(null)} />}
    </div>
  );
};

export default PriceVariation;
