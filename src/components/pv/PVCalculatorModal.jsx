import { useState, useMemo, useEffect } from 'react';
import { X, Calculator, ArrowRight, AlertCircle } from 'lucide-react';
import { calculatePVFinancials } from '../../utils/pvCalculator';
import '../layout/Layout.css';

const PVCalculatorModal = ({ po, indices, onClose }) => {
  const [selectedMonthRaw, setSelectedMonthRaw] = useState('');

  const latestIndex = useMemo(() => {
    if (!indices || indices.length === 0) return null;
    const monthOrder = { 'January':0, 'February':1, 'March':2, 'April':3, 'May':4, 'June':5, 'July':6, 'August':7, 'September':8, 'October':9, 'November':10, 'December':11 };
    return [...indices].sort((a, b) => {
      const [m1, y1] = a.month.split(' ');
      const [m2, y2] = b.month.split(' ');
      if (y1 !== y2) return parseInt(y2) - parseInt(y1);
      return monthOrder[m2] - monthOrder[m1];
    })[0];
  }, [indices]);

  useEffect(() => {
    if (latestIndex && !selectedMonthRaw) {
      const monthOrderRev = { 'January':'01', 'February':'02', 'March':'03', 'April':'04', 'May':'05', 'June':'06', 'July':'07', 'August':'08', 'September':'09', 'October':'10', 'November':'11', 'December':'12' };
      if (latestIndex.month) {
        const [m, y] = latestIndex.month.split(' ');
        if (m && y && monthOrderRev[m]) {
          setSelectedMonthRaw(`${y}-${monthOrderRev[m]}`);
        }
      }
    }
  }, [latestIndex, selectedMonthRaw]);

  const formattedMonth = useMemo(() => {
    if (!selectedMonthRaw) return '';
    const [y, m] = selectedMonthRaw.split('-');
    if (!y || !m) return '';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
  }, [selectedMonthRaw]);

  const baseData = indices.find(i => i.month === po.baseMonthStr);
  
  if (!baseData) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Missing Base Data</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            The base month <strong>"{po.baseMonthStr}"</strong> for this Purchase Order cannot be found in the Price Indices database. Please add it to the monthly rates list before running the calculation.
          </p>
          <button onClick={onClose} className="btn btn-primary">Close</button>
        </div>
      </div>
    );
  }

  const currData = indices.find(i => i.month === formattedMonth);
  const calculatedResult = currData ? calculatePVFinancials(po, baseData, currData) : null;

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '0', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Calculator size={24} color="var(--accent-primary)" />
              <h2 style={{ margin: 0 }}>PV Calculator: {po.poNo}</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Base Month: <strong>{baseData.month}</strong> | Rating: <strong>{po.capacity}</strong>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" type="button" style={{ alignSelf: 'flex-start' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div style={{ flex: 1, maxWidth: '300px' }}>
              <label className="input-label" style={{ color: 'var(--accent-primary)' }}>Select Current (Delivery) Month</label>
              <input 
                type="month" 
                value={selectedMonthRaw} 
                onChange={(e) => setSelectedMonthRaw(e.target.value)} 
                className="input-field" 
                style={{ marginBottom: 0, cursor: 'pointer' }} 
                required 
              />
            </div>
          </div>

          {calculatedResult ? (
            <div className="animate-fade-in">
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                Financial Breakdown Comparison
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>COMPONENT</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ORIGINAL (BASE)</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}></th>
                    <th style={{ padding: '1rem', color: 'var(--accent-primary)' }}>REVISED ({calculatedResult.currMonthStr})</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>DIFFERENCE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Ex-Works Price</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{formatCurrency(calculatedResult.origExWorks)}</td>
                    <td style={{ padding: '1rem' }}><ArrowRight size={16} color="var(--text-muted)" /></td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(calculatedResult.newExWorks)}</td>
                    <td style={{ padding: '1rem', color: calculatedResult.exWorksDiff > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {calculatedResult.exWorksDiff > 0 ? '+' : ''}{formatCurrency(calculatedResult.exWorksDiff)}
                    </td>
                  </tr>
                  
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Freight (Fixed)</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatCurrency(calculatedResult.origFreight)}</td>
                    <td style={{ padding: '1rem' }}></td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatCurrency(calculatedResult.newFreight)}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>-</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>GST ({po.gstRate}%)</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatCurrency(calculatedResult.origGst)}</td>
                    <td style={{ padding: '1rem' }}></td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatCurrency(calculatedResult.newGst)}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {calculatedResult.newGst - calculatedResult.origGst > 0 ? '+' : ''}{formatCurrency(calculatedResult.newGst - calculatedResult.origGst)}
                    </td>
                  </tr>

                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <td style={{ padding: '1.5rem 1rem', textAlign: 'left', fontWeight: 'bold', fontSize: '1.1rem' }}>TOTAL INVOICE</td>
                    <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{formatCurrency(calculatedResult.origTotal)}</td>
                    <td style={{ padding: '1.5rem 1rem' }}><ArrowRight size={20} color="var(--text-muted)" /></td>
                    <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>{formatCurrency(calculatedResult.newTotal)}</td>
                    <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold', color: calculatedResult.totalDiff > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {calculatedResult.totalDiff > 0 ? '+' : ''}{formatCurrency(calculatedResult.totalDiff)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Net Ex-Works Price Variation Factor: <strong style={{ color: calculatedResult.percentageChange > 0 ? 'var(--danger)' : 'var(--success)'}}>{calculatedResult.percentageChange > 0 ? '+' : ''}{calculatedResult.percentageChange}%</strong>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              <AlertCircle size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} color="var(--warning)" />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--warning)' }}>Data Not Found</h3>
              <p style={{ margin: 0 }}>Price Index data for <strong>{formattedMonth}</strong> has not been uploaded to the database yet. Please select another month or update the PV database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PVCalculatorModal;
