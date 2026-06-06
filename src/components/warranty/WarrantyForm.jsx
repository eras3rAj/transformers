import { useState, useEffect } from 'react';
import { X, Save, Plus, Check, Trash2 } from 'lucide-react';
import { usePO } from '../../context/POContext';
import { useWarranty } from '../../context/WarrantyContext';
import { useAuth } from '../../context/AuthContext';
import '../layout/Layout.css';

const WarrantyForm = ({ onClose, onSubmit, initialData, availablePOs = [] }) => {
  const { currentUser } = useAuth();
  const { boards, addBoard, removeBoard, capacities, addCapacity } = usePO();
  const { stores, addStore, removeStore } = useWarranty();

  // Main form state
  const [formData, setFormData] = useState(initialData || {
    slNo: '',
    utilityBoard: '',
    storeName: '',
    capacity: '',
    poNo: '',
    poDate: '',
    damageDate: '',
    intimationDate: '',
    returnDays: 90,
    returnDate: '',
    inspectionDate: '',
    status: 'To be lifted from store',
    remarks: ''
  });

  // UI state for showing "Add New" inputs
  const [adding, setAdding] = useState({ board: false, store: false, capacity: false });
  
  // Temp state for new items
  const [newBoard, setNewBoard] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newCapacity, setNewCapacity] = useState('');

  // Automatically calculate returnDate whenever intimationDate or returnDays changes
  useEffect(() => {
    if (formData.intimationDate && formData.returnDays) {
      const date = new Date(formData.intimationDate);
      date.setDate(date.getDate() + parseInt(formData.returnDays));
      const formattedReturnDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, returnDate: formattedReturnDate }));
    }
  }, [formData.intimationDate, formData.returnDays]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'poNo') {
      const selectedPO = availablePOs.find(p => p.poNo === value);
      setFormData(prev => ({ 
        ...prev, 
        poNo: value, 
        poDate: selectedPO ? selectedPO.poDate : prev.poDate,
        capacity: selectedPO ? selectedPO.capacity : prev.capacity
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, id: formData.id || Date.now().toString() });
  };

  const saveNewBoard = () => {
    if (newBoard.trim()) {
      addBoard(newBoard.trim());
      setFormData(prev => ({ ...prev, utilityBoard: newBoard.trim() }));
      setNewBoard('');
      setAdding(prev => ({ ...prev, board: false }));
    }
  };

  const saveNewStore = () => {
    if (newStore.trim()) {
      addStore(newStore.trim());
      setFormData(prev => ({ ...prev, storeName: newStore.trim() }));
      setNewStore('');
      setAdding(prev => ({ ...prev, store: false }));
    }
  };

  const saveNewCapacity = () => {
    if (newCapacity.trim()) {
      addCapacity(newCapacity.trim());
      setFormData(prev => ({ ...prev, capacity: newCapacity.trim() }));
      setNewCapacity('');
      setAdding(prev => ({ ...prev, capacity: false }));
    }
  };

  const handleDeleteBoard = () => {
    if (window.confirm(`Are you sure you want to remove "${formData.utilityBoard}" from the dropdown?`)) {
      removeBoard(formData.utilityBoard);
      setFormData(prev => ({ ...prev, utilityBoard: '' }));
    }
  };

  const handleDeleteStore = () => {
    if (window.confirm(`Are you sure you want to remove "${formData.storeName}" from the dropdown?`)) {
      removeStore(formData.storeName);
      setFormData(prev => ({ ...prev, storeName: '' }));
    }
  };



  const renderAddHeader = (label, type, canAdd = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
      <label className="input-label" style={{ marginBottom: 0 }}>{label}</label>
      {canAdd && (
        <button 
          type="button" 
          onClick={() => setAdding({ ...adding, [type]: true })} 
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '500' }}
        >
          <Plus size={12} /> Add New
        </button>
      )}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>{initialData ? 'Edit Warranty Claim' : 'Add Warranty Claim'}</h2>
          <button onClick={onClose} className="icon-btn" type="button"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
            {/* Column 1: Identification & Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="input-label">Transformer Sl No.</label>
                <input type="text" name="slNo" value={formData.slNo} onChange={handleChange} className="input-field" required placeholder="e.g. TR-2024-001" />
              </div>
              
              <div>
                <label className="input-label">Purchase Order (PO)</label>
                <select name="poNo" value={formData.poNo} onChange={handleChange} className="input-field" required>
                  <option value="">-- Select PO --</option>
                  {availablePOs.map(po => <option key={po.id} value={po.poNo}>{po.capacity ? `${po.capacity} - ` : ''}{po.poNo} ({po.utilityBoard})</option>)}
                </select>
              </div>
              
              <div>
                {renderAddHeader('Utility Board', 'board')}
                {adding.board ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="input-field" value={newBoard} onChange={e => setNewBoard(e.target.value)} placeholder="New Board Name" autoFocus />
                    <button type="button" className="btn btn-primary" onClick={saveNewBoard} style={{ padding: '0.5rem' }}><Check size={16}/></button>
                    <button type="button" className="btn btn-secondary" onClick={() => setAdding({...adding, board: false})} style={{ padding: '0.5rem' }}><X size={16}/></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select name="utilityBoard" value={formData.utilityBoard} onChange={handleChange} className="input-field" required>
                      <option value="" disabled>Select Board</option>
                      {boards.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {currentUser?.role === 'superadmin' && formData.utilityBoard && (
                      <button type="button" className="btn btn-secondary" onClick={handleDeleteBoard} style={{ padding: '0.5rem' }} title="Delete this Utility Board">
                        <Trash2 size={16} color="var(--error)" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                {renderAddHeader('Store Name (Place of Damage)', 'store', currentUser?.role === 'superadmin')}
                {adding.store ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="input-field" value={newStore} onChange={e => setNewStore(e.target.value)} placeholder="New Store Name" autoFocus />
                    <button type="button" className="btn btn-primary" onClick={saveNewStore} style={{ padding: '0.5rem' }}><Check size={16}/></button>
                    <button type="button" className="btn btn-secondary" onClick={() => setAdding({...adding, store: false})} style={{ padding: '0.5rem' }}><X size={16}/></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select name="storeName" value={formData.storeName} onChange={handleChange} className="input-field" required>
                      <option value="" disabled>Select Store</option>
                      {stores.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {currentUser?.role === 'superadmin' && formData.storeName && (
                      <button type="button" className="btn btn-secondary" onClick={handleDeleteStore} style={{ padding: '0.5rem' }} title="Delete this Store Name">
                        <Trash2 size={16} color="var(--error)" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">PO Date</label>
                  <input type="date" name="poDate" value={formData.poDate} readOnly className="input-field" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  {renderAddHeader('Capacity / Rating', 'capacity')}
                  {adding.capacity ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" className="input-field" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} placeholder="e.g. 500kVA" autoFocus />
                      <button type="button" className="btn btn-primary" onClick={saveNewCapacity} style={{ padding: '0.5rem' }}><Check size={16}/></button>
                    </div>
                  ) : (
                    <select name="capacity" value={formData.capacity} onChange={handleChange} className="input-field" required>
                      <option value="" disabled>Select Capacity</option>
                      {capacities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Dates & Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="input-label">Date of Damage</label>
                <input type="date" name="damageDate" value={formData.damageDate} onChange={handleChange} className="input-field" required />
              </div>

              <div>
                <label className="input-label">Date of Intimation</label>
                <input type="date" name="intimationDate" value={formData.intimationDate} onChange={handleChange} className="input-field" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Days to Return</label>
                  <input type="number" name="returnDays" value={formData.returnDays} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Return Deadline</label>
                  <input type="date" name="returnDate" value={formData.returnDate} readOnly className="input-field" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--accent-primary)', fontWeight: 'bold' }} />
                </div>
              </div>

              <div>
                <label className="input-label">Date of Inspection (Optional)</label>
                <input type="date" name="inspectionDate" value={formData.inspectionDate} onChange={handleChange} className="input-field" />
              </div>

              <div>
                <label className="input-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                  <option value="To be lifted from store">To be lifted from store</option>
                  <option value="Pending Return">Pending Return</option>
                  <option value="Inspected">Inspected</option>
                  <option value="Under Repair">Under Repair</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="input-label">Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="input-field" rows="3" placeholder="Additional notes about the damage..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Claim</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarrantyForm;
