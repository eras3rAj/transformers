import React, { useState, useMemo } from 'react';
import { Layers, Plus, Save, Trash2, Edit2, Copy, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useBOM } from '../context/BOMContext';
import { useInventory } from '../context/InventoryContext';
import { usePO } from '../context/POContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/common/DataTable.css';
import '../components/layout/Layout.css';

const BOMManagement = () => {
  const { boms, saveBOM, deleteBOM } = useBOM();
  const { items } = useInventory();
  const { pos, capacities } = usePO();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bomToDelete, setBomToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ rating: '', phase: '3-Phase', materials: [], linkedPOs: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [expandedBOM, setExpandedBOM] = useState(null);

  const filteredModalPOs = useMemo(() => {
    if (!pos) return [];
    if (!poSearchTerm.trim()) return pos;
    const lowerSearch = poSearchTerm.toLowerCase();
    return pos.filter(po => 
      po.poNo.toLowerCase().includes(lowerSearch) || 
      (po.capacity && po.capacity.toLowerCase().includes(lowerSearch))
    );
  }, [pos, poSearchTerm]);

  const ratingOptions = useMemo(() => {
    const opts = new Set();
    boms.forEach(b => opts.add(b.rating));
    if (capacities) capacities.forEach(c => opts.add(c));
    if (pos) pos.forEach(p => p.capacity && opts.add(p.capacity));
    return Array.from(opts).sort();
  }, [boms, capacities, pos]);

  const handleOpenModal = (bom = null) => {
    if (bom) {
      setFormData({ 
        rating: bom.rating, 
        phase: bom.phase || '3-Phase', 
        materials: bom.materials ? [...bom.materials] : [],
        linkedPOs: bom.linkedPOs ? [...bom.linkedPOs] : []
      });
    } else {
      setFormData({ rating: '', phase: '3-Phase', materials: [], linkedPOs: [] });
    }
    setPoSearchTerm('');
    setIsModalOpen(true);
  };

  const handleCloneBOM = (bom) => {
    setFormData({ 
      rating: bom.rating + ' (Copy)', 
      phase: bom.phase || '3-Phase', 
      materials: bom.materials ? [...bom.materials] : [],
      linkedPOs: [] // Do not copy linked POs to a clone
    });
    setPoSearchTerm('');
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
    await saveBOM(formData.rating, formData.phase, formData.materials, formData.linkedPOs || []);
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
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div className="header-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <Layers size={28} color="var(--accent-primary)" />
            Bill of Materials (BOM)
          </h1>
          <p className="subtitle" style={{ margin: 0 }}>Manage raw material recipes for transformer ratings</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-bar">
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
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
                          {(bom.linkedPOs && bom.linkedPOs.length > 0) && (
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>LINKED PURCHASE ORDERS</h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {bom.linkedPOs.map(poNo => (
                                  <span key={poNo} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {poNo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Materials</h4>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Items: {bom.materials?.length || 0}</span>
                          </div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{formData.rating ? (boms.some(b => b.rating === formData.rating && !formData.rating.includes('(Copy)')) ? 'Edit BOM' : 'Clone BOM') : 'Create BOM'}</h2>
              <button type="button" className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="input-label">Transformer Rating</label>
                  <input 
                    type="text" 
                    required 
                    list="rating-options"
                    className="input-field"
                    placeholder="Type or select rating..."
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: e.target.value})}
                    disabled={boms.some(b => b.rating === formData.rating) && !formData.rating.includes('(Copy)')}
                  />
                  <datalist id="rating-options">
                    {ratingOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Phase</label>
                  <select 
                    required
                    className="input-field"
                    value={formData.phase}
                    onChange={(e) => setFormData({...formData, phase: e.target.value})}
                  >
                    <option value="1-Phase">1-Phase</option>
                    <option value="2-Phase">2-Phase</option>
                    <option value="3-Phase">3-Phase</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>Link to Active Purchase Orders (Optional)</label>
                  <div className="search-container" style={{ width: '250px' }}>
                    <Search className="search-icon" size={16} />
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Search POs..." 
                      value={poSearchTerm} 
                      onChange={(e) => setPoSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                  {(!pos || pos.length === 0) ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: '1 / -1', textAlign: 'center' }}>No active purchase orders found.</span>
                  ) : filteredModalPOs.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: '1 / -1', textAlign: 'center' }}>No POs match your search.</span>
                  ) : (
                    filteredModalPOs.map(po => (
                      <label key={po.poNo} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <input 
                          type="checkbox" 
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          checked={(formData.linkedPOs || []).includes(po.poNo)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, linkedPOs: [...(formData.linkedPOs || []), po.poNo] });
                            } else {
                              setFormData({ ...formData, linkedPOs: (formData.linkedPOs || []).filter(p => p !== po.poNo) });
                            }
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{po.poNo}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{po.capacity}</span>
                        </div>
                      </label>
                    ))
                  )}
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
                            className="input-field"
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
                            className="input-field"
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
                            className="input-field"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
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
