import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { usePO } from '../../context/POContext';
import { usePV } from '../../context/PVContext';
import '../layout/Layout.css';

const POForm = ({ onSubmit, onClose, initialData }) => {
  const { boards, capacities, gstRates } = usePO();
  const { indices } = usePV();

  const [formData, setFormData] = useState({
    poNo: '',
    companyName: '',
    utilityBoard: '',
    conductorType: 'Aluminium',
    capacity: '',
    noOfPhases: '3-Phase',
    quantity: 1,
    baseMonthStr: '',
    exWorks: '',
    freight: '',
    gstRate: '18',
    remarks: '',
    // Formula defaults
    weightFixed: 15,
    weightAl: 22,
    weightCu: 0,
    weightCrgo: 36,
    weightOil: 10,
    weightSteel: 12,
    weightInsulating: 5,
    weightCpi: 0
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFormulaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    setError('');
  };

  const calculateTotalWeight = () => {
    const { weightFixed, weightAl, weightCu, weightCrgo, weightOil, weightSteel, weightInsulating, weightCpi } = formData;
    const total = weightFixed + weightAl + weightCu + weightCrgo + weightOil + weightSteel + weightInsulating + weightCpi;
    return Math.round(total * 100) / 100;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (calculateTotalWeight() !== 100) {
      setError('Formula weights must equal exactly 100%. Currently they equal ' + calculateTotalWeight() + '%');
      return;
    }

    if (formData.conductorType === 'Aluminium' && formData.weightCu > 0) {
      setError('Conductor is Aluminium but Copper weight is > 0.');
      return;
    }

    if (formData.conductorType === 'Copper' && formData.weightAl > 0) {
      setError('Conductor is Copper but Aluminium weight is > 0.');
      return;
    }

    onSubmit({
      ...formData,
      exWorks: Number(formData.exWorks),
      freight: Number(formData.freight),
      gstRate: Number(formData.gstRate)
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{initialData ? 'Edit Purchase Order' : 'Create New Purchase Order'}</h2>
          <button onClick={onClose} className="icon-btn" type="button"><X size={24} /></button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>1. Basic Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="input-label">PO Number</label>
              <input type="text" name="poNo" value={formData.poNo} onChange={handleInputChange} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Issued To (Company Name)</label>
              <input list="company-options" name="companyName" value={formData.companyName} onChange={handleInputChange} className="input-field" placeholder="Select or type new..." required />
              <datalist id="company-options">
                {usePO().companies?.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="input-label">Utility Board</label>
              <input list="board-options" name="utilityBoard" value={formData.utilityBoard} onChange={handleInputChange} className="input-field" placeholder="Select or type new..." required />
              <datalist id="board-options">
                {boards.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
            <div>
              <label className="input-label">Capacity</label>
              <input list="capacity-options" name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="Select or type new..." required />
              <datalist id="capacity-options">
                {capacities.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="input-label">Conductor Type</label>
              <select name="conductorType" value={formData.conductorType} onChange={handleInputChange} className="input-field" required>
                <option value="Aluminium">Aluminium</option>
                <option value="Copper">Copper</option>
              </select>
            </div>
            <div>
              <label className="input-label">No. of Phases</label>
              <input list="phase-options" name="noOfPhases" value={formData.noOfPhases} onChange={handleInputChange} className="input-field" placeholder="e.g. 3-Phase" required />
              <datalist id="phase-options">
                <option value="1-Phase" />
                <option value="2-Phase" />
                <option value="3-Phase" />
              </datalist>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Remarks / Special Notes</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="input-field" rows="2" placeholder="Any special contractual notes..." style={{ resize: 'vertical' }}></textarea>
          </div>

          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>2. Financials & Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="input-label">Quantity (Units)</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="input-field" required min="1" />
            </div>
            <div>
              <label className="input-label">Base Month (Index Date)</label>
              <input list="basemonth-options" name="baseMonthStr" value={formData.baseMonthStr} onChange={handleInputChange} className="input-field" placeholder="Select or type new..." required />
              <datalist id="basemonth-options">
                {indices.map(i => <option key={i.id} value={i.month} />)}
              </datalist>
            </div>
            <div>
              <label className="input-label">Ex-Works Price (₹)</label>
              <input type="number" name="exWorks" value={formData.exWorks} onChange={handleInputChange} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Freight (₹)</label>
              <input type="number" name="freight" value={formData.freight} onChange={handleInputChange} className="input-field" required />
            </div>
            <div>
              <label className="input-label">GST Rate (%)</label>
              <select name="gstRate" value={formData.gstRate} onChange={handleInputChange} className="input-field" required>
                {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>3. Price Variation Formula Weights (%)</span>
            <span style={{ color: calculateTotalWeight() === 100 ? 'var(--success)' : 'var(--danger)' }}>
              Total: {calculateTotalWeight()}%
            </span>
          </h3>
          
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div>
                <label className="input-label">Fixed</label>
                <input type="number" name="weightFixed" value={formData.weightFixed} onChange={handleFormulaChange} className="input-field" />
              </div>
              {formData.conductorType === 'Aluminium' ? (
                <div>
                  <label className="input-label">Aluminium (Al)</label>
                  <input type="number" name="weightAl" value={formData.weightAl} onChange={handleFormulaChange} className="input-field" />
                </div>
              ) : (
                <div>
                  <label className="input-label">Copper (Cu)</label>
                  <input type="number" name="weightCu" value={formData.weightCu} onChange={handleFormulaChange} className="input-field" />
                </div>
              )}
              <div>
                <label className="input-label">Core (CRGO)</label>
                <input type="number" name="weightCrgo" value={formData.weightCrgo} onChange={handleFormulaChange} className="input-field" />
              </div>
              <div>
                <label className="input-label">Oil (TO)</label>
                <input type="number" name="weightOil" value={formData.weightOil} onChange={handleFormulaChange} className="input-field" />
              </div>
              <div>
                <label className="input-label">Steel (IS)</label>
                <input type="number" name="weightSteel" value={formData.weightSteel} onChange={handleFormulaChange} className="input-field" />
              </div>
              <div>
                <label className="input-label">Insulating (IM)</label>
                <input type="number" name="weightInsulating" value={formData.weightInsulating} onChange={handleFormulaChange} className="input-field" />
              </div>
              <div>
                <label className="input-label">Labor (CPI)</label>
                <input type="number" name="weightCpi" value={formData.weightCpi} onChange={handleFormulaChange} className="input-field" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> {initialData ? 'Update Purchase Order' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POForm;
