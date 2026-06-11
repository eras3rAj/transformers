import { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { usePO } from '../context/POContext';
import { useInspection } from '../context/InspectionContext';
import { useWarranty } from '../context/WarrantyContext';
import { useExpenses } from '../context/ExpenseContext';
import { useInventory } from '../context/InventoryContext';
import { formatDate } from '../utils/dateUtils';
import html2pdf from 'html2pdf.js';
import { 
  FileText, 
  Layers, 
  Truck, 
  ShieldAlert, 
  PackageCheck, 
  AlertTriangle, 
  Download,
  Inbox
} from 'lucide-react';
import '../components/layout/Layout.css';

const EodSummary = () => {
  const { productionLogs } = useProduction();
  const { pos } = usePO();
  const { schedules } = useInspection();
  const { claims } = useWarranty();
  const { expenses } = useExpenses();
  const { items, transactions, getGlobalStock } = useInventory();

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom stock alert threshold, defaults to 0 to show no irrelevant alerts
  const [stockThreshold, setStockThreshold] = useState(0);

  // Format the selected date for display
  const displayFormattedDate = useMemo(() => {
    return formatDate(selectedDate);
  }, [selectedDate]);

  // 1. Aggregated Production Data (Latest available log)
  const productionSummary = useMemo(() => {
    const sortedLogs = [...productionLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const log = sortedLogs.find(l => l.batches && l.batches.length > 0);
    if (!log || !log.batches) return { date: null, groups: [] };
    
    // Group by Capacity (rating) and then map components, excluding Tanks
    const capacityMap = {};
    log.batches.forEach(b => {
      if (b.component === 'Tanks Fabricated') return; // Exclude tanks
      
      const cap = b.capacity || 'Unknown Rating';
      if (!capacityMap[cap]) {
        capacityMap[cap] = {
          capacity: cap,
          'Box Up': 0,
          'CCA': 0,
          'HT Winding': 0,
          'LT Winding': 0,
          total: 0
        };
      }
      const comp = b.component;
      const qty = Number(b.quantity || 0);
      if (capacityMap[cap][comp] !== undefined) {
        capacityMap[cap][comp] += qty;
      }
      capacityMap[cap].total += qty;
    });
    
    return { date: log.date, groups: Object.values(capacityMap) };
  }, [productionLogs]);

  // Tank Fabrication Data (Last 5 active days)
  const tankFabricationSummary = useMemo(() => {
    const tankBatches = [];
    productionLogs.forEach(log => {
      if (log.batches) {
        log.batches.forEach(b => {
          if (b.component === 'Tanks Fabricated') {
            tankBatches.push({ ...b, date: log.date });
          }
        });
      }
    });

    const groupedByDate = {};
    tankBatches.forEach(b => {
      if (!groupedByDate[b.date]) {
        groupedByDate[b.date] = { total: 0, capacities: {} };
      }
      
      const qty = Number(b.quantity || 0);
      groupedByDate[b.date].total += qty;
      
      const cap = b.capacity || 'Unknown Rating';
      if (!groupedByDate[b.date].capacities[cap]) {
        groupedByDate[b.date].capacities[cap] = 0;
      }
      groupedByDate[b.date].capacities[cap] += qty;
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)).slice(0, 5);

    return sortedDates.map(date => ({
      date,
      total: groupedByDate[date].total,
      capacities: groupedByDate[date].capacities
    }));
  }, [productionLogs]);

  // 2.6 Core Cutting Data (Latest available or selected day)
  const coreCuttingSummary = useMemo(() => {
    const sortedLogs = [...productionLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const log = sortedLogs.find(l => l.sections && l.sections['Core Cutting']);
    if (!log) return null;
    return {
      date: log.date,
      data: log.sections['Core Cutting']
    };
  }, [productionLogs]);

  // Helper to count total production items
  const totalProductionCount = useMemo(() => {
    let count = 0;
    if (productionSummary.groups) {
      productionSummary.groups.forEach(capGroup => {
        count += capGroup.total;
      });
    }
    return count;
  }, [productionSummary]);

  // 2. Aggregated Delivery Schedules (Last unfulfilled delivery schedule sorted by nearest deadline)
  const { inspections } = useInspection(); // Need this to compute unfulfilled properly
  const deliverySchedules = useMemo(() => {
    const upcoming = [];
    
    schedules.forEach(poSched => {
      if (Array.isArray(poSched.schedules)) {
        // Calculate total delivered for this PO
        const delivered = (inspections || [])
          .filter(i => i.poNo === poSched.poNo && i.type === 'Final')
          .reduce((sum, i) => sum + (Number(i.qtyAccepted) || 0), 0);
          
        let remainingDelivered = delivered;
        
        const sortedPoSchedules = [...poSched.schedules].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (const s of sortedPoSchedules) {
          if (remainingDelivered >= Number(s.quantity)) {
            remainingDelivered -= Number(s.quantity);
          } else {
            const remainingToDeliver = Number(s.quantity) - remainingDelivered;
            const poDetails = pos.find(p => p.poNo === poSched.poNo) || {};
            upcoming.push({
              poNo: poSched.poNo,
              qty: remainingToDeliver, // Unfulfilled amount
              date: s.date,
              companyName: poDetails.companyName || 'Unassigned',
              utilityBoard: poDetails.utilityBoard || 'N/A',
              capacity: poDetails.capacity || 'N/A',
              noOfPhases: poDetails.noOfPhases || '3-Phase'
            });
            break; // only push the immediate next unfulfilled one per PO
          }
        }
      }
    });
    // Sort according to nearest deadline first
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming;
  }, [schedules, pos, inspections]);

  // 3. Aggregated Warranty Claims (All active/pending claims with advanced metrics)
  const warrantyEvents = useMemo(() => {
    return claims.filter(c => 
      !c.isHidden && 
      c.status !== 'Resolved' && 
      c.status !== 'Deleted' && 
      c.status !== 'Pending Deletion'
    ).sort((a, b) => {
      if (!a.returnDate) return 1;
      if (!b.returnDate) return -1;
      return new Date(a.returnDate) - new Date(b.returnDate);
    });
  }, [claims]);

  // 4. Aggregated Expenses
  const dailyExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (!exp.date) return false;
      const expDate = new Date(exp.date).toISOString().split('T')[0];
      return expDate === selectedDate;
    });
  }, [expenses, selectedDate]);

  // Sum total approved expenses for the day
  const totalApprovedExpense = useMemo(() => {
    return dailyExpenses
      .filter(exp => exp.status === 'Approved')
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  }, [dailyExpenses]);

  // 5. Aggregated Inventory Transactions
  const inventoryTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  // 6. Low Stock Alerts (dynamic threshold check)
  const lowStockAlerts = useMemo(() => {
    const threshold = Number(stockThreshold);
    if (isNaN(threshold) || threshold <= 0) return [];
    
    return items.map(item => {
      const stock = getGlobalStock(item.name);
      return {
        ...item,
        currentStock: stock
      };
    }).filter(item => item.currentStock < threshold);
  }, [items, stockThreshold, getGlobalStock]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    setIsGenerating(true);

    // Save original theme and force light mode for PDF
    const originalTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');

    // Hide controls temporarily
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    const printHeader = document.querySelector('.print-header');
    if (printHeader) printHeader.style.display = 'block';
    const printMeta = document.querySelector('.print-meta-info');
    if (printMeta) printMeta.style.display = 'flex';
    const printSig = document.querySelector('.print-signatures');
    if (printSig) printSig.style.display = 'flex';

    // Wait 500ms for CSS variables to fully recompute after theme switch
    await new Promise(r => setTimeout(r, 500));

    const element = document.querySelector('.eod-summary-container');
    if (element) {
      try {
        // CRITICAL: html2canvas cannot resolve CSS custom properties (var()).
        // We must bake the computed colors as inline styles on the REAL DOM
        // before html2canvas clones it. Then restore originals afterward.
        const allEls = [element, ...element.querySelectorAll('*')];
        const savedInlineStyles = allEls.map(el => el.getAttribute('style') || '');

        allEls.forEach(el => {
          const cs = window.getComputedStyle(el);
          el.style.color = cs.color;
          el.style.backgroundColor = cs.backgroundColor;
          el.style.borderTopColor = cs.borderTopColor;
          el.style.borderRightColor = cs.borderRightColor;
          el.style.borderBottomColor = cs.borderBottomColor;
          el.style.borderLeftColor = cs.borderLeftColor;
        });

        const opt = {
          margin:       [10, 10, 10, 10],
          filename:     `VoltForge_EOD_${selectedDate}.pdf`,
          image:        { type: 'jpeg', quality: 1.0 },
          html2canvas:  {
            scale: 3,
            useCORS: true,
            letterRendering: true,
            backgroundColor: '#ffffff'
          },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['css', 'avoid-all', 'legacy'] }
        };
        await html2pdf().from(element).set(opt).save();

        // Restore every element's original inline style
        allEls.forEach((el, i) => {
          if (savedInlineStyles[i]) {
            el.setAttribute('style', savedInlineStyles[i]);
          } else {
            el.removeAttribute('style');
          }
        });
      } catch (e) {
        console.error("PDF generation failed:", e);
        alert("Failed to generate PDF. Please try again.");
      }
    }

    // Restore elements
    noPrintElements.forEach(el => el.style.display = '');
    if (printHeader) printHeader.style.display = 'none';
    if (printMeta) printMeta.style.display = 'none';
    if (printSig) printSig.style.display = 'none';

    // Restore original theme
    if (originalTheme) {
      document.documentElement.setAttribute('data-theme', originalTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    setIsGenerating(false);
  };

  return (
    <div className="animate-fade-in eod-summary-container" style={{ paddingBottom: '3rem' }}>
      
      {/* CSS Styles for Print/PDF Mode */}
      <style>{`
        /* Removed .pdf-export-mode styles */

        /* Non-print specific displays */
        .print-header,
        .print-signatures,
        .print-meta-info {
          display: none;
        }

        /* Screen spacing and sizing */
        .eod-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .eod-controls {
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
          flex-wrap: wrap;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .eod-controls-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .metric-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .metric-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: var(--transition);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .metric-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-card-info h4 {
          margin: 0;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        .metric-card-info p {
          margin: 0.2rem 0 0 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .report-section {
          margin-bottom: 2.5rem;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .report-table th {
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 0.8rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-bottom: 2px solid var(--border-color);
        }

        .report-table td {
          padding: 0.9rem 1rem;
          font-size: 0.9rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .report-table tr:hover td {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .line-badge {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background-color: var(--accent-glow);
          color: var(--accent-primary);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .empty-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          color: var(--text-muted);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          text-align: center;
          gap: 0.5rem;
        }

        .empty-display p {
          margin: 0;
          font-size: 0.9rem;
        }

        .alert-card {
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent);
        }
      `}</style>

      {/* Official Letterhead for Print/PDF Output */}
      <div className="print-header" style={{ borderBottom: '3px double var(--border-color)', paddingBottom: '15px', marginBottom: '25px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24pt', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--text-primary)' }}>
          VoltForge Manufacturing
        </h1>
        <h2 style={{ marginTop: '15px', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '15pt', border: 'none' }}>
          DAILY EXECUTIVE OPERATIONS REPORT
        </h2>
      </div>

      <div className="print-meta-info" style={{
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '20px',
        backgroundColor: 'var(--bg-tertiary)',
        padding: '12px 16px',
        borderRadius: '6px',
        fontSize: '11pt',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)'
      }}>
        <div>Report Date: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{displayFormattedDate}</span></div>
        <div>Generated By: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>VoltForge ERP</span></div>
        <div>Status: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Official Copy</span></div>
      </div>

      {/* Screen Title Block */}
      <div className="eod-summary-header no-print">
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-primary)' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Daily Executive Summary
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Generate operational summary, inventory stock alerts, and print-ready PDF reports for any date.
          </p>
        </div>
        <button className="btn btn-primary btn-print" onClick={handlePrint} disabled={isGenerating}>
          <Download size={18} /> {isGenerating ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Header controls (Screen Only) */}
      <div className="eod-controls no-print">
        <div className="eod-controls-group">
          <label className="input-label" style={{ fontWeight: '600' }}>SELECT SUMMARY DATE</label>
          <input 
            type="date" 
            className="input-field"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '180px', height: '42px', backgroundColor: 'var(--bg-tertiary)', fontWeight: '600', marginBottom: 0 }}
          />
        </div>

        <div className="eod-controls-group">
          <label className="input-label" style={{ fontWeight: '600' }}>STOCK ALERT THRESHOLD</label>
          <input 
            type="number" 
            min="0" 
            className="input-field" 
            style={{ width: '180px', height: '42px', backgroundColor: 'var(--bg-tertiary)', fontWeight: '600' }}
            value={stockThreshold}
            onChange={(e) => setStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="Alert limit (e.g. 5)"
          />
        </div>
      </div>

      {/* Screen & Print Metrics Overview Grid */}
      <div className="metric-cards-grid">
        <div className="metric-card">
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>
            <Layers size={22} />
          </div>
          <div className="metric-card-info">
            <h4>Total Produced</h4>
            <p>{totalProductionCount} Units</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            <Truck size={22} />
          </div>
          <div className="metric-card-info">
            <h4>Deliveries Scheduled</h4>
            <p>{deliverySchedules.length} POs</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning)' }}>
            <ShieldAlert size={22} />
          </div>
          <div className="metric-card-info">
            <h4>Warranty Events</h4>
            <p>{warrantyEvents.length} Claims</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹</span>
          </div>
          <div className="metric-card-info">
            <h4>Approved Expenses</h4>
            <p>₹{totalApprovedExpense.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* 1. Low Stock Alerts / Red Flags (Shown if threshold > 0 and low items exist) */}
      {Number(stockThreshold) > 0 && (
        <div className="report-section card alert-card alert-section">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ef4444', margin: '0 0 1rem 0' }}>
            <AlertTriangle size={20} /> Low Stock Warnings (Threshold: {stockThreshold})
          </h2>
          {lowStockAlerts.length === 0 ? (
            <div className="empty-display" style={{ borderStyle: 'solid', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
              <p>No inventory items are below the safety threshold of {stockThreshold}.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>ITEM NAME</th>
                    <th>CATEGORY</th>
                    <th style={{ textAlign: 'right' }}>CURRENT STOCK LEVEL</th>
                    <th>UNIT</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockAlerts.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '600', color: 'var(--danger)' }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>
                        {item.currentStock}
                      </td>
                      <td>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Daily Production */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <Layers size={20} color="var(--accent-primary)" /> Transformer Assembly {productionSummary.date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>(Updated: {formatDate(productionSummary.date)})</span>}
        </h2>
        {productionSummary.groups.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No manufacturing output or assembly logs recorded.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>CAPACITY RATING</th>
                  <th style={{ textAlign: 'center' }}>BOX UP</th>
                  <th style={{ textAlign: 'center' }}>CCA</th>
                  <th style={{ textAlign: 'center' }}>HT WINDING</th>
                  <th style={{ textAlign: 'center' }}>LT WINDING</th>
                  <th style={{ textAlign: 'center', color: 'var(--accent-primary)' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {productionSummary.groups.map((group, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600', textAlign: 'left' }}>
                      <span className="line-badge">{group.capacity}</span>
                    </td>
                    <td>{group['Box Up'] || '-'}</td>
                    <td>{group['CCA'] || '-'}</td>
                    <td>{group['HT Winding'] || '-'}</td>
                    <td>{group['LT Winding'] || '-'}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{group.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2.5 Tank Fabrication */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <Layers size={20} color="var(--warning)" /> Tank Fabrication (Last 5 Days)
        </h2>
        {tankFabricationSummary.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No recent tank fabrication logs found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {tankFabricationSummary.map((day, idx) => (
              <div key={idx} style={{ 
                flex: '1', 
                minWidth: '160px', 
                backgroundColor: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-color)', 
                padding: '1.2rem', 
                borderRadius: '8px'
              }}>
                <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                  {formatDate(day.date)}
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  {Object.entries(day.capacities).map(([cap, qty]) => (
                    <div key={cap} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>{cap}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{qty}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--warning)' }}>{day.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2.6 Core Cutting Details */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <Layers size={20} color="var(--accent-primary)" /> Core Cutting Details
          {coreCuttingSummary?.date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>(Updated: {formatDate(coreCuttingSummary.date)})</span>}
        </h2>
        {!coreCuttingSummary ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No recent core cutting logs found.</p>
          </div>
        ) : (
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px' }}>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Rating in Oven:</strong> <span style={{ color: 'var(--text-primary)' }}>{coreCuttingSummary.data?.ratingInOven || 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Oven Opening:</strong> <span style={{ color: 'var(--text-primary)' }}>{coreCuttingSummary.data?.openingTime ? new Date(`1970-01-01T${coreCuttingSummary.data.openingTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Cutting Rating:</strong> <span style={{ color: 'var(--text-primary)' }}>{coreCuttingSummary.data?.cuttingRating || 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Next Oven Time:</strong> <span style={{ color: 'var(--text-primary)' }}>{coreCuttingSummary.data?.nextOvenTime ? new Date(`1970-01-01T${coreCuttingSummary.data.nextOvenTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span></div>
            </div>
            <div className="grid-2">
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Tested Ratings:</strong>
                {coreCuttingSummary.data?.testingTable?.length > 0 ? (
                  <ul style={{ margin: '8px 0 0 20px', color: 'var(--text-primary)' }}>
                    {coreCuttingSummary.data.testingTable.filter(r => r.rating || r.srNo).map((r, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{r.rating || 'Unknown'} - Till Sr. No: <strong>{r.srNo || 'N/A'}</strong></li>
                    ))}
                  </ul>
                ) : <div style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No testing recorded.</div>}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Amorphous Ribbon Stock:</strong>
                <ul style={{ margin: '8px 0 0 20px', color: 'var(--text-primary)' }}>
                  {['142.2mm', '170.2mm', '213.4mm'].map(size => {
                    const av = coreCuttingSummary.data?.ribbonStock?.[size]?.available;
                    const inc = coreCuttingSummary.data?.ribbonStock?.[size]?.incoming;
                    if (!av && !inc) return null;
                    return <li key={size} style={{ marginBottom: '4px' }}>{size}: Available: <strong style={{ color: 'var(--accent-primary)' }}>{av||0}</strong> | Incoming: <strong style={{ color: 'var(--success)' }}>{inc||0}</strong></li>;
                  })}
                  {(!coreCuttingSummary.data?.ribbonStock || !Object.values(coreCuttingSummary.data.ribbonStock).some(s => s.available || s.incoming)) && (
                    <li style={{ color: 'var(--text-muted)', listStyle: 'none', marginLeft: '-20px' }}>No stock data recorded.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Delivery Schedules */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <Truck size={20} color="var(--success)" /> Dispatch & Delivery Schedule
        </h2>
        {deliverySchedules.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No upcoming client deliveries or dispatches scheduled.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>PO NUMBER</th>
                  <th>UTILITY BOARD</th>
                  <th>CLIENT / COMPANY</th>
                  <th>PRODUCT DETAILS</th>
                  <th>SCHEDULED DATE</th>
                  <th style={{ textAlign: 'right' }}>SCHEDULED QTY</th>
                </tr>
              </thead>
              <tbody>
                {deliverySchedules.map((item, index) => {
                  const itemDate = new Date(item.date);
                  const now = new Date();
                  itemDate.setHours(0, 0, 0, 0);
                  now.setHours(0, 0, 0, 0);
                  
                  const diffTime = itemDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let dateColor = 'var(--success)'; // > 15 days
                  if (diffDays < 0) {
                    dateColor = 'var(--danger)'; // Overdue
                  } else if (diffDays <= 15) {
                    dateColor = 'var(--warning)'; // Within 15 days
                  }

                  return (
                    <tr key={index}>
                      <td style={{ fontWeight: '600' }}>{item.poNo}</td>
                      <td>{item.utilityBoard}</td>
                      <td>{item.companyName}</td>
                      <td>{item.capacity} ({item.noOfPhases})</td>
                      <td style={{ color: dateColor, fontWeight: '700' }}>{formatDate(item.date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.qty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Warranty Status Events */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <ShieldAlert size={20} color="var(--warning)" /> Active Warranty Updates
        </h2>
        
        {/* Warranty Metrics */}
        {warrantyEvents.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--danger)', textTransform: 'uppercase' }}>Late (Overdue)</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {warrantyEvents.filter(c => c.returnDate && new Date(c.returnDate) < new Date()).length}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--warning)', textTransform: 'uppercase' }}>Due in 15 Days</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {warrantyEvents.filter(c => {
                  if (!c.returnDate) return false;
                  const d = new Date(c.returnDate).getTime();
                  const now = new Date().getTime();
                  return d >= now && d <= now + (15 * 24 * 60 * 60 * 1000);
                }).length}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Due in 30 Days</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {warrantyEvents.filter(c => {
                  if (!c.returnDate) return false;
                  const d = new Date(c.returnDate).getTime();
                  const now = new Date().getTime();
                  return d > now + (15 * 24 * 60 * 60 * 1000) && d <= now + (30 * 24 * 60 * 60 * 1000);
                }).length}
              </p>
            </div>
          </div>
        )}

        {warrantyEvents.length > 0 && (
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total To Be Returned (Rating Wise)</h3>
            <table className="report-table" style={{ width: 'auto', minWidth: '300px' }}>
              <thead>
                <tr>
                  <th>CAPACITY RATING</th>
                  <th style={{ textAlign: 'right' }}>PENDING COUNT</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(warrantyEvents.reduce((acc, claim) => {
                  const cap = claim.capacity || 'Unknown';
                  acc[cap] = (acc[cap] || 0) + 1;
                  return acc;
                }, {})).map(([rating, count]) => (
                  <tr key={rating}>
                    <td style={{ fontWeight: '600' }}>{rating}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--warning)' }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Daily Expenses */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>₹</span> Daily Operational Expenses
        </h2>
        {dailyExpenses.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No cash vouchers or operational expenses logged for {displayFormattedDate}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>PAYABLE TO</th>
                  <th>REASON / PARTICULARS</th>
                  <th>SUBMITTED BY</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {dailyExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: '500' }}>{exp.payable_to}</td>
                    <td>{exp.reason}</td>
                    <td>{exp.submitted_by}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      ₹{Number(exp.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td>
                      <span className="badge-status" style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: exp.status === 'Approved' ? 'rgba(34, 197, 94, 0.1)' : exp.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: exp.status === 'Approved' ? 'var(--success)' : exp.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'
                      }}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: '700' }}>
                  <td colSpan="3" style={{ padding: '0.8rem 1rem' }}>Total Approved Operating Expenses:</td>
                  <td style={{ textAlign: 'right', padding: '0.8rem 1rem', color: 'var(--danger)' }}>
                    ₹{totalApprovedExpense.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Inventory Transactions */}
      <div className="report-section card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 1rem 0' }}>
          <PackageCheck size={20} color="var(--accent-primary)" /> Daily Inventory Store Movements
        </h2>
        {inventoryTransactions.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No inventory item transactions (IN / OUT logs) recorded for {displayFormattedDate}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>ITEM NAME</th>
                  <th>TYPE</th>
                  <th style={{ textAlign: 'right' }}>QUANTITY</th>
                  <th>STORE LOCATION</th>
                  <th>SUPPLIER / VENDOR</th>
                  <th>BILL DETAILS</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {inventoryTransactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '600' }}>{t.item}</td>
                    <td style={{ fontWeight: '700', color: t.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{t.qty}</td>
                    <td>{t.location}</td>
                    <td>{t.companyName || 'N/A'}</td>
                    <td>
                      {t.billNo ? `Bill: ${t.billNo}` : 'N/A'}
                      {t.billDate ? ` (${formatDate(t.billDate)})` : ''}
                    </td>
                    <td style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{t.remarks || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Signatures Block */}
      <div className="print-signatures">
        <div className="sig-line">
          <div>Prepared By (Operations Desk)</div>
        </div>
        <div className="sig-line">
          <div>Checked By (Factory Manager)</div>
        </div>
        <div className="sig-line">
          <div>Authorized Signatory (Managing Director)</div>
        </div>
      </div>

    </div>
  );
};

export default EodSummary;
