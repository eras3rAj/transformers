import React, { useState, useMemo } from 'react';
import { PackageSearch, Plus, MapPin, Database, Archive, Settings, FilePlus, LogIn, LogOut, Trash2, Building2, Edit } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

const InventoryManagement = () => {
  const { locations, units, items, companies, transactions, categories, loading, addLocation, addUnit, addItem, addCompany, logTransaction, deleteTransaction, getStockAtLocation, getGlobalStock, saveCategory } = useInventory();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Modal States
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState({ isOpen: false, type: 'IN', item: null });
  const [editingMaster, setEditingMaster] = useState(null); // { type, id, oldName }

  // Form States
  const [locName, setLocName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [companyFormName, setCompanyFormName] = useState('');
  const [categoryData, setCategoryData] = useState({ name: '', suppliers: [] });
  const [itemData, setItemData] = useState({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [] });
  const [txnData, setTxnData] = useState({ qty: '', remarks: '', date: new Date().toISOString().split('T')[0], companyName: '', billNo: '', receivingDate: '', billDate: '', unitPrice: '' });
  
  // Company search state
  const [companySearch, setCompanySearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  
  // Item search state for location view
  const [itemSearch, setItemSearch] = useState('');

  // Alert State
  const [alert, setAlert] = useState({ isOpen: false, message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, txnId: null });
  const [deleteMasterConfirm, setDeleteMasterConfirm] = useState({ isOpen: false, type: null, id: null, name: '' });
  
  // Derived Categories
  const contextCategories = categories.map(c => c.name);
  const derivedCategories = items.map(i => i.category).filter(Boolean);
  const existingCategories = [...new Set([...contextCategories, ...derivedCategories])];

  // Add Settings Handlers
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!locName.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, locName.trim());
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addLocation(locName.trim());
      if (!success) setAlert({ isOpen: true, message: "Location name already exists!" });
    }
    if (success) {
      setLocName('');
      setShowLocationModal(false);
      setEditingMaster(null);
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, unitName.trim());
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addUnit(unitName.trim());
      if (!success) setAlert({ isOpen: true, message: "Unit already exists!" });
    }
    if (success) {
      setUnitName('');
      setShowUnitModal(false);
      setEditingMaster(null);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!companyFormName.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, companyFormName.trim());
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addCompany(companyFormName.trim());
      if (!success) setAlert({ isOpen: true, message: "Company name already exists!" });
    }
    if (success) {
      setCompanyFormName('');
      setShowCompanyModal(false);
      setEditingMaster(null);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryData.name.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, categoryData.name.trim(), { suppliers: categoryData.suppliers });
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await saveCategory(categoryData.name.trim(), categoryData.suppliers);
      if (!success) setAlert({ isOpen: true, message: "Error saving category!" });
    }
    if (success) {
      setCategoryData({ name: '', suppliers: [] });
      setShowCategoryModal(false);
      setEditingMaster(null);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemData.name.trim() || !itemData.unit || !itemData.category.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, itemData.name.trim(), { unit: itemData.unit, category: itemData.category, suppliers: itemData.suppliers });
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addItem(itemData.name.trim(), itemData.unit, itemData.category, itemData.suppliers);
      if (!success) setAlert({ isOpen: true, message: "Item already exists!" });
    }
    if (success) {
      setItemData({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [] });
      setShowItemModal(false);
      setEditingMaster(null);
    }
  };

  const handleDeleteMaster = (type, id, name) => {
    setDeleteMasterConfirm({ isOpen: true, type, id, name });
  };

  const confirmDeleteMaster = async () => {
    const { type, id, name } = deleteMasterConfirm;
    const res = await deleteEntity(type, id, name);
    if (!res.success) {
      setAlert({ isOpen: true, message: res.message });
    }
    setDeleteMasterConfirm({ isOpen: false, type: null, id: null, name: '' });
  };

  const handleLogTransaction = async (e) => {
    e.preventDefault();
    if (!txnData.qty || Number(txnData.qty) <= 0) return;
    
    // Validate OUT transactions
    if (showTxnModal.type === 'OUT') {
      const currentStock = getStockAtLocation(showTxnModal.item, activeTab);
      if (Number(txnData.qty) > currentStock) {
        setAlert({ isOpen: true, message: `Insufficient stock! Only ${currentStock} available at ${activeTab}.` });
        return;
      }
    }

    const payload = {
      location: activeTab,
      item: showTxnModal.item,
      type: showTxnModal.type,
      qty: Number(txnData.qty),
      date: txnData.date,
      remarks: txnData.remarks,
      companyName: txnData.companyName,
      billNo: txnData.billNo,
      receivingDate: txnData.receivingDate,
      billDate: txnData.billDate,
      unitPrice: showTxnModal.type === 'IN' && txnData.unitPrice ? Number(txnData.unitPrice) : ''
    };

    await logTransaction(payload);
    setTxnData({ qty: '', remarks: '', date: new Date().toISOString().split('T')[0], companyName: '', billNo: '', receivingDate: '', billDate: '', unitPrice: '' });
    setShowTxnModal({ isOpen: false, type: 'IN', item: null });
  };

  if (loading) return <div className="animate-fade-in" style={{ padding: '2rem' }}>Loading Inventory System...</div>;

  const renderGlobalOverview = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {items.map(item => {
          const globalStock = getGlobalStock(item.name);
          return (
            <div key={item.id} className="card stat-card" style={{ borderLeft: `4px solid ${globalStock > 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{item.name}</h3>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{globalStock.toLocaleString()}</p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Total {item.unit} Global</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.8rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                  <Database size={24} />
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', width: '100%', gridColumn: '1 / -1', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            No items tracked yet. Head to Settings to configure your inventory items.
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Archive size={18} color="var(--accent-primary)" /> Global Stock Distribution
          </h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ITEM NAME</th>
                  {locations.map(loc => (
                    <th key={loc.id} style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{loc.name.toUpperCase()}</th>
                  ))}
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'right' }}>GLOBAL TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{item.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.unit})</span></td>
                    {locations.map(loc => {
                      const locStock = getStockAtLocation(item.name, loc.name);
                      return (
                        <td key={loc.id} style={{ padding: '1rem', color: locStock === 0 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {locStock.toLocaleString()}
                        </td>
                      );
                    })}
                    <td style={{ padding: '1rem', fontWeight: '700', textAlign: 'right', color: 'var(--accent-primary)' }}>
                      {getGlobalStock(item.name).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderLocationView = (locName) => {
    const filteredItems = items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
    
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--success)" /> Stock at {locName}
            </h3>
            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
              <PackageSearch size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search items..." 
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                style={{ paddingLeft: '35px', marginBottom: 0 }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {existingCategories.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat);
              if (catItems.length === 0) return null;
              
              return (
                <div key={cat} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.8rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {cat}
                  </div>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ITEM/RATING</th>
                          <th style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>CURRENT STOCK</th>
                          <th style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>QUICK ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map(item => {
                          const stock = getStockAtLocation(item.name, locName);
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '1rem', fontWeight: '600' }}>
                                {item.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.unit})</span>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                  {stock.toLocaleString()}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'IN', item: item.name })}>
                                  <LogIn size={14} /> Stock In
                                </button>
                                <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'OUT', item: item.name })}>
                                  <LogOut size={14} /> Stock Out
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                {items.length === 0 ? "No items configured in the system." : "No items match your search."}
              </div>
            )}
          </div>
        </div>

      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <Archive size={16} /> Recent Transactions ({locName})
        </h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>DATE</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>COMPANY</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>BILL NO.</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>ITEM</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>TYPE</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>QUANTITY</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>LOGGED BY</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>REMARKS</th>
                {isSuperAdmin && <th style={{ padding: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.filter(t => t.location === locName).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((txn, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(txn.date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap' }}>{txn.companyName || '-'}</td>
                  <td style={{ padding: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{txn.billNo || '-'}</td>
                  <td style={{ padding: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap' }}>{txn.item}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: txn.type === 'IN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: txn.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                      {txn.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{txn.type === 'IN' ? '+' : '-'}{txn.qty}</td>
                  <td style={{ padding: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{txn.user}</td>
                  <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>{txn.remarks}</td>
                  {isSuperAdmin && (
                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, txnId: txn.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7, transition: 'opacity 0.2s' }} title="Delete Transaction" onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.7}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderSettings = () => (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      
      {/* Categories Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Database size={18} color="var(--success)" />
          <span>Master Categories</span>
          <button className="icon-btn" onClick={() => {
            setEditingMaster(null);
            setCategoryData({ name: '', suppliers: [] });
            setShowCategoryModal(true);
          }}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {categories.map(c => (
            <li key={c.id || c.name} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '600' }}>{c.name}</div>
                {isSuperAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn-small" onClick={() => {
                      setEditingMaster({ type: 'inv_category', id: c.id, oldName: c.name });
                      setCategoryData({ name: c.name, suppliers: c.suppliers });
                      setShowCategoryModal(true);
                    }} title="Edit Category"><Edit size={14} color="var(--accent-primary)" /></button>
                    <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_category', c.id, c.name)} title="Delete Category"><Trash2 size={14} color="var(--danger)" /></button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {c.suppliers.length > 0 ? (
                  <div>
                    <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}>{c.suppliers.length} mapped suppliers:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {c.suppliers.map(s => <span key={s} style={{ padding: '2px 6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{s}</span>)}
                    </div>
                  </div>
                ) : (
                  <span>No mapped suppliers</span>
                )}
              </div>
            </li>
          ))}
          {categories.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No categories configured.</li>}
        </ul>
      </div>

      {/* Locations Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <MapPin size={18} color="var(--accent-primary)" />
          <span>Store Locations</span>
          <button className="icon-btn" onClick={() => {
            setEditingMaster(null);
            setLocName('');
            setShowLocationModal(true);
          }}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {locations.map(l => (
            <li key={l.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>{l.name}</span>
              {isSuperAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn-small" onClick={() => {
                    setEditingMaster({ type: 'inv_loc', id: l.id, oldName: l.name });
                    setLocName(l.name);
                    setShowLocationModal(true);
                  }} title="Edit Location"><Edit size={14} color="var(--accent-primary)" /></button>
                  <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_loc', l.id, l.name)} title="Delete Location"><Trash2 size={14} color="var(--danger)" /></button>
                </div>
              )}
            </li>
          ))}
          {locations.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No locations configured.</li>}
        </ul>
      </div>

      {/* Units Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Settings size={18} color="var(--warning)" />
          <span>Units of Measure (UOM)</span>
          <button className="icon-btn" onClick={() => {
            setEditingMaster(null);
            setUnitName('');
            setShowUnitModal(true);
          }}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {units.map(u => (
            <li key={u.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>{u.name}</span>
              {isSuperAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn-small" onClick={() => {
                    setEditingMaster({ type: 'inv_unit', id: u.id, oldName: u.name });
                    setUnitName(u.name);
                    setShowUnitModal(true);
                  }} title="Edit Unit"><Edit size={14} color="var(--accent-primary)" /></button>
                  <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_unit', u.id, u.name)} title="Delete Unit"><Trash2 size={14} color="var(--danger)" /></button>
                </div>
              )}
            </li>
          ))}
          {units.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No units configured.</li>}
        </ul>
      </div>

      {/* Companies Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Building2 size={18} color="var(--success)" />
          <span>Supplier Companies</span>
          <button className="icon-btn" onClick={() => {
            setEditingMaster(null);
            setCompanyFormName('');
            setShowCompanyModal(true);
          }}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {companies.map(c => (
            <li key={c.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>{c.name}</span>
              {isSuperAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn-small" onClick={() => {
                    setEditingMaster({ type: 'inv_company', id: c.id, oldName: c.name });
                    setCompanyFormName(c.name);
                    setShowCompanyModal(true);
                  }} title="Edit Company"><Edit size={14} color="var(--accent-primary)" /></button>
                  <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_company', c.id, c.name)} title="Delete Company"><Trash2 size={14} color="var(--danger)" /></button>
                </div>
              )}
            </li>
          ))}
          {companies.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No companies configured.</li>}
        </ul>
      </div>

      {/* Items Settings */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <FilePlus size={18} color="var(--success)" />
          <span>Master Items List</span>
          <button className="icon-btn" onClick={() => {
            setEditingMaster(null);
            setItemData({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [] });
            setShowItemModal(true);
          }}><Plus size={18} /></button>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {existingCategories.length > 0 ? existingCategories.map(cat => (
            <div key={cat}>
              <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{cat}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {items.filter(i => i.category === cat).map(item => (
                    <div key={item.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '4px' }}>{item.unit}</span>
                        </div>
                        {isSuperAdmin && (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button className="icon-btn-small" onClick={() => {
                              setEditingMaster({ type: 'inv_item', id: item.id, oldName: item.name });
                              setItemData({ name: item.name, unit: item.unit, category: item.category, isNewCategory: false, suppliers: item.suppliers || [] });
                              setShowItemModal(true);
                            }} title="Edit Item"><Edit size={14} color="var(--accent-primary)" /></button>
                            <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_item', item.id, item.name)} title="Delete Item"><Trash2 size={14} color="var(--danger)" /></button>
                          </div>
                        )}
                      </div>
                      {item.suppliers && item.suppliers.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          <span style={{ color: 'var(--accent-primary)' }}>{item.suppliers.length}</span> mapped suppliers
                        </div>
                      )}
                    </div>
                ))}
              </div>
            </div>
          )) : (
            <div style={{ color: 'var(--text-muted)' }}>No items configured.</div>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-primary)' }}>
            <PackageSearch size={28} color="var(--accent-primary)" />
            Inventory & Stores
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track stock levels, material consumption, and global reserves.</p>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: '2rem' }}>
        <button className={`tab ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveTab('Overview')}>
          Global Overview
        </button>
        {locations.map(loc => (
          <button key={loc.id} className={`tab ${activeTab === loc.name ? 'active' : ''}`} onClick={() => setActiveTab(loc.name)}>
            {loc.name}
          </button>
        ))}
        <button className={`tab ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => setActiveTab('Settings')}>
          <Settings size={14} style={{ marginRight: '0.4rem', marginBottom: '-2px' }} /> Settings
        </button>
      </div>

      {activeTab === 'Overview' && renderGlobalOverview()}
      {activeTab === 'Settings' && renderSettings()}
      {activeTab !== 'Overview' && activeTab !== 'Settings' && renderLocationView(activeTab)}

      {/* Modals */}
      {showLocationModal && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem' }}>
            <h3>Add Store Location</h3>
            <form onSubmit={handleAddLocation}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Location Name</label>
                <input type="text" className="input-field" value={locName} onChange={e => setLocName(e.target.value)} placeholder="e.g. Main Warehouse" autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocationModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUnitModal && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem' }}>
            <h3>Add Unit of Measure</h3>
            <form onSubmit={handleAddUnit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Unit Abbreviation</label>
                <input type="text" className="input-field" value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="e.g. kg, Ltrs, Pcs" autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUnitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '450px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Add Master Item</h3>
            <form onSubmit={handleAddItem}>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Category / Head</label>
                {!itemData.isNewCategory ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      value={itemData.category} 
                      onChange={e => {
                        const selectedCat = e.target.value;
                        const catConfig = categories.find(c => c.name === selectedCat);
                        setItemData({ 
                          ...itemData, 
                          category: selectedCat, 
                          suppliers: catConfig ? catConfig.suppliers : [] 
                        });
                      }} 
                      required
                    >
                      <option value="">Select a Category...</option>
                      {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={() => setItemData({ ...itemData, category: '', isNewCategory: true })}>+</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      value={itemData.category} 
                      onChange={e => setItemData({ ...itemData, category: e.target.value })} 
                      placeholder="e.g. Transformer Tank" 
                      required 
                    />
                    {existingCategories.length > 0 && (
                      <button type="button" className="btn btn-secondary" onClick={() => setItemData({ ...itemData, category: '', isNewCategory: false })}>List</button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Item Specific Name / Rating</label>
                <input type="text" className="input-field" value={itemData.name} onChange={e => setItemData({ ...itemData, name: e.target.value })} placeholder="e.g. 100 kVA or 4mm" required />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Unit of Measure</label>
                <select className="input-field" value={itemData.unit} onChange={e => setItemData({ ...itemData, unit: e.target.value })} required>
                  <option value="">Select a Unit...</option>
                  {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Map Authorized Suppliers (Optional)</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                  {companies.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={itemData.suppliers.includes(c.name)}
                        onChange={(e) => {
                          const newSuppliers = e.target.checked 
                            ? [...itemData.suppliers, c.name]
                            : itemData.suppliers.filter(s => s !== c.name);
                          setItemData({ ...itemData, suppliers: newSuppliers });
                        }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                    </label>
                  ))}
                  {companies.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No companies available.</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompanyModal && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem' }}>
            <h3>Add Supplier Company</h3>
            <form onSubmit={handleAddCompany}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Company Name</label>
                <input type="text" className="input-field" value={companyFormName} onChange={e => setCompanyFormName(e.target.value)} placeholder="e.g. ABC Metals Pvt Ltd" autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompanyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem' }}>
            <h3>Define Master Category</h3>
            <form onSubmit={handleAddCategory}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Category Name</label>
                <input type="text" className="input-field" value={categoryData.name} onChange={e => setCategoryData({ ...categoryData, name: e.target.value })} placeholder="e.g. Transformer Tank" autoFocus required />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Map Authorized Suppliers (Optional)</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                  {companies.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={categoryData.suppliers.includes(c.name)}
                        onChange={(e) => {
                          const newSuppliers = e.target.checked 
                            ? [...categoryData.suppliers, c.name]
                            : categoryData.suppliers.filter(s => s !== c.name);
                          setCategoryData({ ...categoryData, suppliers: newSuppliers });
                        }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                    </label>
                  ))}
                  {companies.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No companies available.</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTxnModal.isOpen && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem', borderTop: `4px solid ${showTxnModal.type === 'IN' ? 'var(--success)' : 'var(--danger)'}` }}>
            <h3>{showTxnModal.type === 'IN' ? 'Stock In (Receiving)' : 'Stock Out (Consumption)'}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Logging for <strong>{showTxnModal.item}</strong> at <strong>{activeTab}</strong></p>
            <form onSubmit={handleLogTransaction}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Date</label>
                <input type="date" className="input-field" value={txnData.date} onChange={e => setTxnData({ ...txnData, date: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Company Name</label>
                <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      value={companyDropdownOpen ? companySearch : txnData.companyName}
                      onChange={e => {
                        setCompanySearch(e.target.value);
                        if (!companyDropdownOpen) setCompanyDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setCompanyDropdownOpen(true);
                        setCompanySearch('');
                      }}
                      placeholder="Search or select company..."
                      required={!txnData.companyName}
                    />
                    {companyDropdownOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', maxHeight: '160px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                        {(() => {
                          const targetItem = items.find(i => i.name === showTxnModal.item);
                          const mappedSuppliers = targetItem?.suppliers || [];
                          
                          // Filter mapped vs unmapped, then apply search
                          const mappedList = companies.filter(c => mappedSuppliers.includes(c.name) && c.name.toLowerCase().includes(companySearch.toLowerCase()));
                          const otherList = companies.filter(c => !mappedSuppliers.includes(c.name) && c.name.toLowerCase().includes(companySearch.toLowerCase()));

                          return (
                            <>
                              {mappedList.length > 0 && (
                                <>
                                  <div style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)' }}>MAPPED SUPPLIERS</div>
                                  {mappedList.map(c => (
                                    <div 
                                      key={c.id} 
                                      onClick={() => {
                                        setTxnData({ ...txnData, companyName: c.name });
                                        setCompanyDropdownOpen(false);
                                        setCompanySearch('');
                                      }}
                                      style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s', backgroundColor: txnData.companyName === c.name ? 'var(--accent-glow)' : 'transparent' }}
                                      onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                                      onMouseLeave={e => e.target.style.backgroundColor = txnData.companyName === c.name ? 'var(--accent-glow)' : 'transparent'}
                                    >
                                      {c.name} <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>✓</span>
                                    </div>
                                  ))}
                                </>
                              )}
                              {otherList.length > 0 && (
                                <>
                                  {mappedList.length > 0 && <div style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)' }}>OTHER SUPPLIERS</div>}
                                  {otherList.map(c => (
                                    <div 
                                      key={c.id} 
                                      onClick={() => {
                                        setTxnData({ ...txnData, companyName: c.name });
                                        setCompanyDropdownOpen(false);
                                        setCompanySearch('');
                                      }}
                                      style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s', backgroundColor: txnData.companyName === c.name ? 'var(--accent-glow)' : 'transparent' }}
                                      onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                                      onMouseLeave={e => e.target.style.backgroundColor = txnData.companyName === c.name ? 'var(--accent-glow)' : 'transparent'}
                                    >
                                      {c.name}
                                    </div>
                                  ))}
                                </>
                              )}
                              {mappedList.length === 0 && otherList.length === 0 && (
                                <div style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No companies found.</div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="icon-btn" 
                    title="Add New Company"
                    style={{ border: '1px solid var(--border-color)', borderRadius: '8px', width: '42px', height: '42px', flexShrink: 0 }}
                    onClick={() => { setCompanyDropdownOpen(false); setShowCompanyModal(true); }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Bill / Invoice No.</label>
                <input type="text" className="input-field" value={txnData.billNo} onChange={e => setTxnData({ ...txnData, billNo: e.target.value })} placeholder="E.g. INV-2026-0451" required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Bill Date (Optional)</label>
                  <input type="date" className="input-field" value={txnData.billDate} onChange={e => setTxnData({ ...txnData, billDate: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Receiving Date (Optional)</label>
                  <input type="date" className="input-field" value={txnData.receivingDate} onChange={e => setTxnData({ ...txnData, receivingDate: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Quantity ({items.find(i => i.name === showTxnModal.item)?.unit})</label>
                <input type="number" min="0.01" step="0.01" className="input-field" value={txnData.qty} onChange={e => setTxnData({ ...txnData, qty: e.target.value })} placeholder="Enter quantity" autoFocus required />
              </div>
              {showTxnModal.type === 'IN' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Unit Price ₹ (Optional)</label>
                  <input type="number" min="0" step="0.01" className="input-field" value={txnData.unitPrice} onChange={e => setTxnData({ ...txnData, unitPrice: e.target.value })} placeholder="Price per unit" />
                  {txnData.unitPrice && txnData.qty && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.4rem', fontWeight: '600' }}>
                      Total Value: ₹{(Number(txnData.unitPrice) * Number(txnData.qty)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Remarks (Optional)</label>
                <input type="text" className="input-field" value={txnData.remarks} onChange={e => setTxnData({ ...txnData, remarks: e.target.value })} placeholder="E.g. Consumed in Job #44" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTxnModal({ isOpen: false, type: 'IN', item: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: showTxnModal.type === 'IN' ? 'var(--success)' : 'var(--danger)', borderColor: showTxnModal.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                  Confirm {showTxnModal.type}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={alert.isOpen}
        title="Notice"
        message={alert.message}
        confirmText="Okay"
        confirmType="danger"
        onConfirm={() => setAlert({ isOpen: false, message: '' })}
      />

      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this inventory transaction? This will affect stock levels and cannot be undone."
        confirmText="Delete"
        confirmType="danger"
        onConfirm={() => {
          deleteTransaction(deleteConfirm.txnId);
          setDeleteConfirm({ isOpen: false, txnId: null });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, txnId: null })}
      />

      <ConfirmModal 
        isOpen={deleteMasterConfirm.isOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete "${deleteMasterConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmType="danger"
        onConfirm={confirmDeleteMaster}
        onCancel={() => setDeleteMasterConfirm({ isOpen: false, type: null, id: null, name: '' })}
      />
    </div>
  );
};

export default InventoryManagement;
