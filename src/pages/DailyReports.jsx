import React, { useState, useEffect } from 'react';
import { useDailyReports } from '../context/DailyReportContext';
import { usePO } from '../context/POContext';
import { useTasks } from '../context/TaskContext';
import { Save, Check, FileText, Link } from 'lucide-react';
import '../components/layout/Layout.css';

const DailyReports = () => {
  const { reports, fetchReportsForDate, saveReport, loading } = useDailyReports();
  const { pos, capacities } = usePO();
  const { tasks, addTask, addLatestUpdate } = useTasks();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('morning');
  const [activeTab, setActiveTab] = useState('Box-up');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const saveDraftToLocal = (data) => {
    localStorage.setItem(`draft_report_${selectedDate}_${selectedShift}`, JSON.stringify(data));
    setLastSaved(new Date());
  };

  const tabs = ['Box-up', 'CCA', 'Winding Section', 'Core Cutting', 'Tank Fabrication', 'Loading / Unloading'];
  const [mainTab, setMainTab] = useState('Daily Summary');
  const [summaryShift, setSummaryShift] = useState('Latest');

  const normalizeDraft = (data) => {
    const newData = JSON.parse(JSON.stringify(data));
    tabs.forEach(tab => {
      const sec = newData[tab];
      if (!sec) return;
      if (sec.machineProblems === undefined) {
        sec.machineProblems = [];
        if (sec.machineProblem) {
          sec.machineProblems.push({ desc: sec.machineProblemDesc||'', action: sec.machineProblemAction||'', eta: sec.machineProblemETA||'', taskId: sec.machineProblemTaskId||null });
        }
        delete sec.machineProblem; delete sec.machineProblemDesc; delete sec.machineProblemAction; delete sec.machineProblemETA; delete sec.machineProblemTaskId;
      }
      if (sec.materialShortages === undefined) {
        sec.materialShortages = [];
        if (sec.materialShortage) {
          sec.materialShortages.push({ desc: sec.materialShortageDesc||'', action: sec.materialShortageAction||'', eta: sec.materialShortageETA||'', taskId: sec.materialShortageTaskId||null });
        }
        delete sec.materialShortage; delete sec.materialShortageDesc; delete sec.materialShortageAction; delete sec.materialShortageETA; delete sec.materialShortageTaskId;
      }
      if (tab === 'Winding Section' && sec.ratingsTable) {
        sec.ratingsTable = sec.ratingsTable.map(r => {
          if (r.count !== undefined && r.ltCount === undefined && r.htCount === undefined) {
            return { rating: r.rating, ltCount: r.count, htCount: '' };
          }
          return r;
        });
      }
    });
    return newData;
  };

  const defaultIssues = { 
    machineProblems: [],
    materialShortages: [],
    remarks: '' 
  };

  // Default empty structure
  const emptyReport = {
    'Box-up': { mainTable: [{qty: '', rating: ''}], oven1: [], oven2: [], ...defaultIssues },
    'CCA': { mainTable: [{qty: '', rating: ''}], oven1: [], oven2: [], ...defaultIssues },
    'Winding Section': { ltWinders: '', htWinders: '', ratingsTable: [], ...defaultIssues },
    'Core Cutting': { 
      ratingInOven: '', openingTime: '', cuttingRating: '', nextOvenTime: '', testingTable: [], 
      ribbonStock: { '142.2mm': { available: '', incoming: '' }, '170.2mm': { available: '', incoming: '' }, '213.4mm': { available: '', incoming: '' } },
      ...defaultIssues 
    },
    'Tank Fabrication': { weldersPresent: '', ratingsTable: [{rating: '', qty: ''}], ...defaultIssues },
    'Loading / Unloading': {
      unloadingExpected: '', unloadingCompleted: '',
      loadingTanks: [{ rating: '', qty: '' }], loadingPOs: [{ poNumber: '', qty: '' }], loadingPlanned: '',
      ...defaultIssues
    }
  };

  const [formData, setFormData] = useState(JSON.parse(JSON.stringify(emptyReport)));

  // Offline Draft Load
  useEffect(() => {
    const draft = localStorage.getItem(`draft_report_${selectedDate}_${selectedShift}`);
    if (draft) {
      try {
        setFormData(normalizeDraft({ ...JSON.parse(JSON.stringify(emptyReport)), ...JSON.parse(draft) }));
      } catch(e) {}
    }
  }, [selectedDate, selectedShift]);

  // Fetch reports on date change
  useEffect(() => {
    fetchReportsForDate(selectedDate);
  }, [selectedDate]); // eslint-disable-line

  // Auto-populate logic & loading from DB
  useEffect(() => {
    const currentReport = reports.find(r => r.shift === selectedShift);
    if (currentReport && Object.keys(currentReport.data).length > 0) {
      setFormData(normalizeDraft({ ...JSON.parse(JSON.stringify(emptyReport)), ...currentReport.data }));
    } else {
      // If empty, try to auto-populate from previous shift today
      const prevShift = selectedShift === 'evening' ? 'afternoon' : (selectedShift === 'afternoon' ? 'morning' : null);
      if (prevShift) {
        const prevReport = reports.find(r => r.shift === prevShift);
        if (prevReport && Object.keys(prevReport.data).length > 0) {
          // Clone it so they have fewest changes possible
          let cloned = normalizeDraft({ ...JSON.parse(JSON.stringify(emptyReport)), ...JSON.parse(JSON.stringify(prevReport.data)) });
          
          // SMART CARRY-OVER Logic:
          tabs.forEach(tab => {
            if (!cloned[tab]) return;
            // Check Task Status
            if (cloned[tab].machineProblems) {
              cloned[tab].machineProblems = cloned[tab].machineProblems.filter(mp => {
                if (!mp.taskId) return true;
                const t = tasks.find(tsk => tsk.id === mp.taskId);
                return !(t && t.status === 'Completed');
              });
            }
            if (cloned[tab].materialShortages) {
              cloned[tab].materialShortages = cloned[tab].materialShortages.filter(ms => {
                if (!ms.taskId) return true;
                const t = tasks.find(tsk => tsk.id === ms.taskId);
                return !(t && t.status === 'Completed');
              });
            }
          });

          if (cloned['Loading / Unloading']) {
             // Reset completed lists, carry over expected targets
             cloned['Loading / Unloading'].unloadingCompleted = '';
             cloned['Loading / Unloading'].loadingTanks = [{ rating: '', qty: '' }];
             cloned['Loading / Unloading'].loadingPOs = [{ poNumber: '', qty: '' }];
          }

          setFormData(cloned);
        } else {
          setFormData(JSON.parse(JSON.stringify(emptyReport)));
        }
      } else {
        setFormData(JSON.parse(JSON.stringify(emptyReport)));
      }
    }
  }, [reports, selectedShift, tasks]); // eslint-disable-line

  // Handle auto-save draft
  const handleDataChange = (section, field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      saveDraftToLocal(updated);
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleTableChange = (section, tableField, index, colField, value) => {
    setFormData(prev => {
      const table = [...(prev[section][tableField] || [])];
      if (!table[index]) table[index] = {};
      table[index][colField] = value;
      const updated = { ...prev, [section]: { ...prev[section], [tableField]: table } };
      saveDraftToLocal(updated);
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleRibbonStockChange = (size, field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        'Core Cutting': {
          ...prev['Core Cutting'],
          ribbonStock: {
            ...prev['Core Cutting'].ribbonStock,
            [size]: {
              ...(prev['Core Cutting'].ribbonStock?.[size] || { available: '', incoming: '' }),
              [field]: value
            }
          }
        }
      };
      saveDraftToLocal(updated);
      return updated;
    });
    setSaveSuccess(false);
  };

  const removeTableRow = (section, tableField, index) => {
    setFormData(prev => {
      const table = [...(prev[section][tableField] || [])];
      table.splice(index, 1);
      return { ...prev, [section]: { ...prev[section], [tableField]: table } };
    });
  };

  const addTableRow = (section, tableField, emptyRow) => {
    setFormData(prev => {
      const table = [...(prev[section][tableField] || []), emptyRow];
      return { ...prev, [section]: { ...prev[section], [tableField]: table } };
    });
  };

  const handleProblemChange = (section, type, index, field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      const arr = [...(updated[section][type] || [])];
      if (!arr[index]) arr[index] = {};
      arr[index] = { ...arr[index], [field]: value };
      updated[section][type] = arr;
      saveDraftToLocal(updated);
      return updated;
    });
    setSaveSuccess(false);
  };

  const addProblem = (section, type) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[section][type] = [...(updated[section][type] || []), { desc: '', action: '', eta: '', taskId: null }];
      return updated;
    });
  };

  const removeProblem = (section, type, index) => {
    setFormData(prev => {
      const updated = { ...prev };
      const arr = [...(updated[section][type] || [])];
      arr.splice(index, 1);
      updated[section][type] = arr;
      saveDraftToLocal(updated);
      return updated;
    });
  };

  const [validationError, setValidationError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);

  const validateSection = (section) => {
    const data = formData[section];
    let err = null;
    let fields = [];
    if (section === 'Box-up' || section === 'CCA') {
      const hasMain = data.mainTable && data.mainTable.length > 0 && data.mainTable[0].qty !== '' && data.mainTable[0].rating !== '';
      if (!hasMain) {
        err = `Please fill the primary Quantity and Rating in ${section} (enter 0 if none).`;
        fields = [`${section}_qty`, `${section}_rating`];
      }
    }
    if (section === 'Winding Section') {
      if (data.ltWinders === '' || data.htWinders === '') {
        err = 'Please enter the number of LT and HT winders.';
        if (data.ltWinders === '') fields.push('ltWinders');
        if (data.htWinders === '') fields.push('htWinders');
      }
    }
    if (section === 'Core Cutting') {
      if (!data.ratingInOven || !data.openingTime || !data.cuttingRating || !data.nextOvenTime) {
        err = 'Please fill all primary Core Cutting details (Rating, Opening Time, Next Oven Time).';
        if (!data.ratingInOven) fields.push('ratingInOven');
        if (!data.openingTime) fields.push('openingTime');
        if (!data.cuttingRating) fields.push('cuttingRating');
        if (!data.nextOvenTime) fields.push('nextOvenTime');
      }
    }
    if (section === 'Tank Fabrication') {
      if (data.weldersPresent === '') {
        err = 'Please enter the number of Welders present.';
        fields.push('weldersPresent');
      }
    }
    return { error: err, fields };
  };

  const handleNextSection = (currentSection) => {
    const { error, fields } = validateSection(currentSection);
    if (error) {
      setValidationError(error);
      setInvalidFields(fields);
      return;
    }
    setValidationError('');
    setInvalidFields([]);
    
    // Auto-save draft on next
    saveDraftToLocal(formData);
    
    const currentIndex = tabs.indexOf(currentSection);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    // Validate all
    for (const t of tabs) {
      const { error, fields } = validateSection(t);
      if (error) {
        setActiveTab(t);
        setValidationError(error);
        setInvalidFields(fields);
        return;
      }
    }
    setValidationError('');
    setInvalidFields([]);
    setIsSaving(true);

    // Deep clone formData to mutate with task IDs before saving
    let dataToSave = JSON.parse(JSON.stringify(formData));

    // Process tasks for machine problems and material shortages
    for (const t of tabs) {
      if (!dataToSave[t]) continue;
      
      const secData = dataToSave[t];
      
      // Machine Problem Tasks
      if (secData.machineProblems && secData.machineProblems.length > 0) {
        for (const mp of secData.machineProblems) {
          if (!mp.taskId) {
            const res = await addTask({
              task_title: `[System: Daily Report] Machine Problem in ${t}`,
              task_desc: `Issue: ${mp.desc}\nAction Taken: ${mp.action || 'None'}\nETA: ${mp.eta || 'Unknown'}`,
              priority: 'High',
              deadline: mp.eta || new Date().toISOString().split('T')[0],
              status: 'In Progress',
              assigned_to: 'Admin',
              department: 'Production'
            });
            if (res.success && res.data) {
              mp.taskId = res.data[0].id;
            }
          } else {
            await addLatestUpdate(mp.taskId, `Shift ${selectedShift}: Action Taken - ${mp.action || 'None'}`);
          }
        }
      }

      // Material Shortage Tasks
      if (secData.materialShortages && secData.materialShortages.length > 0) {
        for (const ms of secData.materialShortages) {
          if (!ms.taskId) {
            const res = await addTask({
              task_title: `[System: Daily Report] Material Shortage in ${t}`,
              task_desc: `Issue: ${ms.desc}\nAction Taken: ${ms.action || 'None'}\nETA: ${ms.eta || 'Unknown'}`,
              priority: 'High',
              deadline: ms.eta || new Date().toISOString().split('T')[0],
              status: 'In Progress',
              assigned_to: 'Admin', 
              department: 'Inventory'
            });
            if (res.success && res.data) {
              ms.taskId = res.data[0].id;
            }
          } else {
            await addLatestUpdate(ms.taskId, `Shift ${selectedShift}: Action Taken - ${ms.action || 'None'}`);
          }
        }
      }
    }

    setFormData(dataToSave);

    const success = await saveReport(selectedDate, selectedShift, dataToSave);
    if (success) {
      setSaveSuccess(true);
      localStorage.removeItem(`draft_report_${selectedDate}_${selectedShift}`);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const renderSectionFooter = (section) => (
    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--danger)', fontWeight: '500' }}>{validationError && activeTab === section ? validationError : ''}</span>
      <button className="btn btn-primary" onClick={() => handleNextSection(section)}>
        {section === 'Loading / Unloading' ? 'Submit Entire Report' : 'Save Section & Next'}
      </button>
    </div>
  );

  const renderCommonFields = (section) => (
    <div className="report-section card" style={{ marginTop: '20px' }}>
      <h3>Issues & Remarks</h3>
      <div className="grid-2">
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Machine Problems</label>
            <button className="btn btn-secondary" onClick={() => addProblem(section, 'machineProblems')} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>+ Add Machine Problem</button>
          </div>
          {(formData[section].machineProblems || []).map((mp, i) => (
            <div key={i} style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => removeProblem(section, 'machineProblems', i)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button></div>
              <div className="grid-3" style={{ marginBottom: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Specify Machine Problem</label>
                  <input type="text" className="input-field" placeholder="Describe issue..." value={mp.desc || ''} onChange={(e) => handleProblemChange(section, 'machineProblems', i, 'desc', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Action Taken</label>
                  <input type="text" className="input-field" placeholder="What has been done?" value={mp.action || ''} onChange={(e) => handleProblemChange(section, 'machineProblems', i, 'action', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Expected Resolution Date</label>
                  <input type="date" className="input-field" value={mp.eta || ''} onChange={(e) => handleProblemChange(section, 'machineProblems', i, 'eta', e.target.value)} />
                </div>
              </div>
              {mp.taskId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Link size={14} /> Linked to Pending Task #{mp.taskId}
                </div>
              )}
            </div>
          ))}
          {(!formData[section].machineProblems || formData[section].machineProblems.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>No machine problems reported.</p>
          )}
        </div>
        
        <div className="input-group" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Material Shortages</label>
            <button className="btn btn-secondary" onClick={() => addProblem(section, 'materialShortages')} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>+ Add Material Shortage</button>
          </div>
          {(formData[section].materialShortages || []).map((ms, i) => (
            <div key={i} style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--warning)', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => removeProblem(section, 'materialShortages', i)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button></div>
              <div className="grid-3" style={{ marginBottom: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Specify Material Shortage</label>
                  <input type="text" className="input-field" placeholder="Describe shortage..." value={ms.desc || ''} onChange={(e) => handleProblemChange(section, 'materialShortages', i, 'desc', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Action Taken</label>
                  <input type="text" className="input-field" placeholder="What has been done?" value={ms.action || ''} onChange={(e) => handleProblemChange(section, 'materialShortages', i, 'action', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Expected Resolution Date</label>
                  <input type="date" className="input-field" value={ms.eta || ''} onChange={(e) => handleProblemChange(section, 'materialShortages', i, 'eta', e.target.value)} />
                </div>
              </div>
              {ms.taskId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Link size={14} /> Linked to Pending Task #{ms.taskId}
                </div>
              )}
            </div>
          ))}
          {(!formData[section].materialShortages || formData[section].materialShortages.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>No material shortages reported.</p>
          )}
        </div>
      </div>
      <div className="input-group" style={{ marginTop: '10px' }}>
        <label className="input-label">Remarks (If any)</label>
        <textarea 
          className="input-field" 
          rows="2"
          value={formData[section].remarks || ''} 
          onChange={(e) => handleDataChange(section, 'remarks', e.target.value)}
        ></textarea>
      </div>
      {renderSectionFooter(section)}
    </div>
  );

  const renderBoxUp = () => (
    <div className="animate-fade-in">
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <h3>Box-up Details</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('Box-up', 'mainTable', {qty:'', rating:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Quantity being boxed up</th><th>Rating</th><th style={{width: '40px'}}></th></tr></thead>
          <tbody>
            {(formData['Box-up'].mainTable || []).map((row, i) => (
              <tr key={i}>
                <td><input type="number"  value={row.qty||''} onChange={e=>handleTableChange('Box-up','mainTable',i,'qty',e.target.value)}/></td>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Box-up','mainTable',i,'rating',e.target.value)}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2" style={{ marginTop: '20px' }}>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <h3>Material in Oven 1</h3>
            <button className="btn btn-secondary" onClick={() => addTableRow('Box-up', 'oven1', {qty:'', rating:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
          </div>
          <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
            <thead><tr><th>Qty</th><th>Rating</th><th style={{width: '40px'}}></th></tr></thead>
            <tbody>
              {formData['Box-up'].oven1.map((row, i) => (
                <tr key={i}>
                  <td><input type="number"  value={row.qty||''} onChange={e=>handleTableChange('Box-up','oven1',i,'qty',e.target.value)}/></td>
                  <td>
                    <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Box-up','oven1',i,'rating',e.target.value)}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <h3>Material in Oven 2</h3>
            <button className="btn btn-secondary" onClick={() => addTableRow('Box-up', 'oven2', {qty:'', rating:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
          </div>
          <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
            <thead><tr><th>Qty</th><th>Rating</th><th style={{width: '40px'}}></th></tr></thead>
            <tbody>
              {formData['Box-up'].oven2.map((row, i) => (
                <tr key={i}>
                  <td><input type="number"  value={row.qty||''} onChange={e=>handleTableChange('Box-up','oven2',i,'qty',e.target.value)}/></td>
                  <td>
                    <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Box-up','oven2',i,'rating',e.target.value)}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {renderCommonFields('Box-up')}
    </div>
  );

  const renderCCA = () => (
    <div className="animate-fade-in">
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <h3>CCA Details</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('CCA', 'mainTable', {qty:'', rating:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Quantity of Assembly</th><th>Rating</th><th style={{width: '40px'}}></th></tr></thead>
          <tbody>
            {(formData['CCA'].mainTable || []).map((row, i) => (
              <tr key={i}>
                <td><input type="number"  value={row.qty||''} onChange={e=>handleTableChange('CCA','mainTable',i,'qty',e.target.value)}/></td>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('CCA','mainTable',i,'rating',e.target.value)}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2" style={{ marginTop: '20px' }}>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <h3>Oven 1 Material Load</h3>
            <button className="btn btn-secondary" onClick={() => addTableRow('CCA', 'oven1', {material:'', time:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add</button>
          </div>
          <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
            <thead><tr><th>Material to Load</th><th>Time</th><th style={{width: '40px'}}></th></tr></thead>
            <tbody>
              {formData['CCA'].oven1.map((row, i) => (
                <tr key={i}>
                  <td><input type="text"  value={row.material||''} onChange={e=>handleTableChange('CCA','oven1',i,'material',e.target.value)}/></td>
                  <td><input type="time"  value={row.time||''} onChange={e=>handleTableChange('CCA','oven1',i,'time',e.target.value)}/></td><td><button type="button" className="icon-btn-small" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('CCA', 'oven1', i)} title="Remove Row"><Trash2 size={16} /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <h3>Oven 2 Material Load</h3>
            <button className="btn btn-secondary" onClick={() => addTableRow('CCA', 'oven2', {material:'', time:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add</button>
          </div>
          <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
            <thead><tr><th>Material to Load</th><th>Time</th><th style={{width: '40px'}}></th></tr></thead>
            <tbody>
              {formData['CCA'].oven2.map((row, i) => (
                <tr key={i}>
                  <td><input type="text"  value={row.material||''} onChange={e=>handleTableChange('CCA','oven2',i,'material',e.target.value)}/></td>
                  <td><input type="time"  value={row.time||''} onChange={e=>handleTableChange('CCA','oven2',i,'time',e.target.value)}/></td><td><button type="button" className="icon-btn-small" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('CCA', 'oven2', i)} title="Remove Row"><Trash2 size={16} /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {renderCommonFields('CCA')}
    </div>
  );

  const renderWinding = () => {
    const totalWinders = (Number(formData['Winding Section'].ltWinders) || 0) + (Number(formData['Winding Section'].htWinders) || 0);
    return (
      <div className="animate-fade-in">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Winding Personnel</h3>
            <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--accent-primary)', background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>Total Winders Present: {totalWinders}</span>
          </div>
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div className="input-group">
              <label className="input-label">No. of LT Winders Present</label>
              <input type="number" className="input-field" value={formData['Winding Section'].ltWinders} onChange={(e) => handleDataChange('Winding Section', 'ltWinders', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">No. of HT Winders Present</label>
              <input type="number" className="input-field" value={formData['Winding Section'].htWinders} onChange={(e) => handleDataChange('Winding Section', 'htWinders', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <h3>Winders per Rating</h3>
            <button className="btn btn-secondary" onClick={() => addTableRow('Winding Section', 'ratingsTable', {rating:'', ltCount:'', htCount:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
          </div>
          <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
            <thead><tr><th>Rating</th><th>LT Winders Count</th><th>HT Winders Count</th><th style={{width: '40px'}}></th></tr></thead>
            <tbody>
              {formData['Winding Section'].ratingsTable.map((row, i) => (
                <tr key={i}>
                  <td>
                    <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'rating',e.target.value)}/>
                  </td>
                  <td><input type="number"  placeholder="0" value={row.ltCount||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'ltCount',e.target.value)}/></td>
                  <td><input type="number"  placeholder="0" value={row.htCount||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'htCount',e.target.value)}/></td><td><button type="button" className="icon-btn-small" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('Winding Section', 'ratingsTable', i)} title="Remove Row"><Trash2 size={16} /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderCommonFields('Winding Section')}
      </div>
    );
  };

  const renderCoreCutting = () => (
    <div className="animate-fade-in">
      <div className="card">
        <h3>Core Cutting Details</h3>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Rating inside Oven</label>
            <input type="text" list="capacities-list" className="input-field" placeholder="Select or type..." value={formData['Core Cutting'].ratingInOven} onChange={(e) => handleDataChange('Core Cutting', 'ratingInOven', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Opening Time of Oven</label>
            <input type="time" className="input-field" value={formData['Core Cutting'].openingTime} onChange={(e) => handleDataChange('Core Cutting', 'openingTime', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Cutting Rating</label>
            <input type="text" list="capacities-list" className="input-field" placeholder="Select or type..." value={formData['Core Cutting'].cuttingRating} onChange={(e) => handleDataChange('Core Cutting', 'cuttingRating', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Next Oven Time</label>
            <input type="time" className="input-field" value={formData['Core Cutting'].nextOvenTime} onChange={(e) => handleDataChange('Core Cutting', 'nextOvenTime', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <h3>Testing Done Till Sr. No.</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('Core Cutting', 'testingTable', {rating:'', srNo:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Rating</th><th>Testing Done Till Sr. No.</th><th style={{width: '40px'}}></th></tr></thead>
          <tbody>
            {formData['Core Cutting'].testingTable.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Core Cutting','testingTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="text"  value={row.srNo||''} onChange={e=>handleTableChange('Core Cutting','testingTable',i,'srNo',e.target.value)}/></td><td><button type="button" className="icon-btn-small" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('Core Cutting', 'testingTable', i)} title="Remove Row"><Trash2 size={16} /></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Amorphous Ribbon Stock</h3>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Ribbon Size</th><th>Available Coils</th><th>Incoming Coils</th><th style={{width: '40px'}}></th></tr></thead>
          <tbody>
            {['142.2mm', '170.2mm', '213.4mm'].map((size) => (
              <tr key={size}>
                <td style={{ fontWeight: '500', padding: '12px 16px' }}>{size}</td>
                <td><input type="number" placeholder="0" value={formData['Core Cutting'].ribbonStock?.[size]?.available || ''} onChange={e => handleRibbonStockChange(size, 'available', e.target.value)} /></td>
                <td><input type="number" placeholder="0" value={formData['Core Cutting'].ribbonStock?.[size]?.incoming || ''} onChange={e => handleRibbonStockChange(size, 'incoming', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderCommonFields('Core Cutting')}
    </div>
  );

  const renderTankFab = () => (
    <div className="animate-fade-in">
      <div className="card">
        <h3>Tank Fabrication Details</h3>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">No. of Welders Present</label>
            <input type="number" className="input-field" value={formData['Tank Fabrication'].weldersPresent} onChange={(e) => handleDataChange('Tank Fabrication', 'weldersPresent', e.target.value)} />
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <h3>Ratings Being Manufactured</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('Tank Fabrication', 'ratingsTable', {rating:'', qty:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Rating</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Rating</th><th>Quantity (Optional)</th><th style={{width: '40px'}}></th></tr></thead>
          <tbody>
            {(formData['Tank Fabrication'].ratingsTable || []).map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Tank Fabrication','ratingsTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="number"  value={row.qty||''} onChange={e=>handleTableChange('Tank Fabrication','ratingsTable',i,'qty',e.target.value)}/></td><td><button type="button" className="icon-btn-small" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('Tank Fabrication', 'ratingsTable', i)} title="Remove Row"><Trash2 size={16} /></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderCommonFields('Tank Fabrication')}
    </div>
  );

  const renderLoadingUnloading = () => (
    <div className="animate-fade-in">
      <div className="card">
        <h3>Unloading Details</h3>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Expected un-loading of material</label>
            <textarea className="input-field" rows="2" placeholder="Describe expected material..." value={formData['Loading / Unloading']?.unloadingExpected || ''} onChange={(e) => handleDataChange('Loading / Unloading', 'unloadingExpected', e.target.value)}></textarea>
          </div>
          <div className="input-group">
            <label className="input-label">Material unloaded till report was filed</label>
            <textarea className="input-field" rows="2" placeholder="List unloaded material..." value={formData['Loading / Unloading']?.unloadingCompleted || ''} onChange={(e) => handleDataChange('Loading / Unloading', 'unloadingCompleted', e.target.value)}></textarea>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <h3>Transformers Loaded (PO & Rating)</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('Loading / Unloading', 'loadingPOs', {poNumber:'', rating: '', qty:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>PO Number</th><th>Rating</th><th>Quantity</th><th style={{width: '40px'}}></th></tr></thead>
          <tbody>
            {(formData['Loading / Unloading']?.loadingPOs || []).map((row, i) => (
              <tr key={i}>
                <td>
                  <select className="input-field" style={{ marginBottom: 0 }} value={row.poNumber||''} onChange={e=>handleTableChange('Loading / Unloading','loadingPOs',i,'poNumber',e.target.value)}>
                    <option value="">Select PO Number...</option>
                    {pos?.map(po => <option key={po.id || po.poNo} value={po.poNo}>{po.poNo} ({po.companyName})</option>)}
                  </select>
                </td>
                <td><input type="text" list="capacities-list" placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Loading / Unloading','loadingPOs',i,'rating',e.target.value)}/></td>
                <td><input type="number" value={row.qty||''} onChange={e=>handleTableChange('Loading / Unloading','loadingPOs',i,'qty',e.target.value)}/></td><td><button type="button" className="icon-btn-small" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('Loading / Unloading', 'loadingPOs', i)} title="Remove Row"><Trash2 size={16} /></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="input-group">
          <label className="input-label">Loading planned for the day</label>
          <textarea className="input-field" rows="2" placeholder="Describe planned loading..." value={formData['Loading / Unloading']?.loadingPlanned || ''} onChange={(e) => handleDataChange('Loading / Unloading', 'loadingPlanned', e.target.value)}></textarea>
        </div>
      </div>
      
      {renderCommonFields('Loading / Unloading')}
    </div>
  );

  const renderSummary = () => {
    const eveningReportObj = reports.find(r => r.shift === 'evening');
    const afternoonReportObj = reports.find(r => r.shift === 'afternoon');
    const morningReportObj = reports.find(r => r.shift === 'morning');
    
    let latestReportObj = null;
    let latestData = {};
    if (summaryShift === 'Latest') {
      latestReportObj = eveningReportObj || afternoonReportObj || morningReportObj;
      latestData = latestReportObj?.data || formData;
    } else if (summaryShift === 'Morning') {
      latestReportObj = morningReportObj;
      latestData = latestReportObj?.data || emptyReport;
    } else if (summaryShift === 'Afternoon') {
      latestReportObj = afternoonReportObj;
      latestData = latestReportObj?.data || emptyReport;
    } else if (summaryShift === 'Evening') {
      latestReportObj = eveningReportObj;
      latestData = latestReportObj?.data || emptyReport;
    }

    const issues = [];
    ['Box-up', 'CCA', 'Winding Section', 'Core Cutting', 'Tank Fabrication', 'Loading / Unloading'].forEach(sec => {
       if (latestData[sec]?.machineProblems) {
         latestData[sec].machineProblems.forEach(mp => {
           if (mp.desc || mp.action) issues.push({ section: sec, type: 'Machine Problem', desc: mp.desc || 'N/A' });
         });
       }
       if (latestData[sec]?.materialShortages) {
         latestData[sec].materialShortages.forEach(ms => {
           if (ms.desc || ms.action) issues.push({ section: sec, type: 'Material Shortage', desc: ms.desc || 'N/A' });
         });
       }
    });

    const maxWelders = Math.max(
      Number(eveningReportObj?.data?.['Tank Fabrication']?.weldersPresent || 0),
      Number(afternoonReportObj?.data?.['Tank Fabrication']?.weldersPresent || 0),
      Number(morningReportObj?.data?.['Tank Fabrication']?.weldersPresent || 0),
      Number(formData['Tank Fabrication']?.weldersPresent || 0)
    );

    return (
      <div className="animate-fade-in card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3>Daily Summary for {selectedDate ? `${String(new Date(selectedDate).getDate()).padStart(2, '0')}-${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date(selectedDate).getMonth()]}-${new Date(selectedDate).getFullYear()}` : ''} ({summaryShift})</h3>
          <span className="status-badge" style={{ background: 'var(--success)20', color: 'var(--success)' }}>Auto-Generated</span>
        </div>
        
        {latestReportObj && latestReportObj.submitted_by ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Logged by <strong style={{ color: 'var(--text-primary)' }}>{latestReportObj.submitted_by}</strong> on {new Date(latestReportObj.timestamp).toLocaleDateString('en-GB')} at {new Date(latestReportObj.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {summaryShift === 'Latest' ? 'This summary aggregates data from the latest available shift for this date.' : `Displaying data for the ${summaryShift.toLowerCase()} shift.`}
          </p>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '20px' }}>
          
          {/* Box-up */}
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>📦 Box-up Activity</span>
              <span style={{ color: 'var(--text-secondary)' }}>Total Qty: <strong style={{ color: 'var(--text-primary)' }}>{latestData['Box-up']?.mainTable?.reduce((sum, r) => sum + (Number(r.qty) || 0), 0) || 0}</strong></span>
            </h4>
            {latestData['Box-up']?.mainTable?.some(r => r.qty || r.rating) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {latestData['Box-up'].mainTable.filter(r => r.qty || r.rating).map((r, i) => (
                  <span key={i} className="status-badge" style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                    {r.rating || 'Unknown'}: <strong style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>{r.qty || 0}</strong>
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)' }}>No box-up activity recorded.</span>}
          </div>

          {/* CCA */}
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>⚙️ CCA Activity</span>
              <span style={{ color: 'var(--text-secondary)' }}>Total Qty: <strong style={{ color: 'var(--text-primary)' }}>{latestData['CCA']?.mainTable?.reduce((sum, r) => sum + (Number(r.qty) || 0), 0) || 0}</strong></span>
            </h4>
            {latestData['CCA']?.mainTable?.some(r => r.qty || r.rating) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {latestData['CCA'].mainTable.filter(r => r.qty || r.rating).map((r, i) => (
                  <span key={i} className="status-badge" style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                    {r.rating || 'Unknown'}: <strong style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>{r.qty || 0}</strong>
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)' }}>No CCA activity recorded.</span>}
          </div>

          {/* Winding Section */}
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>🧵 Winding Section</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>LT Winders: <strong style={{ color: 'var(--text-primary)' }}>{latestData['Winding Section']?.ltWinders || 0}</strong> | HT Winders: <strong style={{ color: 'var(--text-primary)' }}>{latestData['Winding Section']?.htWinders || 0}</strong></span>
            </h4>
            {latestData['Winding Section']?.ratingsTable?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {latestData['Winding Section'].ratingsTable.filter(r => r.ltCount || r.htCount || r.rating).map((r, i) => (
                  <span key={i} className="status-badge" style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                    {r.rating || 'Unknown'}: <strong style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>{r.ltCount || 0} LT / {r.htCount || 0} HT</strong>
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)' }}>No winding ratings recorded.</span>}
          </div>

          {/* Core Cutting */}
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>✂️ Core Cutting & Ribbon Stock</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px' }}>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Rating in Oven:</strong> <span style={{ color: 'var(--text-primary)' }}>{latestData['Core Cutting']?.ratingInOven || 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Oven Opening:</strong> <span style={{ color: 'var(--text-primary)' }}>{latestData['Core Cutting']?.openingTime ? new Date(`1970-01-01T${latestData['Core Cutting'].openingTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Cutting Rating:</strong> <span style={{ color: 'var(--text-primary)' }}>{latestData['Core Cutting']?.cuttingRating || 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Next Oven Time:</strong> <span style={{ color: 'var(--text-primary)' }}>{latestData['Core Cutting']?.nextOvenTime ? new Date(`1970-01-01T${latestData['Core Cutting'].nextOvenTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span></div>
            </div>
            <div className="grid-2">
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Tested Ratings:</strong>
                {latestData['Core Cutting']?.testingTable?.length > 0 ? (
                  <ul style={{ margin: '8px 0 0 20px', color: 'var(--text-primary)' }}>
                    {latestData['Core Cutting'].testingTable.filter(r => r.rating || r.srNo).map((r, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{r.rating || 'Unknown'} - Till Sr. No: <strong>{r.srNo || 'N/A'}</strong></li>
                    ))}
                  </ul>
                ) : <div style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No testing recorded.</div>}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Amorphous Ribbon Stock:</strong>
                <ul style={{ margin: '8px 0 0 20px', color: 'var(--text-primary)' }}>
                  {['142.2mm', '170.2mm', '213.4mm'].map(size => {
                    const av = latestData['Core Cutting']?.ribbonStock?.[size]?.available;
                    const inc = latestData['Core Cutting']?.ribbonStock?.[size]?.incoming;
                    if (!av && !inc) return null;
                    return <li key={size} style={{ marginBottom: '4px' }}>{size}: Available: <strong style={{ color: 'var(--accent-primary)' }}>{av||0}</strong> | Incoming: <strong style={{ color: 'var(--success)' }}>{inc||0}</strong></li>;
                  })}
                  {(!latestData['Core Cutting']?.ribbonStock || !Object.values(latestData['Core Cutting'].ribbonStock).some(s => s.available || s.incoming)) && (
                    <li style={{ color: 'var(--text-muted)', listStyle: 'none', marginLeft: '-20px' }}>No stock data recorded.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Tank Fabrication */}
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>🏗️ Tank Fabrication</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Max Welders Present: <strong style={{ color: 'var(--text-primary)' }}>{maxWelders}</strong></span>
            </h4>
            {latestData['Tank Fabrication']?.ratingsTable?.some(r => r.qty || r.rating) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {latestData['Tank Fabrication'].ratingsTable.filter(r => r.qty || r.rating).map((r, i) => (
                  <span key={i} className="status-badge" style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                    {r.rating || 'Unknown'}: <strong style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>{r.qty || 0}</strong>
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)' }}>No tanks recorded.</span>}
          </div>
          {/* Loading / Unloading */}
          <div style={{ padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>🚚 Loading & Unloading</span>
            </h4>
            <div className="grid-2">
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Unloading:</strong>
                <ul style={{ margin: '8px 0 0 20px', color: 'var(--text-primary)' }}>
                  <li style={{ marginBottom: '4px' }}>Expected: <strong>{latestData['Loading / Unloading']?.unloadingExpected || 'None'}</strong></li>
                  <li style={{ marginBottom: '4px' }}>Completed: <strong>{latestData['Loading / Unloading']?.unloadingCompleted || 'None'}</strong></li>
                </ul>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Loading:</strong>
                <ul style={{ margin: '8px 0 0 20px', color: 'var(--text-primary)' }}>
                  <li style={{ marginBottom: '4px' }}>Planned: <strong>{latestData['Loading / Unloading']?.loadingPlanned || 'None'}</strong></li>
                  <li style={{ marginBottom: '4px' }}>
                    Tanks Loaded: <strong>{latestData['Loading / Unloading']?.loadingTanks?.reduce((sum, r) => sum + (Number(r.qty) || 0), 0) || 0}</strong>
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    POs Loaded: <strong>{latestData['Loading / Unloading']?.loadingPOs?.reduce((sum, r) => sum + (Number(r.qty) || 0), 0) || 0}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
        </div>

        <h4 style={{ marginTop: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Reported Issues</h4>
        {issues.length > 0 ? (
          <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
            <thead><tr><th style={{ textAlign: 'left' }}>Section</th><th style={{ textAlign: 'left' }}>Issue Type</th><th style={{ textAlign: 'left' }}>Description</th><th style={{width: '40px'}}></th></tr></thead>
            <tbody>
              {issues.map((iss, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500' }}>{iss.section}</td>
                  <td><span className="status-badge" style={{ background: iss.type === 'Machine Problem' ? '#ef444420' : '#f59e0b20', color: iss.type === 'Machine Problem' ? '#ef4444' : '#f59e0b' }}>{iss.type}</span></td>
                  <td>{iss.desc || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)', padding: '10px 0' }}>No issues reported on this date.</p>
        )}
      </div>
    );
  };

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Global datalist for combo boxes */}
      <datalist id="capacities-list">
        {capacities.map(c => <option key={c} value={c} />)}
      </datalist>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Daily Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Submit daily production reports or view date summaries.
          </p>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {['Daily Summary', 'Daily Report'].map(t => (
          <button 
            key={t}
            onClick={() => setMainTab(t)}
            style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
              color: mainTab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: mainTab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
              fontWeight: mainTab === t ? '600' : '500'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {mainTab === 'Daily Report' ? (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Data Entry</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {lastSaved && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Draft auto-saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : <><Save size={18} /> Save Report</>}
              </button>
              {saveSuccess && <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={18} /> Saved!</span>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Report Date</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="date-overlay"
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                  <input 
                    type="text" 
                    className="input-field" 
                    value={selectedDate ? `${String(new Date(selectedDate).getDate()).padStart(2, '0')}-${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date(selectedDate).getMonth()]}-${new Date(selectedDate).getFullYear()}` : ''}
                    readOnly
                    style={{ pointerEvents: 'none', backgroundColor: 'var(--bg-secondary)' }}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Shift Timing</label>
                <select className="input-field" value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)}>
                  <option value="morning">Morning (9-10 AM)</option>
                  <option value="afternoon">Afternoon (2-3 PM)</option>
                  <option value="evening">Evening (5-6 PM)</option>
                </select>
              </div>
            </div>
            {loading && <p style={{ color: 'var(--text-muted)' }}>Loading report data...</p>}
          </div>

          <div className="tabs wizard-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', alignItems: 'center' }}>
            {tabs.map((t, idx) => {
              const { error } = validateSection(t);
              const isCompleted = !error;
              return (
                <React.Fragment key={t}>
                  <button 
                    onClick={() => setActiveTab(t)}
                    style={{
                      background: activeTab === t ? 'var(--accent-primary)' : (isCompleted ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'),
                      border: activeTab === t ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      padding: '0.5rem 1rem', cursor: 'pointer',
                      color: activeTab === t ? '#fff' : 'var(--text-primary)',
                      borderRadius: '20px',
                      fontWeight: activeTab === t ? '600' : '500',
                      fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    {isCompleted && activeTab !== t && <Check size={14} color="var(--success)" />}
                    {t}
                  </button>
                  {idx < tabs.length - 1 && <div style={{ height: '2px', width: '20px', background: 'var(--border-color)' }} />}
                </React.Fragment>
              )
            })}
          </div>

          <div className="tab-content">
            {activeTab === 'Box-up' && renderBoxUp()}
            {activeTab === 'CCA' && renderCCA()}
            {activeTab === 'Winding Section' && renderWinding()}
            {activeTab === 'Core Cutting' && renderCoreCutting()}
            {activeTab === 'Tank Fabrication' && renderTankFab()}
            {activeTab === 'Loading / Unloading' && renderLoadingUnloading()}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="grid-2">
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <label className="input-label">Select Date to View Summary</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="date-overlay"
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                  <input 
                    type="text" 
                    className="input-field" 
                    value={selectedDate ? `${String(new Date(selectedDate).getDate()).padStart(2, '0')}-${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date(selectedDate).getMonth()]}-${new Date(selectedDate).getFullYear()}` : ''}
                    readOnly
                    style={{ pointerEvents: 'none', backgroundColor: 'var(--bg-secondary)' }}
                  />
                </div>
              </div>
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <label className="input-label">Select Shift</label>
                <select className="input-field" value={summaryShift} onChange={(e) => setSummaryShift(e.target.value)}>
                  <option value="Latest">Latest Available</option>
                  <option value="Morning">Morning (9-10 AM)</option>
                  <option value="Afternoon">Afternoon (2-3 PM)</option>
                  <option value="Evening">Evening (5-6 PM)</option>
                </select>
              </div>
            </div>
            {loading && <p style={{ color: 'var(--text-muted)' }}>Loading summary data...</p>}
          </div>
          {renderSummary()}
        </div>
      )}
    </div>
  );
};

export default DailyReports;
