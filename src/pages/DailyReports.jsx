import React, { useState, useEffect } from 'react';
import { useDailyReports } from '../context/DailyReportContext';
import { usePO } from '../context/POContext';
import { Save, Check, FileText, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import '../components/layout/Layout.css';

const DailyReports = () => {
  const { reports, fetchReportsForDate, saveReport, loading } = useDailyReports();
  const { capacities } = usePO();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('morning');
  const [activeTab, setActiveTab] = useState('Box-up');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = ['Box-up', 'CCA', 'Winding Section', 'Core Cutting', 'Tank Fabrication'];

  // Default empty structure
  const emptyReport = {
    'Box-up': { mainTable: [{qty: '', rating: ''}], oven1: [], oven2: [], machineProblem: false, machineProblemDesc: '', materialShortage: false, materialShortageDesc: '', remarks: '' },
    'CCA': { mainTable: [{qty: '', rating: ''}], oven1: [], oven2: [], machineProblem: false, machineProblemDesc: '', materialShortage: false, materialShortageDesc: '', remarks: '' },
    'Winding Section': { ltWinders: '', htWinders: '', ratingsTable: [], machineProblem: false, machineProblemDesc: '', materialShortage: false, materialShortageDesc: '', remarks: '' },
    'Core Cutting': { ratingInOven: '', openingTime: '', cuttingRating: '', nextOvenTime: '', testingTable: [], machineProblem: false, machineProblemDesc: '', materialShortage: false, materialShortageDesc: '', remarks: '' },
    'Tank Fabrication': { weldersPresent: '', ratingManufactured: '', machineProblem: false, machineProblemDesc: '', materialShortage: false, materialShortageDesc: '', remarks: '' }
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
          setFormData(JSON.parse(JSON.stringify(prevReport.data)));
        } else {
          setFormData(JSON.parse(JSON.stringify(emptyReport)));
        }
      } else {
        setFormData(JSON.parse(JSON.stringify(emptyReport)));
      }
    }
  }, [reports, selectedShift]); // eslint-disable-line

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
      const table = [...prev[section][tableField]];
      if (!table[index]) table[index] = {};
      table[index][colField] = value;
      const updated = { ...prev, [section]: { ...prev[section], [tableField]: table } };
      localStorage.setItem(`draft_report_${selectedDate}_${selectedShift}`, JSON.stringify(updated));
      return updated;
    });
    setSaveSuccess(false);
  };

  const addTableRow = (section, tableField, emptyRow) => {
    setFormData(prev => {
      const table = [...prev[section][tableField], emptyRow];
      return { ...prev, [section]: { ...prev[section], [tableField]: table } };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveReport(selectedDate, selectedShift, formData);
    if (success) {
      setSaveSuccess(true);
      localStorage.removeItem(`draft_report_${selectedDate}_${selectedShift}`);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

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
          <div className="input-group">
            <label className="input-label">Specify Machine Problem</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Describe issue..." 
              value={formData[section].machineProblemDesc || ''} 
              onChange={(e) => handleDataChange(section, 'machineProblemDesc', e.target.value)}
            />
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
          <div className="input-group">
            <label className="input-label">Specify Material Shortage</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Describe shortage..." 
              value={formData[section].materialShortageDesc || ''} 
              onChange={(e) => handleDataChange(section, 'materialShortageDesc', e.target.value)}
            />
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
                <td><input type="number" style={{width:'100%', padding:'4px'}} value={row.qty||''} onChange={e=>handleTableChange('Box-up','mainTable',i,'qty',e.target.value)}/></td>
                <td>
                  <input type="text" list="capacities-list" style={{width:'100%', padding:'4px'}} placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Box-up','mainTable',i,'rating',e.target.value)}/>
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
                  <td><input type="number" style={{width:'100%', padding:'4px'}} value={row.qty||''} onChange={e=>handleTableChange('Box-up','oven1',i,'qty',e.target.value)}/></td>
                  <td>
                    <input type="text" list="capacities-list" style={{width:'100%', padding:'4px'}} placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Box-up','oven1',i,'rating',e.target.value)}/>
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
                  <td><input type="number" style={{width:'100%', padding:'4px'}} value={row.qty||''} onChange={e=>handleTableChange('Box-up','oven2',i,'qty',e.target.value)}/></td>
                  <td>
                    <input type="text" list="capacities-list" style={{width:'100%', padding:'4px'}} placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Box-up','oven2',i,'rating',e.target.value)}/>
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
                <td><input type="number" style={{width:'100%', padding:'4px'}} value={row.qty||''} onChange={e=>handleTableChange('CCA','mainTable',i,'qty',e.target.value)}/></td>
                <td>
                  <input type="text" list="capacities-list" style={{width:'100%', padding:'4px'}} placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('CCA','mainTable',i,'rating',e.target.value)}/>
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
                  <td><input type="text" style={{width:'100%', padding:'4px'}} value={row.material||''} onChange={e=>handleTableChange('CCA','oven1',i,'material',e.target.value)}/></td>
                  <td><input type="time" style={{width:'100%', padding:'4px'}} value={row.time||''} onChange={e=>handleTableChange('CCA','oven1',i,'time',e.target.value)}/></td>
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
                  <td><input type="text" style={{width:'100%', padding:'4px'}} value={row.material||''} onChange={e=>handleTableChange('CCA','oven2',i,'material',e.target.value)}/></td>
                  <td><input type="time" style={{width:'100%', padding:'4px'}} value={row.time||''} onChange={e=>handleTableChange('CCA','oven2',i,'time',e.target.value)}/></td>
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
                  <input type="text" list="capacities-list" style={{width:'100%', padding:'4px'}} placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="number" style={{width:'100%', padding:'4px'}} value={row.count||''} onChange={e=>handleTableChange('Winding Section','ratingsTable',i,'count',e.target.value)}/></td>
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
                  <input type="text" list="capacities-list" style={{width:'100%', padding:'4px'}} placeholder="Select or type..." value={row.rating||''} onChange={e=>handleTableChange('Core Cutting','testingTable',i,'rating',e.target.value)}/>
                </td>
                <td><input type="text" style={{width:'100%', padding:'4px'}} value={row.srNo||''} onChange={e=>handleTableChange('Core Cutting','testingTable',i,'srNo',e.target.value)}/></td>
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
          <div className="input-group">
            <label className="input-label">Rating Being Manufactured</label>
            <input type="text" list="capacities-list" className="input-field" placeholder="Select or type..." value={formData['Tank Fabrication'].ratingManufactured} onChange={(e) => handleDataChange('Tank Fabrication', 'ratingManufactured', e.target.value)} />
          </div>
        </div>
      </div>
      {renderCommonFields('Tank Fabrication')}
    </div>
  );

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
            Submit reports for Morning, Afternoon, and Evening shifts. Data automatically carries over.
          </p>
        </div>
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
      </div>
    </div>
  );
};

export default DailyReports;
