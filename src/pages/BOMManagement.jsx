import React, { useState, useMemo } from 'react';
import { Layers, Plus, Save, Trash2, Edit2, Copy, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useBOM } from '../context/BOMContext';
import { useInventory } from '../context/InventoryContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/common/DataTable.css';
import '../components/layout/Layout.css';

const BOMManagement = () => {
  const { boms, saveBOM, deleteBOM } = useBOM();
  const { items } = useInventory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bomToDelete, setBomToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ rating: '', phase: '3-Phase', materials: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBOM, setExpandedBOM] = useState(null);

  const handleOpenModal = (bom = null) => {
    if (bom) {
      setFormData({ rating: bom.rating, phase: bom.phase, materials: [...bom.materials] });
    } else {
      setFormData({ rating: '', phase: '3-Phase', materials: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloneBOM = (bom) => {
    setFormData({ rating: bom.rating + ' (Copy)', phase: bom.phase, materials: [...bom.materials] });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (rating) => {
    setBomToDelete(rating);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (bomToDelete) {
      await deleteBOM(bomToDelete);
      setIsConfirmOpen(false);
      setBomToDelete(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveBOM(formData.rating, formData.phase, formData.materials);
    setIsModalOpen(false);
  };

  const addMaterialRow = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { itemId: '', quantity: 0, unit: 'Nos' }]
    }));
  };

  const updateMaterial = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    
    // Auto-fill unit if item is selected
    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      if (selectedItem) {
        newMaterials[index].unit = selectedItem.unit;
      }
    }
    
    setFormData(prev => ({ ...prev, materials: newMaterials }));
  };

  const removeMaterialRow = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const filteredBOMs = useMemo(() => {
    return boms.filter(b => b.rating.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [boms, searchTerm]);

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div className="header-title">
          <Layers className="header-icon" />
          <div>
            <h1>Bill of Materials (BOM)</h1>
            <p className="subtitle">Manage raw material recipes for transformer ratings</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search ratings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>Create BOM</span>
          </button>
        </div>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', width: '40px' }}></th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>TRANSFORMER RATING</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PHASE</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MATERIAL COUNT</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBOMs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Layers size={48} color="var(--border-color)" />
                      <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No BOMs defined.</p>
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>Click "Create BOM" to start building material recipes.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBOMs.map((bom) => (
                <React.Fragment key={bom.id}>
                  <tr style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }} onClick={() => setExpandedBOM(expandedBOM === bom.rating ? null : bom.rating)}>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {expandedBOM === bom.rating ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{bom.rating}</td>
                    <td style={{ padding: '1rem' }}>{bom.phase}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{bom.materials.length} Items</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="icon-btn" 
                            title="Edit" 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(bom); }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="icon-btn" 
                            title="Clone" 
                            onClick={(e) => { e.stopPropagation(); handleCloneBOM(bom); }}
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            className="icon-btn delete-btn" 
                            title="Delete" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(bom.rating); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedBOM === bom.rating && (
                      <tr className="expanded-row" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <td colSpan={5} style={{ padding: '1.5rem' }}>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Materials</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {bom.materials.map((mat, idx) => {
                              const itemDetails = items.find(i => i.id === mat.itemId);
                              return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{itemDetails ? itemDetails.name : 'Unknown Item'}</span>
                                    {itemDetails && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{itemDetails.category}</span>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                    {mat.quantity} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{mat.unit}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '90vw' }}>
            <div className="modal-header">
              <h2>{formData.rating ? (boms.some(b => b.rating === formData.rating && !formData.rating.includes('(Copy)')) ? 'Edit BOM' : 'Clone BOM') : 'Create BOM'}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Transformer Rating</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 100 KVA 11/0.433 KV"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: e.target.value})}
                    disabled={boms.some(b => b.rating === formData.rating) && !formData.rating.includes('(Copy)')}
                  />
                </div>
                <div className="form-group">
                  <label>Phase</label>
                  <select 
                    required
                    value={formData.phase}
                    onChange={(e) => setFormData({...formData, phase: e.target.value})}
                  >
                    <option value="1-Phase">1-Phase</option>
                    <option value="2-Phase">2-Phase</option>
                    <option value="3-Phase">3-Phase</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ margin: 0 }}>Materials Recipe</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addMaterialRow}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                
                {formData.materials.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                    No materials added yet. Click "Add Item" to build the recipe.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {formData.materials.map((mat, index) => (
                      <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 2 }}>
                          <select 
                            required
                            value={mat.itemId}
                            onChange={(e) => updateMaterial(index, 'itemId', e.target.value)}
                          >
                            <option value="">Select Inventory Item...</option>
                            {items.map(item => (
                              <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="number" 
                            required 
                            min="0.01" 
                            step="0.01"
                            placeholder="Qty"
                            value={mat.quantity || ''}
                            onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <input 
                            type="text" 
                            readOnly 
                            value={mat.unit}
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          />
                        </div>
                        <button 
                          type="button" 
                          className="icon-btn delete-btn" 
                          style={{ marginTop: '4px' }}
                          onClick={() => removeMaterialRow(index)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formData.materials.length === 0 || !formData.rating}>
                  <Save size={18} />
                  <span>Save BOM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete BOM"
        message={`Are you sure you want to delete the Bill of Materials for "${bomToDelete}"? This will not affect existing production logs, but future manufacturing of this rating will lack a material recipe.`}
        confirmText="Delete BOM"
        isDanger={true}
      />
    </div>
  );
};

export default BOMManagement;
