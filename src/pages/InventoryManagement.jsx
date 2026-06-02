import React, { useState, useMemo } from 'react';
import { PackageSearch, Plus, MapPin, Database, Archive, Settings, FilePlus, LogIn, LogOut, Trash2, Building2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

const InventoryManagement = () => {
  const { locations, units, items, companies, transactions, loading, addLocation, addUnit, addItem, addCompany, logTransaction, deleteTransaction, getStockAtLocation, getGlobalStock } = useInventory();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  
  // Modal States
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState({ isOpen: false, type: 'IN', item: null });

  // Form States
  const [locName, setLocName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [companyFormName, setCompanyFormName] = useState('');
  const [itemData, setItemData] = useState({ name: '', unit: '' });
  const [txnData, setTxnData] = useState({ qty: '', remarks: '', date: new Date().toISOString().split('T')[0], companyName: '', billNo: '', receivingDate: '', billDate: '', unitPrice: '' });
  
  // Company search state
  const [companySearch, setCompanySearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  // Alert State
  const [alert, setAlert] = useState({ isOpen: false, message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, txnId: null });

  // Add Settings Handlers
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!locName.trim()) return;
    const success = await addLocation(locName.trim());
    if (!success) setAlert({ isOpen: true, message: "Location name already exists!" });
    setLocName('');
    setShowLocationModal(false);
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return;
    const success = await addUnit(unitName.trim());
    if (!success) setAlert({ isOpen: true, message: "Unit already exists!" });
    setUnitName('');
    setShowUnitModal(false);
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!companyFormName.trim()) return;
    const success = await addCompany(companyFormName.trim());
    if (!success) setAlert({ isOpen: true, message: "Company name already exists!" });
    setCompanyFormName('');
    setShowCompanyModal(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemData.name.trim() || !itemData.unit) return;
    const success = await addItem(itemData.name.trim(), itemData.unit);
    if (!success) setAlert({ isOpen: true, message: "Item name already exists!" });
    setItemData({ name: '', unit: '' });
    setShowItemModal(false);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={20} color="var(--accent-primary)" /> Global Stock Overview
        </h3>
        {/* Global Search Input Bar */}
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', margin: 0, paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.9rem' }}
          />
          <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <PackageSearch size={16} />
          </div>
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {filteredItems.map(item => {
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
        {filteredItems.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', width: '100%', gridColumn: '1 / -1', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            {items.length === 0 ? "No items tracked yet. Head to Settings to configure your inventory items." : "No matching items found."}
          </div>
        )}
      </div>

      {filteredItems.length > 0 && (
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
                {filteredItems.map(item => (
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

  const renderLocationView = (locName) => (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--success)" /> Stock at {locName}
          </h3>
          
          {/* Location-specific Search Input Bar */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', margin: 0, paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.9rem' }}
            />
            <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <PackageSearch size={16} />
            </div>
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Modern compact responsive table layout */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ITEM NAME</th>
                <th style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STOCK LEVEL</th>
                <th style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const stock = getStockAtLocation(item.name, locName);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Database size={16} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: stock > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {stock.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'IN', item: item.name })}>
                          <LogIn size={13} /> Stock In
                        </button>
                        <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'OUT', item: item.name })}>
                          <LogOut size={13} /> Stock Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {items.length === 0 ? "No items configured in the system." : "No matching items found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

  const renderSettings = () => (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      
      {/* Locations Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} color="var(--accent-primary)" /> Store Locations</div>
          <button className="icon-btn" onClick={() => setShowLocationModal(true)}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {locations.map(l => (
            <li key={l.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '500' }}>
              {l.name}
            </li>
          ))}
          {locations.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No locations configured.</li>}
        </ul>
      </div>

      {/* Units Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={18} color="var(--warning)" /> Units of Measure (UOM)</div>
          <button className="icon-btn" onClick={() => setShowUnitModal(true)}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {units.map(u => (
            <li key={u.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '500' }}>
              {u.name}
            </li>
          ))}
          {units.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No units configured.</li>}
        </ul>
      </div>

      {/* Companies Settings */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={18} color="var(--success)" /> Supplier Companies</div>
          <button className="icon-btn" onClick={() => setShowCompanyModal(true)}><Plus size={18} /></button>
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {companies.map(c => (
            <li key={c.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '500' }}>
              {c.name}
            </li>
          ))}
          {companies.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No companies configured.</li>}
        </ul>
      </div>

      {/* Items Settings */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FilePlus size={18} color="var(--success)" /> Master Items List</div>
          <button className="icon-btn" onClick={() => setShowItemModal(true)}><Plus size={18} /></button>
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {items.map(i => (
            <div key={i.id} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{i.name}</strong>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-muted)' }}>{i.unit}</span>
            </div>
          ))}
          {items.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No items configured.</div>}
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
        <button className={`tab ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => { setActiveTab('Overview'); setSearchQuery(''); }}>
          Global Overview
        </button>
        {locations.map(loc => (
          <button key={loc.id} className={`tab ${activeTab === loc.name ? 'active' : ''}`} onClick={() => { setActiveTab(loc.name); setSearchQuery(''); }}>
            {loc.name}
          </button>
        ))}
        <button className={`tab ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => { setActiveTab('Settings'); setSearchQuery(''); }}>
          <Settings size={14} style={{ marginRight: '0.4rem', marginBottom: '-2px' }} /> Settings
        </button>
      </div>

      {activeTab === 'Overview' && renderGlobalOverview()}
      {activeTab === 'Settings' && renderSettings()}
      {activeTab !== 'Overview' && activeTab !== 'Settings' && renderLocationView(activeTab)}

      {/* Modals */}
      {showLocationModal && (
        <div className="modal-overlay">
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
        <div className="modal-overlay">
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
        <div className="modal-overlay">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem' }}>
            <h3>Add Master Item</h3>
            <form onSubmit={handleAddItem}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Item Name</label>
                <input type="text" className="input-field" value={itemData.name} onChange={e => setItemData({ ...itemData, name: e.target.value })} placeholder="e.g. Copper Wire 4mm" autoFocus required />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Unit of Measure</label>
                <select className="input-field" value={itemData.unit} onChange={e => setItemData({ ...itemData, unit: e.target.value })} required>
                  <option value="">Select a Unit...</option>
                  {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
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
        <div className="modal-overlay">
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

      {showTxnModal.isOpen && (
        <div className="modal-overlay">
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
                        {companies
                          .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                          .map(c => (
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
                        {companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                          <div style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No companies found.</div>
                        )}
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
    </div>
  );
};

export default InventoryManagement;
