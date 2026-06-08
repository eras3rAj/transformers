import React, { useState, useEffect } from 'react';
import { useDailyReports } from '../context/DailyReportContext';
import { usePO } from '../context/POContext';
import { useTasks } from '../context/TaskContext';
import { Save, Check, FileText, AlertTriangle, Image as ImageIcon, Link } from 'lucide-react';
import '../components/layout/Layout.css';

const DailyReports = () => {
  const { reports, fetchReportsForDate, saveReport, loading } = useDailyReports();
  const { capacities } = usePO();
  const { tasks, addTask, addLatestUpdate } = useTasks();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('morning');
  const [activeTab, setActiveTab] = useState('Box-up');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = ['Box-up', 'CCA', 'Winding Section', 'Core Cutting', 'Tank Fabrication', 'Loading / Unloading'];
  const [mainTab, setMainTab] = useState('Daily Summary');
  const [summaryShift, setSummaryShift] = useState('Latest');

  const defaultIssues = { 
    machineProblem: false, machineProblemDesc: '', machineProblemAction: '', machineProblemETA: '', machineProblemTaskId: null,
    materialShortage: false, materialShortageDesc: '', materialShortageAction: '', materialShortageETA: '', materialShortageTaskId: null,
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
        setFormData(JSON.parse(draft));
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
      setFormData(currentReport.data);
    } else {
      // If empty, try to auto-populate from previous shift today
      const prevShift = selectedShift === 'evening' ? 'afternoon' : (selectedShift === 'afternoon' ? 'morning' : null);
      if (prevShift) {
        const prevReport = reports.find(r => r.shift === prevShift);
        if (prevReport && Object.keys(prevReport.data).length > 0) {
          // Clone it so they have fewest changes possible
          let cloned = JSON.parse(JSON.stringify(prevReport.data));
          
          // SMART CARRY-OVER Logic:
          tabs.forEach(tab => {
            if (!cloned[tab]) return;
            // Check Task Status
            if (cloned[tab].machineProblemTaskId) {
              const t = tasks.find(tsk => tsk.id === cloned[tab].machineProblemTaskId);
              if (t && t.status === 'Completed') {
                cloned[tab].machineProblem = false;
                cloned[tab].machineProblemDesc = '';
                cloned[tab].machineProblemAction = '';
                cloned[tab].machineProblemETA = '';
                cloned[tab].machineProblemTaskId = null;
              }
            }
            if (cloned[tab].materialShortageTaskId) {
              const t = tasks.find(tsk => tsk.id === cloned[tab].materialShortageTaskId);
              if (t && t.status === 'Completed') {
                cloned[tab].materialShortage = false;
                cloned[tab].materialShortageDesc = '';
                cloned[tab].materialShortageAction = '';
                cloned[tab].materialShortageETA = '';
                cloned[tab].materialShortageTaskId = null;
              }
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
      localStorage.setItem(`draft_report_${selectedDate}_${selectedShift}`, JSON.stringify(updated));
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
      localStorage.setItem(`draft_report_${selectedDate}_${selectedShift}`, JSON.stringify(updated));
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
      localStorage.setItem(`draft_report_${selectedDate}_${selectedShift}`, JSON.stringify(updated));
      return updated;
    });
    setSaveSuccess(false);
  };

  const addTableRow = (section, tableField, emptyRow) => {
    setFormData(prev => {
      const table = [...(prev[section][tableField] || []), emptyRow];
      return { ...prev, [section]: { ...prev[section], [tableField]: table } };
    });
  };

  const [validationError, setValidationError] = useState('');

  const validateSection = (section) => {
    const data = formData[section];
    if (section === 'Box-up' || section === 'CCA') {
      const hasMain = data.mainTable && data.mainTable.length > 0 && data.mainTable[0].qty !== '' && data.mainTable[0].rating !== '';
      if (!hasMain) return `Please fill the primary Quantity and Rating in ${section} (enter 0 if none).`;
    }
    if (section === 'Winding Section') {
      if (data.ltWinders === '' || data.htWinders === '') return 'Please enter the number of LT and HT winders.';
    }
    if (section === 'Core Cutting') {
      if (!data.ratingInOven || !data.openingTime || !data.cuttingRating || !data.nextOvenTime) {
        return 'Please fill all primary Core Cutting details (Rating, Opening Time, Next Oven Time).';
      }
    }
    if (section === 'Tank Fabrication') {
      if (data.weldersPresent === '') return 'Please enter the number of Welders present.';
    }
    return null; // valid
  };

  const handleNextSection = (currentSection) => {
    const error = validateSection(currentSection);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    
    // Auto-save draft on next
    localStorage.setItem(`draft_report_${selectedDate}_${selectedShift}`, JSON.stringify(formData));
    
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
      const err = validateSection(t);
      if (err) {
        setActiveTab(t);
        setValidationError(err);
        return;
      }
    }
    setValidationError('');
    setIsSaving(true);

    // Deep clone formData to mutate with task IDs before saving
    let dataToSave = JSON.parse(JSON.stringify(formData));

    // Process tasks for machine problems and material shortages
    for (const t of tabs) {
      if (!dataToSave[t]) continue;
      
      const secData = dataToSave[t];
      
      // Machine Problem Task
      if (secData.machineProblem) {
        if (!secData.machineProblemTaskId) {
          const res = await addTask({
            task_title: `[System: Daily Report] Machine Problem in ${t}`,
            task_desc: `Issue: ${secData.machineProblemDesc}\nAction Taken: ${secData.machineProblemAction || 'None'}\nETA: ${secData.machineProblemETA || 'Unknown'}`,
            priority: 'High',
            deadline: secData.machineProblemETA || new Date().toISOString().split('T')[0],
            status: 'In Progress',
            assigned_to: 'Admin',
            department: 'Production'
          });
          if (res.success && res.data) {
            secData.machineProblemTaskId = res.data[0].id;
          }
        } else {
          await addLatestUpdate(secData.machineProblemTaskId, `Shift ${selectedShift}: Action Taken - ${secData.machineProblemAction || 'None'}`);
        }
      }

      // Material Shortage Task
      if (secData.materialShortage) {
        if (!secData.materialShortageTaskId) {
          const res = await addTask({
            task_title: `[System: Daily Report] Material Shortage in ${t}`,
            task_desc: `Issue: ${secData.materialShortageDesc}\nAction Taken: ${secData.materialShortageAction || 'None'}\nETA: ${secData.materialShortageETA || 'Unknown'}`,
            priority: 'High',
            deadline: secData.materialShortageETA || new Date().toISOString().split('T')[0],
            status: 'In Progress',
            assigned_to: 'Admin', 
            department: 'Inventory'
          });
          if (res.success && res.data) {
            secData.materialShortageTaskId = res.data[0].id;
          }
        } else {
          await addLatestUpdate(secData.materialShortageTaskId, `Shift ${selectedShift}: Action Taken - ${secData.materialShortageAction || 'None'}`);
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
        <div className="input-group">
          <label className="input-label">Any Machine Problem?</label>
          <select 
            className="input-field" 
            value={formData[section].machineProblem ? 'Yes' : 'No'} 
            onChange={(e) => handleDataChange(section, 'machineProblem', e.target.value === 'Yes')}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        {formData[section].machineProblem && (
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
            <div className="grid-3" style={{ marginBottom: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label">Specify Machine Problem</label>
                <input type="text" className="input-field" placeholder="Describe issue..." value={formData[section].machineProblemDesc || ''} onChange={(e) => handleDataChange(section, 'machineProblemDesc', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Action Taken</label>
                <input type="text" className="input-field" placeholder="What has been done?" value={formData[section].machineProblemAction || ''} onChange={(e) => handleDataChange(section, 'machineProblemAction', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Expected Resolution Date</label>
                <input type="date" className="input-field" value={formData[section].machineProblemETA || ''} onChange={(e) => handleDataChange(section, 'machineProblemETA', e.target.value)} />
              </div>
            </div>
            {formData[section].machineProblemTaskId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Link size={14} /> Linked to Pending Task #{formData[section].machineProblemTaskId}
              </div>
            )}
          </div>
        )}
        
        <div className="input-group">
          <label className="input-label">Any Material Shortage?</label>
          <select 
            className="input-field" 
            value={formData[section].materialShortage ? 'Yes' : 'No'} 
            onChange={(e) => handleDataChange(section, 'materialShortage', e.target.value === 'Yes')}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        {formData[section].materialShortage && (
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
            <div className="grid-3" style={{ marginBottom: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label">Specify Material Shortage</label>
                <input type="text" className="input-field" placeholder="Describe shortage..." value={formData[section].materialShortageDesc || ''} onChange={(e) => handleDataChange(section, 'materialShortageDesc', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Action Taken</label>
                <input type="text" className="input-field" placeholder="What has been done?" value={formData[section].materialShortageAction || ''} onChange={(e) => handleDataChange(section, 'materialShortageAction', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Expected Resolution Date</label>
                <input type="date" className="input-field" value={formData[section].materialShortageETA || ''} onChange={(e) => handleDataChange(section, 'materialShortageETA', e.target.value)} />
              </div>
            </div>
            {formData[section].materialShortageTaskId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Link size={14} /> Linked to Pending Task #{formData[section].materialShortageTaskId}
              </div>
            )}
          </div>
        )}
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
          <thead><tr><th>Quantity being boxed up</th><th>Rating</th></tr></thead>
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
            <thead><tr><th>Qty</th><th>Rating</th></tr></thead>
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
            <thead><tr><th>Qty</th><th>Rating</th></tr></thead>
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
          <thead><tr><th>Quantity of Assembly</th><th>Rating</th></tr></thead>
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
            <thead><tr><th>Material to Load</th><th>Time</th></tr></thead>
            <tbody>
              {formData['CCA'].oven1.map((row, i) => (
                <tr key={i}>
                  <td><input type="text"  value={row.material||''} onChange={e=>handleTableChange('CCA','oven1',i,'material',e.target.value)}/></td>
                  <td><input type="time"  value={row.time||''} onChange={e=>handleTableChange('CCA','oven1',i,'time',e.target.value)}/></td>
                </tr>
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
            <thead><tr><th>Material to Load</th><th>Time</th></tr></thead>
            <tbody>
              {formData['CCA'].oven2.map((row, i) => (
                <tr key={i}>
                  <td><input type="text"  value={row.material||''} onChange={e=>handleTableChange('CCA','oven2',i,'material',e.target.value)}/></td>
                  <td><input type="time"  value={row.time||''} onChange={e=>handleTableChange('CCA','oven2',i,'time',e.target.value)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {renderCommonFields('CCA')}
    </div>
  );

  const renderWinding = () => (
    <div className="animate-fade-in">
      <div className="card">
        <h3>Winding Personnel</h3>
        <div className="grid-2">
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
          <button className="btn btn-secondary" onClick={() => addTableRow('Winding Section', 'ratingsTable', {rating:'', count:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Rating</th><th>Number of Winders</th></tr></thead>
          <tbody>
            {formData['Winding Section'].ratingsTable.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="number"  value={row.count||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'count',e.target.value)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderCommonFields('Winding Section')}
    </div>
  );

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
          <thead><tr><th>Rating</th><th>Testing Done Till Sr. No.</th></tr></thead>
          <tbody>
            {formData['Core Cutting'].testingTable.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Core Cutting','testingTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="text"  value={row.srNo||''} onChange={e=>handleTableChange('Core Cutting','testingTable',i,'srNo',e.target.value)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Amorphous Ribbon Stock</h3>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Ribbon Size</th><th>Available Coils</th><th>Incoming Coils</th></tr></thead>
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
          <thead><tr><th>Rating</th><th>Quantity (Optional)</th></tr></thead>
          <tbody>
            {(formData['Tank Fabrication'].ratingsTable || []).map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" list="capacities-list"  placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Tank Fabrication','ratingsTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="number"  value={row.qty||''} onChange={e=>handleTableChange('Tank Fabrication','ratingsTable',i,'qty',e.target.value)}/></td>
              </tr>
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
          <h3>Transformers Loaded by Rating</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('Loading / Unloading', 'loadingTanks', {rating:'', qty:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>Rating</th><th>Quantity</th></tr></thead>
          <tbody>
            {(formData['Loading / Unloading']?.loadingTanks || []).map((row, i) => (
              <tr key={i}>
                <td><input type="text" list="capacities-list" placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Loading / Unloading','loadingTanks',i,'rating',e.target.value)}/></td>
                <td><input type="number" value={row.qty||''} onChange={e=>handleTableChange('Loading / Unloading','loadingTanks',i,'qty',e.target.value)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <h3>Transformers Loaded by PO</h3>
          <button className="btn btn-secondary" onClick={() => addTableRow('Loading / Unloading', 'loadingPOs', {poNumber:'', qty:''})} style={{ padding:'0.2rem 0.5rem', fontSize:'0.8rem' }}>+ Add Row</button>
        </div>
        <table className="report-table" style={{ width: '100%', marginTop: '10px' }}>
          <thead><tr><th>PO Number</th><th>Quantity</th></tr></thead>
          <tbody>
            {(formData['Loading / Unloading']?.loadingPOs || []).map((row, i) => (
              <tr key={i}>
                <td><input type="text" placeholder="Enter PO Number..." value={row.poNumber||''} onChange={e=>handleTableChange('Loading / Unloading','loadingPOs',i,'poNumber',e.target.value)}/></td>
                <td><input type="number" value={row.qty||''} onChange={e=>handleTableChange('Loading / Unloading','loadingPOs',i,'qty',e.target.value)}/></td>
              </tr>
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
    ['Box-up', 'CCA', 'Winding Section', 'Core Cutting', 'Tank Fabrication'].forEach(sec => {
       if (latestData[sec]?.machineProblem) issues.push({ section: sec, type: 'Machine Problem', desc: latestData[sec].machineProblemDesc });
       if (latestData[sec]?.materialShortage) issues.push({ section: sec, type: 'Material Shortage', desc: latestData[sec].materialShortageDesc });
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
                {latestData['Winding Section'].ratingsTable.filter(r => r.count || r.rating).map((r, i) => (
                  <span key={i} className="status-badge" style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                    {r.rating || 'Unknown'} (Winders): <strong style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>{r.count || 0}</strong>
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
            <thead><tr><th style={{ textAlign: 'left' }}>Section</th><th style={{ textAlign: 'left' }}>Issue Type</th><th style={{ textAlign: 'left' }}>Description</th></tr></thead>
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

          <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                  color: activeTab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  fontWeight: activeTab === t ? '600' : '500',
                  whiteSpace: 'nowrap'
                }}
              >
                {t}
              </button>
            ))}
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
