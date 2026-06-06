import React, { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { usePO } from '../context/POContext';
import { useInspection } from '../context/InspectionContext';
import { useWarranty } from '../context/WarrantyContext';
import { useExpenses } from '../context/ExpenseContext';
import { useInventory } from '../context/InventoryContext';
import { formatDate } from '../utils/dateUtils';
import { 
  FileText, 
  Calendar, 
  Layers, 
  Truck, 
  ShieldAlert, 
  DollarSign, 
  PackageCheck, 
  AlertTriangle, 
  Printer, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
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

  // 1. Aggregated Production Data
  const productionSummary = useMemo(() => {
    const log = productionLogs.find(l => l.date === selectedDate);
    if (!log || !log.batches) return [];
    
    // Group by production line
    const linesMap = {};
    log.batches.forEach(b => {
      if (!linesMap[b.line]) {
        linesMap[b.line] = {
          line: b.line,
          lead: b.assigned_to || 'N/A',
          batches: []
        };
      }
      linesMap[b.line].batches.push(b);
    });
    
    return Object.values(linesMap);
  }, [productionLogs, selectedDate]);

  // Helper to count total production items
  const totalProductionCount = useMemo(() => {
    let count = 0;
    productionSummary.forEach(lineGroup => {
      lineGroup.batches.forEach(b => {
        count += Number(b.quantity || 0);
      });
    });
    return count;
  }, [productionSummary]);

  // 2. Aggregated Delivery Schedules
  const deliverySchedules = useMemo(() => {
    const daily = [];
    schedules.forEach(poSched => {
      if (Array.isArray(poSched.schedules)) {
        poSched.schedules.forEach(s => {
          if (s.date === selectedDate) {
            const poDetails = pos.find(p => p.poNo === poSched.poNo) || {};
            daily.push({
              poNo: poSched.poNo,
              qty: s.quantity,
              companyName: poDetails.companyName || 'Unassigned',
              utilityBoard: poDetails.utilityBoard || 'N/A',
              capacity: poDetails.capacity || 'N/A',
              noOfPhases: poDetails.noOfPhases || '3-Phase'
            });
          }
        });
      }
    });
    return daily;
  }, [schedules, pos, selectedDate]);

  // 3. Aggregated Warranty Claims
  const warrantyEvents = useMemo(() => {
    const daily = [];
    claims.forEach(c => {
      // Check which date field matches the selected date
      const matches = [];
      if (c.damageDate === selectedDate) matches.push('Damage Reported');
      if (c.intimationDate === selectedDate) matches.push('Intimation Received');
      if (c.returnDate === selectedDate) matches.push('Material Returned');
      if (c.inspectionDate === selectedDate) matches.push('Inspection Completed');
      
      if (matches.length > 0) {
        daily.push({
          ...c,
          eventTypes: matches.join(', ')
        });
      }
    });
    return daily;
  }, [claims, selectedDate]);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in eod-summary-container" style={{ paddingBottom: '3rem' }}>
      
      {/* CSS Styles for Print/PDF Mode */}
      <style>{`
        @media print {
          /* Hide sidebar, top navigation header and dashboard control panels */
          aside,
          .header,
          .sidebar,
          .eod-controls,
          .btn-print,
          .no-print {
            display: none !important;
          }
          
          /* Reset content margins and display */
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Inter', Arial, sans-serif !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .page-content,
          .main-content,
          .app-container {
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            width: 100% !important;
          }
          
          .eod-summary-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Official A4 Letterhead */
          .print-header {
            display: block !important;
            border-bottom: 3px double #1e293b;
            padding-bottom: 15px;
            margin-bottom: 25px;
            text-align: center;
          }
          
          .print-header h1 {
            color: #1e293b !important;
            font-size: 24pt !important;
            margin: 0 0 5px 0 !important;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
          }
          
          .print-header p {
            color: #475569 !important;
            margin: 2px 0 !important;
            font-size: 10pt !important;
          }

          .print-meta-info {
            display: flex !important;
            justify-content: space-between;
            margin-bottom: 20px;
            background-color: #f1f5f9;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 10pt;
            border: 1px solid #cbd5e1;
          }

          .print-meta-info span {
            font-weight: 600;
            color: #334155;
          }
          
          /* Print Layout Adjustments */
          .card {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            margin-bottom: 20px !important;
            padding: 12px !important;
            page-break-inside: avoid;
            border-radius: 6px !important;
          }
          
          .card h2, .card h3 {
            color: #1e293b !important;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-top: 0;
            font-size: 14pt !important;
          }
          
          .metric-cards-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          
          .metric-card {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            padding: 10px !important;
            text-align: center;
            border-radius: 4px;
          }
          
          .metric-card h4 {
            font-size: 8pt !important;
            color: #64748b !important;
            margin: 0 !important;
            text-transform: uppercase;
          }
          
          .metric-card p {
            font-size: 16pt !important;
            font-weight: bold !important;
            color: #0f172a !important;
            margin: 5px 0 0 0 !important;
          }

          /* Print Tables styling */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 8px !important;
          }
          
          th {
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            font-size: 9pt !important;
            font-weight: bold !important;
            text-align: left !important;
          }
          
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            font-size: 9pt !important;
            color: #334155 !important;
            background-color: #ffffff !important;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          /* Badges */
          .badge-status {
            border: 1px solid #cbd5e1 !important;
            background: transparent !important;
            color: #0f172a !important;
            padding: 1px 4px !important;
            border-radius: 3px;
          }
          
          .empty-state {
            color: #64748b !important;
            padding: 15px !important;
            font-style: italic;
            border: 1px dashed #cbd5e1 !important;
            text-align: center;
          }

          .alert-section {
            background-color: #fff1f2 !important;
            border: 1px solid #fecdd3 !important;
          }

          .alert-section h2 {
            color: #9f1239 !important;
            border-bottom-color: #fecdd3;
          }
          
          /* Footer Signature Blocks */
          .print-signatures {
            display: flex !important;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 20px;
            page-break-inside: avoid;
          }
          
          .sig-line {
            width: 30%;
            text-align: center;
            font-size: 10pt;
            color: #334155;
          }
          
          .sig-line div {
            border-top: 1px solid #000000;
            margin-top: 40px;
            padding-top: 5px;
          }
        }

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
      <div className="print-header">
        <h1>VoltForge Manufacturing</h1>
        <p>Plot No. 45, Phase 1, Industrial Area, PSPCL Grid Road</p>
        <p>Phone: +91 161 5029311 | Email: ops@voltforge.in</p>
        <h2 style={{ marginTop: '15px', color: '#0f172a', fontWeight: '700', fontSize: '15pt', border: 'none' }}>
          DAILY EXECUTIVE OPERATIONS REPORT
        </h2>
      </div>

      <div className="print-meta-info">
        <div>Report Date: <span>{displayFormattedDate}</span></div>
        <div>Generated By: <span>VoltForge ERP</span></div>
        <div>Status: <span>Official Copy</span></div>
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
        <button className="btn btn-primary btn-print" onClick={handlePrint}>
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      {/* Header controls (Screen Only) */}
      <div className="eod-controls no-print">
        <div className="eod-controls-group">
          <label className="input-label" style={{ fontWeight: '600' }}>SELECT SUMMARY DATE</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', height: '42px', minWidth: '180px', overflow: 'hidden' }}>
            <Calendar size={18} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{displayFormattedDate}</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
          </div>
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
            <DollarSign size={22} />
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
          <Layers size={20} color="var(--accent-primary)" /> Daily Production Batches
        </h2>
        {productionSummary.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No manufacturing output or assembly logs recorded for {displayFormattedDate}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>PRODUCTION LINE</th>
                  <th>ASSIGNED LEAD</th>
                  <th>PRODUCT COMPONENT</th>
                  <th>CAPACITY RATING</th>
                  <th style={{ textAlign: 'right' }}>QUANTITY</th>
                </tr>
              </thead>
              <tbody>
                {productionSummary.map(lineGroup => (
                  lineGroup.batches.map((batch, index) => (
                    <tr key={batch.id}>
                      {index === 0 ? (
                        <td rowSpan={lineGroup.batches.length} style={{ fontWeight: '600', verticalAlign: 'middle' }}>
                          <span className="line-badge">{lineGroup.line}</span>
                        </td>
                      ) : null}
                      {index === 0 ? (
                        <td rowSpan={lineGroup.batches.length} style={{ verticalAlign: 'middle', fontWeight: '500' }}>
                          {lineGroup.lead}
                        </td>
                      ) : null}
                      <td>{batch.component}</td>
                      <td style={{ fontWeight: '500' }}>{batch.capacity}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{batch.quantity}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
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
            <p>No client deliveries or dispatches scheduled for {displayFormattedDate}.</p>
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
                  <th style={{ textAlign: 'right' }}>SCHEDULED QTY</th>
                </tr>
              </thead>
              <tbody>
                {deliverySchedules.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600' }}>{item.poNo}</td>
                    <td>{item.utilityBoard}</td>
                    <td>{item.companyName}</td>
                    <td>{item.capacity} ({item.noOfPhases})</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>
                      {item.qty}
                    </td>
                  </tr>
                ))}
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
        {warrantyEvents.length === 0 ? (
          <div className="empty-display">
            <Inbox size={32} />
            <p>No warranty claim damage logs, intimations, or returns filed for {displayFormattedDate}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>SERIAL NUMBER</th>
                  <th>PO NUMBER</th>
                  <th>UTILITY BOARD</th>
                  <th>STORE NAME</th>
                  <th>RATING</th>
                  <th>EVENT FILED TODAY</th>
                  <th>CURRENT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {warrantyEvents.map(claim => (
                  <tr key={claim.id}>
                    <td style={{ fontWeight: '600' }}>{claim.slNo}</td>
                    <td>{claim.poNo}</td>
                    <td>{claim.utilityBoard}</td>
                    <td>{claim.storeName}</td>
                    <td>{claim.capacity}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: '500' }}>{claim.eventTypes}</td>
                    <td>
                      <span className="badge-status" style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        backgroundColor: claim.status === 'Resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: claim.status === 'Resolved' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {claim.status}
                      </span>
                    </td>
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
          <DollarSign size={20} color="var(--danger)" /> Daily Operational Expenses
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
