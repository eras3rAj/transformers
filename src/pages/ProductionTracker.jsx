import { formatDate } from '../utils/dateUtils';
import { useState, useEffect, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { usePO } from '../context/POContext';
import { useInspection } from '../context/InspectionContext';
import { useEmployees } from '../context/EmployeeContext';
import { useInventory } from '../context/InventoryContext';
import { Calendar, Save, Check, Layers, Settings, Plus, X, ListFilter, UserCheck, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import '../components/layout/Layout.css';

const ProductionTracker = () => {
  const { productionLogs, productionLines, saveBatchesForDate, saveLines } = useProduction();
  const { capacities, pos, companies } = usePO();
  const { inspections } = useInspection();
  const { employees } = useEmployees();
  const { transactions, items } = useInventory();
  
  const [companyFilter, setCompanyFilter] = useState('All');
  
  const [activeTab, setActiveTab] = useState('transformer'); // 'transformer' or 'tank'

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const [gridData, setGridData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Line Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [newLineName, setNewLineName] = useState('');
  
  const [extraCapacities, setExtraCapacities] = useState([]);
  const [newCapacityToAdd, setNewCapacityToAdd] = useState('');

  // Auto-select first line on load
  useEffect(() => {
    if (productionLines.length > 0 && !selectedLine) {
      setSelectedLine(productionLines[0]);
    }
  }, [productionLines, selectedLine]);

  // Load existing batches into the grid
  useEffect(() => {
    const existingLog = productionLogs.find(l => l.date === selectedDate);
    const loadedGrid = {};
    let lineSupervisor = '';
    
    const effectiveLine = activeTab === 'tank' ? 'JM-IGC' : selectedLine;

    if (existingLog && existingLog.batches) {
      existingLog.batches.forEach(b => {
        if (b.line === effectiveLine) {
          if (!loadedGrid[b.capacity]) loadedGrid[b.capacity] = {};
          loadedGrid[b.capacity][b.component] = b.quantity;
          if (b.assigned_to) lineSupervisor = b.assigned_to;
        }
      });
    }
    setGridData(loadedGrid);
    setSelectedEmployee(lineSupervisor);
    setSaveSuccess(false);
  }, [selectedDate, selectedLine, activeTab, productionLogs]);

  // Handle input change in the grid
  const handleGridChange = (capacity, component, value) => {
    const numValue = value === '' ? '' : parseInt(value, 10) || 0;
    setGridData(prev => ({
      ...prev,
      [capacity]: {
        ...(prev[capacity] || {}),
        [component]: numValue
      }
    }));
    setSaveSuccess(false);
  };

  // Calculate Auto-Supplied per capacity from Final Inspections
  const getSuppliedForCapacity = (cap) => {
    // Only count POs that match the current company filter
    const poNos = pos.filter(p => p.capacity === cap && (companyFilter === 'All' || p.companyName === companyFilter)).map(p => p.poNo);
    const total = inspections
      .filter(i => i.type === 'Final' && poNos.includes(i.poNo))
      .reduce((sum, i) => sum + Number(i.qtyAccepted), 0);
    return total > 0 ? total : '-';
  };

  const handleSave = async () => {
    setIsSaving(true);
    const effectiveLine = activeTab === 'tank' ? 'JM-IGC' : selectedLine;
    
    // We must merge the NEW grid data for the selected line, with the EXISTING batches for OTHER lines
    const existingLog = productionLogs.find(l => l.date === selectedDate);
    const otherLinesBatches = (existingLog ? existingLog.batches : []).filter(b => b.line !== effectiveLine);
    
    const newBatches = [];
    Object.keys(gridData).forEach(capacity => {
      ['Box Up', 'CCA', 'HT Winding', 'LT Winding', 'Tanks Fabricated'].forEach(component => {
        const qty = gridData[capacity][component];
        if (qty && qty > 0) {
          newBatches.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            line: effectiveLine,
            component,
            capacity,
            quantity: Number(qty),
            assigned_to: selectedEmployee
          });
        }
      });
    });

    const combinedBatches = [...otherLinesBatches, ...newBatches];
    
    const success = await saveBatchesForDate(selectedDate, combinedBatches);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const handleCopyFromYesterday = () => {
    const currentSelected = new Date(selectedDate);
    currentSelected.setDate(currentSelected.getDate() - 1);
    const yesterdayStr = currentSelected.toISOString().split('T')[0];
    
    const existingLog = productionLogs.find(l => l.date === yesterdayStr);
    const loadedGrid = {};
    
    const effectiveLine = activeTab === 'tank' ? 'JM-IGC' : selectedLine;

    if (existingLog && existingLog.batches) {
      existingLog.batches.forEach(b => {
        if (b.line === effectiveLine) {
          if (!loadedGrid[b.capacity]) loadedGrid[b.capacity] = {};
          loadedGrid[b.capacity][b.component] = b.quantity;
        }
      });
      setGridData(loadedGrid);
      setSaveSuccess(false);
    } else {
      alert(`No data found for the previous day (${yesterdayStr}) on this line.`);
    }
  };

  const handleClearGrid = () => {
    if (window.confirm('Are you sure you want to clear the grid? This will not delete saved data until you click Save.')) {
      setGridData({});
      setSaveSuccess(false);
    }
  };

  const handleAddLine = async () => {
    if (!newLineName) return;
    if (productionLines.includes(newLineName)) return;
    await saveLines([...productionLines, newLineName]);
    setNewLineName('');
    setSelectedLine(newLineName);
  };

  const handleDeleteLine = async (lineToRemove) => {
    const updated = productionLines.filter(l => l !== lineToRemove);
    await saveLines(updated);
    if (selectedLine === lineToRemove) setSelectedLine(updated[0] || '');
  };

  const handleAddExtraCapacity = () => {
    if (!newCapacityToAdd) return;
    if (!extraCapacities.includes(newCapacityToAdd)) {
      setExtraCapacities(prev => [...prev, newCapacityToAdd]);
    }
    setNewCapacityToAdd('');
  };

  // Determine which capacities to show as rows
  const displayCapacities = useMemo(() => {
    // 1. Capacities from active POs matching the filter
    const poCaps = pos.filter(p => companyFilter === 'All' || p.companyName === companyFilter).map(p => p.capacity);
    // 2. Capacities already in today's grid for this line
    const gridCaps = Object.keys(gridData);
    // 3. Manually added extra capacities for this session
    const unique = [...new Set([...poCaps, ...gridCaps, ...extraCapacities])];
    // Sort them so it looks consistent (or leave as is)
    return unique;
  }, [pos, gridData, extraCapacities, companyFilter]);

  // Daily Summary all lines
  const dailySummary = useMemo(() => {
    const summary = {};
    const existingLog = productionLogs.find(l => l.date === selectedDate);
    if (existingLog && existingLog.batches) {
      existingLog.batches.forEach(b => {
        if (!summary[b.capacity]) summary[b.capacity] = { 'LT Winding': 0, 'HT Winding': 0, 'CCA': 0, 'Box Up': 0, 'Tanks Fabricated': 0, 'Stock In': 0, 'Stock Out': 0 };
        summary[b.capacity][b.component] += b.quantity;
      });
    }

    // Process transactions for Tanks on this date
    if (transactions && items) {
      const todaysTxns = transactions.filter(t => t.date === selectedDate);
      todaysTxns.forEach(t => {
        const invItem = items.find(i => i.name === t.item);
        // We only care about tanks. Let's assume category contains 'Tank' or item name contains 'Tank'.
        if (invItem && (invItem.category?.toLowerCase().includes('tank') || t.item.toLowerCase().includes('tank') || t.item.toLowerCase().includes('kva'))) {
          // Find matching capacity (e.g. "16 kVA")
          const matchedCap = capacities.find(c => t.item.toLowerCase().includes(c.toLowerCase()));
          if (matchedCap) {
            if (!summary[matchedCap]) {
              summary[matchedCap] = { 'LT Winding': 0, 'HT Winding': 0, 'CCA': 0, 'Box Up': 0, 'Tanks Fabricated': 0, 'Stock In': 0, 'Stock Out': 0 };
            }
            if (t.type === 'IN') summary[matchedCap]['Stock In'] += t.qty;
            if (t.type === 'OUT') summary[matchedCap]['Stock Out'] += t.qty;
          }
        }
      });
    }

    return summary;
  }, [productionLogs, selectedDate, transactions, items, capacities]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-primary)' }}>
          <Layers size={28} color="var(--accent-primary)" />
          Daily Production Tracker
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Log capacity-wise production output across your active lines in a spreadsheet view.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('transformer')}
          style={{ flex: 1, padding: '1rem', backgroundColor: activeTab === 'transformer' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeTab === 'transformer' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s' }}
        >
          Transformer Manufacturing
        </button>
        <button 
          onClick={() => setActiveTab('tank')}
          style={{ flex: 1, padding: '1rem', backgroundColor: activeTab === 'tank' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeTab === 'tank' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s' }}
        >
          Tank Fabrication
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>FILTER COMPANY</label>
              <select 
                className="input-field" 
                value={companyFilter} 
                onChange={(e) => setCompanyFilter(e.target.value)}
                style={{ minWidth: '150px', marginBottom: 0 }}
              >
                <option value="All">All Companies</option>
                {companies?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>SELECT DATE</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.3rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: 0 }}>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setUTCDate(d.getUTCDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.3rem', color: 'var(--text-primary)' }}
                  title="Previous Date"
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.25rem' }}>
                  <Calendar size={18} color="var(--text-secondary)" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: '600' }}
                  />
                </div>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setUTCDate(d.getUTCDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.3rem', color: 'var(--text-primary)' }}
                  title="Next Date"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>SELECT LINE</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select 
                  className="input-field" 
                  value={activeTab === 'tank' ? 'JM-IGC' : selectedLine} 
                  onChange={(e) => activeTab === 'tank' ? null : setSelectedLine(e.target.value)}
                  style={{ minWidth: '200px', fontWeight: '600', color: 'var(--accent-primary)', opacity: activeTab === 'tank' ? 0.7 : 1 }}
                  disabled={activeTab === 'tank'}
                >
                  {activeTab === 'tank' ? (
                    <option value="JM-IGC">JM-IGC</option>
                  ) : (
                    productionLines.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))
                  )}
                </select>
                {activeTab !== 'tank' && (
                  <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Settings size={18} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>ASSIGNED LEAD</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: 0 }}>
                <UserCheck size={18} color="var(--text-secondary)" />
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: selectedEmployee ? 'var(--accent-primary)' : 'var(--text-muted)', outline: 'none', fontWeight: '600', minWidth: '150px' }}
                >
                  <option value="">-- Optional --</option>
                  {employees.filter(e => e.department === 'Production' && e.status === 'Active').map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleCopyFromYesterday} 
              style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Copy size={18} /> Copy Last Date
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleClearGrid} 
              style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={18} /> Clear Grid
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={isSaving}
              style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : saveSuccess ? (
                <><Check size={18} /> Saved Successfully</>
              ) : (
                <><Save size={18} /> Save Grid</>
              )}
            </button>
          </div>
        </div>

        {/* Line Settings Panel */}
        {showSettings && (
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage Production Lines</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input type="text" className="input-field" placeholder="New Line Name (e.g. JR + JM)" value={newLineName} onChange={e => setNewLineName(e.target.value)} />
              <button className="btn btn-primary" onClick={handleAddLine}><Plus size={18} /> Add Line</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {productionLines.map(line => (
                <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{line}</span>
                  <button onClick={() => handleDeleteLine(line)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spreadsheet Entry Grid */}
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          {activeTab === 'transformer' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>CAPACITY RATING</th>
                  <th style={{ padding: '1rem', color: 'var(--text-primary)' }}>BOX UP</th>
                  <th style={{ padding: '1rem', color: 'var(--text-primary)' }}>ASSEMBLY (CCA)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-primary)' }}>HT WINDING</th>
                  <th style={{ padding: '1rem', color: 'var(--text-primary)' }}>LT WINDING</th>
                  <th style={{ padding: '1rem', color: 'var(--success)' }}>ALREADY SUPPLIED</th>
                </tr>
              </thead>
              <tbody>
                {displayCapacities.map(cap => (
                  <tr key={cap} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--accent-primary)' }}>{cap}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" min="0" className="input-field" style={{ width: '100%', textAlign: 'center', backgroundColor: gridData[cap]?.['Box Up'] ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }} 
                        value={gridData[cap]?.['Box Up'] ?? ''} 
                        onChange={e => handleGridChange(cap, 'Box Up', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" min="0" className="input-field" style={{ width: '100%', textAlign: 'center', backgroundColor: gridData[cap]?.['CCA'] ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }} 
                        value={gridData[cap]?.['CCA'] ?? ''} 
                        onChange={e => handleGridChange(cap, 'CCA', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" min="0" className="input-field" style={{ width: '100%', textAlign: 'center', backgroundColor: gridData[cap]?.['HT Winding'] ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }} 
                        value={gridData[cap]?.['HT Winding'] ?? ''} 
                        onChange={e => handleGridChange(cap, 'HT Winding', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" min="0" className="input-field" style={{ width: '100%', textAlign: 'center', backgroundColor: gridData[cap]?.['LT Winding'] ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }} 
                        value={gridData[cap]?.['LT Winding'] ?? ''} 
                        onChange={e => handleGridChange(cap, 'LT Winding', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '700', fontSize: '1.1rem', color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                      {getSuppliedForCapacity(cap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>COMPONENT</th>
                  {displayCapacities.map(cap => (
                    <th key={cap} style={{ padding: '1rem', color: 'var(--accent-primary)', minWidth: '100px' }}>{cap}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Tanks Fabricated</td>
                  {displayCapacities.map(cap => (
                    <td key={cap} style={{ padding: '0.5rem' }}>
                      <input type="number" min="0" className="input-field" style={{ width: '100%', textAlign: 'center', backgroundColor: gridData[cap]?.['Tanks Fabricated'] ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }} 
                        value={gridData[cap]?.['Tanks Fabricated'] ?? ''} 
                        onChange={e => handleGridChange(cap, 'Tanks Fabricated', e.target.value)} 
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Add Extra Rating Row */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem' }}>
          <select 
            className="input-field" 
            value={newCapacityToAdd} 
            onChange={(e) => setNewCapacityToAdd(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">-- Add Extra Rating --</option>
            {capacities.filter(c => !displayCapacities.includes(c)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {/* Allow custom manual entry if not in list */}
          <input 
            type="text" 
            className="input-field" 
            placeholder="Or type custom rating..." 
            value={newCapacityToAdd} 
            onChange={(e) => setNewCapacityToAdd(e.target.value)} 
            style={{ minWidth: '200px' }}
          />
          <button className="btn btn-primary" onClick={handleAddExtraCapacity} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Row
          </button>
        </div>

        {/* Daily Summary (All Lines) */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListFilter size={20} color="var(--accent-primary)" /> Global Production Summary ({formatDate(selectedDate)}) - All Lines
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Transformer Summary Table */}
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '1rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Transformer Manufacturing</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: 'var(--text-muted)' }}>CAPACITY</th>
                    <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>BOX UP</th>
                    <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>CCA</th>
                    <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>HT</th>
                    <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>LT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(dailySummary).filter(cap => dailySummary[cap]['Box Up'] > 0 || dailySummary[cap]['CCA'] > 0 || dailySummary[cap]['HT Winding'] > 0 || dailySummary[cap]['LT Winding'] > 0).map(cap => {
                    const data = dailySummary[cap];
                    return (
                      <tr key={cap} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)' }}>{cap}</td>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{data['Box Up'] || '-'}</td>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{data['CCA'] || '-'}</td>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{data['HT Winding'] || '-'}</td>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{data['LT Winding'] || '-'}</td>
                      </tr>
                    );
                  })}
                  {Object.keys(dailySummary).filter(cap => dailySummary[cap]['Box Up'] > 0 || dailySummary[cap]['CCA'] > 0 || dailySummary[cap]['HT Winding'] > 0 || dailySummary[cap]['LT Winding'] > 0).length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '1rem', color: 'var(--text-muted)' }}>No transformer production logged for this date.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tank Fabrication Summary Table */}
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '1rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Tank Fabrication</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: 'var(--text-muted)' }}>CAPACITY</th>
                    <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>TOTAL TANKS FABRICATED</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(dailySummary).filter(cap => dailySummary[cap]['Tanks Fabricated'] > 0).map(cap => {
                    const data = dailySummary[cap];
                    return (
                      <tr key={cap} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)' }}>{cap}</td>
                        <td style={{ padding: '0.8rem', fontWeight: '500', color: 'var(--accent-primary)' }}>{data['Tanks Fabricated'] || '-'}</td>
                      </tr>
                    );
                  })}
                  {Object.keys(dailySummary).filter(cap => dailySummary[cap]['Tanks Fabricated'] > 0).length === 0 && (
                    <tr><td colSpan="2" style={{ padding: '1rem', color: 'var(--text-muted)' }}>No tank fabrication logged for this date.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductionTracker;
