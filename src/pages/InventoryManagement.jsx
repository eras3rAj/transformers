import { useState, useMemo } from 'react';
import { PackageSearch, Search, Plus, MapPin, Database, Archive, Settings, FilePlus, LogIn, LogOut, Trash2, Building2, Edit, FileText } from 'lucide-react';
import { generateTransactionPDF, generateBatchIssuePDF } from '../utils/pdfGenerator';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { calculateInventoryInsights } from '../utils/predictiveAnalytics';
import { LineChart, AlertCircle } from 'lucide-react';
import '../components/layout/Layout.css';

const InventoryManagement = () => {
  const { locations, units, items, companies, departments, transactions, categories, loading, addLocation, addUnit, addItem, addCompany, addDepartment, logTransaction, logBatchTransactions, deleteTransaction, getStockAtLocation, getGlobalStock, saveCategory, deleteEntity, editEntity } = useInventory();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeCategoryTab, setActiveCategoryTab] = useState('');
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
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState({ isOpen: false, type: 'IN', item: null });
  const [editingMaster, setEditingMaster] = useState(null); // { type, id, oldName }
  const [issueCart, setIssueCart] = useState([]);
  const [batchUsageType, setBatchUsageType] = useState('INTERNAL');
  const [batchDepartment, setBatchDepartment] = useState('');

  // Form States
  const [locName, setLocName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [companyFormName, setCompanyFormName] = useState('');
  const [companyData, setCompanyData] = useState({ name: '', address: '', mobile: '', poc: '', gst: '' });
  const [departmentFormName, setDepartmentFormName] = useState('');
  const [categoryData, setCategoryData] = useState({ name: '', suppliers: [] });
  const [itemData, setItemData] = useState({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [], minStockLevels: {} });
  const [txnData, setTxnData] = useState({ qty: '', remarks: '', date: new Date().toISOString().split('T')[0], companyName: '', billNo: '', receivingDate: '', billDate: '', unitPrice: '', usageType: 'INTERNAL', department: '' });
  
  const [companySearch, setCompanySearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [batchDepartmentSearch, setBatchDepartmentSearch] = useState('');
  const [batchDepartmentDropdownOpen, setBatchDepartmentDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState('Supplier Companies');
  
  // Item search state for location view
  const [itemSearch, setItemSearch] = useState('');

  // Alert State
  const [alert, setAlert] = useState({ isOpen: false, message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, txnId: null });
  const [deleteMasterConfirm, setDeleteMasterConfirm] = useState({ isOpen: false, type: null, id: null, name: '' });
  
  // Derived Categories
  const contextCategories = categories.map(c => c.name);
  const derivedCategories = items.map(i => i.category).filter(Boolean);
  const existingCategories = [...new Set([...contextCategories, ...derivedCategories])].sort((a, b) => a.localeCompare(b));

  // Sorted Lists for UI
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const sortedCompanies = [...companies].sort((a, b) => a.name.localeCompare(b.name));
  const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));
  const sortedUnits = [...units].sort((a, b) => a.name.localeCompare(b.name));
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

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
    if (!companyData.name.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, companyData.name.trim(), { address: companyData.address, mobile: companyData.mobile, poc: companyData.poc, gst: companyData.gst });
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addCompany(companyData.name.trim(), companyData.address, companyData.mobile, companyData.poc, companyData.gst);
      if (!success) setAlert({ isOpen: true, message: "Company name already exists!" });
    }
    if (success) {
      setCompanyData({ name: '', address: '', mobile: '', poc: '', gst: '' });
      setShowCompanyModal(false);
      setEditingMaster(null);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!departmentFormName.trim()) return;
    let success;
    if (editingMaster) {
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, departmentFormName.trim());
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addDepartment(departmentFormName.trim());
      if (!success) setAlert({ isOpen: true, message: "Department name already exists!" });
    }
    if (success) {
      setDepartmentFormName('');
      setShowDepartmentModal(false);
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
      const res = await editEntity(editingMaster.type, editingMaster.id, editingMaster.oldName, itemData.name.trim(), { unit: itemData.unit, category: itemData.category, suppliers: itemData.suppliers, minStockLevels: itemData.minStockLevels });
      success = res.success;
      if (!success) setAlert({ isOpen: true, message: res.message });
    } else {
      success = await addItem(itemData.name.trim(), itemData.unit, itemData.category, itemData.suppliers, itemData.minStockLevels);
      if (!success) setAlert({ isOpen: true, message: "Item already exists!" });
    }
    if (success) {
      setItemData({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [], minStockLevels: {} });
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
      usageType: txnData.usageType,
      department: txnData.department,
      unitPrice: showTxnModal.type === 'IN' && txnData.unitPrice ? Number(txnData.unitPrice) : ''
    };

    await logTransaction(payload);
    setTxnData({ qty: '', remarks: '', date: new Date().toISOString().split('T')[0], companyName: '', billNo: '', receivingDate: '', billDate: '', unitPrice: '', usageType: 'INTERNAL', department: '' });
    setShowTxnModal({ isOpen: false, type: 'IN', item: null });
  };

  const validateAndCalculateQuantity = (inputStr) => {
    if (!inputStr) return { valid: false, message: '' };
    const normalized = inputStr.replace(/,/g, '+');
    const parts = normalized.split('+').map(p => p.trim()).filter(Boolean);
    
    if (parts.length === 0) return { valid: false, message: '' };

    let total = 0;
    for (const part of parts) {
      if (isNaN(Number(part))) return { valid: false, message: `Invalid number: ${part}` };
      if ((part.match(/\./g) || []).length > 1) return { valid: false, message: `Multiple decimals: ${part}` };
      const num = Number(part);
      if (num <= 0) return { valid: false, message: `Must be > 0: ${part}` };
      total += num;
    }
    // Round to 3 decimal places to avoid floating point issues
    return { valid: true, total: Math.round(total * 1000) / 1000 };
  };

  const handleBatchSubmit = async () => {
    const txnsToLog = [];
    
    for (const cartItem of issueCart) {
      const validation = validateAndCalculateQuantity(cartItem.qtyStr);
      if (!validation.valid) {
        setAlert({ isOpen: true, message: `Invalid quantity for ${cartItem.item.name}: ${validation.message}` });
        return;
      }
      
      const currentStock = getStockAtLocation(cartItem.item.name, activeTab);
      if (validation.total > currentStock) {
        setAlert({ isOpen: true, message: `Insufficient stock for ${cartItem.item.name}! Only ${currentStock} available.` });
        return;
      }

      const remarksPrefix = cartItem.qtyStr.includes(',') || cartItem.qtyStr.includes('+') 
        ? `Bobbins/Batch: ${cartItem.qtyStr} | ` : '';
        
      txnsToLog.push({
        location: activeTab,
        item: cartItem.item.name,
        type: 'OUT',
        qty: validation.total,
        date: new Date().toISOString().split('T')[0],
        remarks: remarksPrefix + (cartItem.remarks || ''),
        companyName: '',
        billNo: '',
        receivingDate: '',
        billDate: '',
        unitPrice: '',
        usageType: batchUsageType,
        department: batchUsageType === 'INTERNAL' ? batchDepartment : ''
      });
    }

    if (txnsToLog.length === 0) {
      setAlert({ isOpen: true, message: 'Cart is empty or invalid.' });
      return;
    }

    const success = await logBatchTransactions(txnsToLog);
    if (success) {
      generateBatchIssuePDF(issueCart, activeTab);
      setIssueCart([]);
      setAlert({ isOpen: true, message: `Successfully issued ${txnsToLog.length} items. Slip downloading.` });
    } else {
      setAlert({ isOpen: true, message: 'Failed to log batch transactions.' });
    }
  };

  const addToCart = (item) => {
    if (!issueCart.find(c => c.item.name === item.name)) {
      setIssueCart([...issueCart, { item, qtyStr: '', remarks: '' }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const removeFromCart = (itemName) => {
    setIssueCart(issueCart.filter(c => c.item.name !== itemName));
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
                      const minStock = item.minStockLevels?.[loc.name] || 0;
                      const isLowStock = minStock > 0 && locStock < minStock;
                      return (
                        <td key={loc.id} style={{ padding: '1rem', color: isLowStock ? 'var(--danger)' : locStock === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: isLowStock ? '700' : 'normal', backgroundColor: isLowStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                          {locStock.toLocaleString()}
                          {isLowStock && <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>Min: {minStock}</div>}
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
        {issueCart.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--accent-primary)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-primary)' }}>Batch Issue Cart</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '1rem', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>ITEM</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', width: '30%' }}>QTY (use , or + for bobbins)</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', width: '30%' }}>REMARKS</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {issueCart.map((cartItem, idx) => {
                    const val = validateAndCalculateQuantity(cartItem.qtyStr);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>{cartItem.item.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({cartItem.item.unit})</span></td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              style={{ marginBottom: 0, border: val.valid === false && cartItem.qtyStr ? '1px solid var(--danger)' : undefined }}
                              value={cartItem.qtyStr}
                              onChange={(e) => {
                                  const newCart = [...issueCart];
                                  newCart[idx].qtyStr = e.target.value;
                                  setIssueCart(newCart);
                                }}
                              placeholder="e.g. 20.1, 19.8"
                            />
                            {val.valid === false && cartItem.qtyStr && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>{val.message}</span>}
                            {val.valid && cartItem.qtyStr && <span style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>Total: {val.total}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            style={{ marginBottom: 0 }}
                            value={cartItem.remarks}
                            onChange={(e) => {
                                const newCart = [...issueCart];
                                newCart[idx].remarks = e.target.value;
                                setIssueCart(newCart);
                              }}
                            placeholder="Optional remarks"
                          />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          <button className="icon-btn-small" onClick={() => removeFromCart(cartItem.item.name)} title="Remove from cart">
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="input-label">Batch Usage Type</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="batchUsageType" value="INTERNAL" checked={batchUsageType === 'INTERNAL'} onChange={() => { setBatchUsageType('INTERNAL'); }} />
                    <span style={{ fontSize: '0.9rem' }}>Internal Use</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="batchUsageType" value="EXTERNAL" checked={batchUsageType === 'EXTERNAL'} onChange={() => { setBatchUsageType('EXTERNAL'); setBatchDepartment(''); }} />
                    <span style={{ fontSize: '0.9rem' }}>External Sale</span>
                  </label>
                </div>
              </div>
              {batchUsageType === 'INTERNAL' && (
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="input-label">Department</label>
                  <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ marginBottom: 0 }}
                        value={batchDepartmentDropdownOpen ? batchDepartmentSearch : batchDepartment}
                        onChange={e => {
                          setBatchDepartmentSearch(e.target.value);
                          if (!batchDepartmentDropdownOpen) setBatchDepartmentDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setBatchDepartmentDropdownOpen(true);
                          setBatchDepartmentSearch('');
                        }}
                        placeholder="Select or enter department..."
                      />
                      {batchDepartmentDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '4px', boxShadow: 'var(--shadow-md)', maxHeight: '200px', overflowY: 'auto' }}>
                          {(() => {
                            const term = batchDepartmentSearch.toLowerCase();
                            const mappedList = departments.filter(d => d.name.toLowerCase().includes(term)).sort((a,b) => a.name.localeCompare(b.name));
                            return (
                              <>
                                {mappedList.length > 0 && (
                                  <>
                                    <div style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)' }}>AVAILABLE DEPARTMENTS</div>
                                    {mappedList.map(d => (
                                      <div 
                                        key={d.id} 
                                        onClick={() => {
                                          setBatchDepartment(d.name);
                                          setBatchDepartmentDropdownOpen(false);
                                          setBatchDepartmentSearch('');
                                        }}
                                        style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s', backgroundColor: batchDepartment === d.name ? 'var(--accent-glow)' : 'transparent' }}
                                        onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={e => e.target.style.backgroundColor = batchDepartment === d.name ? 'var(--accent-glow)' : 'transparent'}
                                      >
                                        {d.name} {batchDepartment === d.name && <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>✓</span>}
                                      </div>
                                    ))}
                                  </>
                                )}
                                {mappedList.length === 0 && (
                                  <div style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching departments found.</div>
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
                      title="Add New Department"
                      style={{ border: '1px solid var(--border-color)', borderRadius: '8px', width: '42px', height: '42px', flexShrink: 0 }}
                      onClick={() => { setBatchDepartmentDropdownOpen(false); setShowDepartmentModal(true); }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIssueCart([])}>Clear Cart</button>
              <button className="btn btn-primary" onClick={handleBatchSubmit}>Submit Batch</button>
            </div>
          </div>
        )}

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
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem 1.2rem', borderBottom: '2px solid var(--accent-primary)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                    {cat}
                  </div>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ width: '50%', padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ITEM/RATING</th>
                          <th style={{ width: '20%', padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>CURRENT STOCK</th>
                          <th style={{ width: '30%', padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>QUICK ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map(item => {
                          const stock = getStockAtLocation(item.name, locName);
                          const minStock = item.minStockLevels?.[locName] || 0;
                          const isLowStock = minStock > 0 && stock < minStock;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isLowStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                              <td style={{ padding: '1rem', fontWeight: '600' }}>
                                {item.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.unit})</span>
                                {isLowStock && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.2rem 0.4rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '4px', whiteSpace: 'nowrap' }}>Low Stock (Min {minStock})</span>}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: isLowStock ? 'var(--danger)' : stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                  {stock.toLocaleString()}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'IN', item: item.name })}>
                                    <LogIn size={14} /> Stock In
                                  </button>
                                  <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'OUT', item: item.name })}>
                                    <LogOut size={14} /> Stock Out
                                  </button>
                                  <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => addToCart(item)} title="Add to Batch Issue Cart">
                                    <Plus size={14} /> Batch Out
                                  </button>
                                </div>
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
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>PARTY / DEPT</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>BILL NO.</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>ITEM</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>TYPE</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>QUANTITY</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>LOGGED BY</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>REMARKS</th>
                <th style={{ padding: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(t => t.location === locName).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((txn, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(txn.date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {txn.type === 'OUT' && txn.usageType === 'INTERNAL' ? txn.department : (txn.companyName || '-')}
                    {txn.usageType && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{txn.usageType}</div>}
                  </td>
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
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    <button onClick={() => generateTransactionPDF(txn)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', opacity: 0.8, transition: 'opacity 0.2s', marginRight: isSuperAdmin ? '0.8rem' : '0' }} title="Download PDF Receipt" onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.8}>
                      <FileText size={15} />
                    </button>
                    {isSuperAdmin && (
                      <button onClick={() => setDeleteConfirm({ isOpen: true, txnId: txn.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7, transition: 'opacity 0.2s' }} title="Delete Transaction" onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.7}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderSettings = () => {
    const tabs = ['Supplier Companies', 'Internal Departments', 'Master Categories', 'Store Locations', 'Units of Measure'];
    
    return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="card" style={{ padding: '0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0.5rem 1rem 0 1rem' }}>
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveSettingsTab(tab)}
              style={{
                padding: '0.8rem 1.5rem',
                background: activeSettingsTab === tab ? 'var(--bg-primary)' : 'transparent',
                color: activeSettingsTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: activeSettingsTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px'
              }}
            >
              {tab === 'Supplier Companies' ? <><Building2 size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>Supplier Companies</> : 
               tab === 'Internal Departments' ? <><Building2 size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>Internal Departments</> :
               tab === 'Master Categories' ? <><Database size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>Master Categories</> :
               tab === 'Store Locations' ? <><MapPin size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>Store Locations</> :
               <><Settings size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>Units of Measure</>}
            </button>
          ))}
        </div>
        
        <div style={{ padding: '2rem' }}>

          {activeSettingsTab === 'Master Categories' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Manage Categories</h3>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                  setEditingMaster(null);
                  setCategoryData({ name: '', suppliers: [] });
                  setSupplierSearch('');
                  setShowCategoryModal(true);
                }}><Plus size={16} style={{ marginRight: '0.4rem' }}/> Add Category</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sortedCategories.map(c => (
            <li key={c.id || c.name} style={{ padding: '0.8rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '600' }}>{c.name}</div>
                {isSuperAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn-small" onClick={() => {
                      setEditingMaster({ type: 'inv_category', id: c.id, oldName: c.name });
                      setCategoryData({ name: c.name, suppliers: c.suppliers });
                      setSupplierSearch('');
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
          )}

          {activeSettingsTab === 'Store Locations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Manage Store Locations</h3>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                  setEditingMaster(null);
                  setLocName('');
                  setShowLocationModal(true);
                }}><Plus size={16} style={{ marginRight: '0.4rem' }}/> Add Location</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sortedLocations.map(l => (
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
          )}

          {activeSettingsTab === 'Units of Measure' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Manage Units of Measure (UOM)</h3>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                  setEditingMaster(null);
                  setUnitName('');
                  setShowUnitModal(true);
                }}><Plus size={16} style={{ marginRight: '0.4rem' }}/> Add Unit</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sortedUnits.map(u => (
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
          )}

          {activeSettingsTab === 'Supplier Companies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Manage Supplier Companies</h3>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                  <div className="search-bar" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search companies..." 
                      className="search-input"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={() => {
                    setEditingMaster(null);
                    setCompanyData({ name: '', address: '', mobile: '', poc: '', gst: '' });
                    setShowCompanyModal(true);
                  }}><Plus size={16} style={{ marginRight: '0.4rem' }}/> Add Company</button>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sortedCompanies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).map(c => (
            <li key={c.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{c.name}</div>
                  {(c.poc || c.mobile || c.gst) && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {c.poc && <div><strong style={{ color: 'var(--text-secondary)' }}>POC:</strong> {c.poc}</div>}
                      {c.mobile && <div><strong style={{ color: 'var(--text-secondary)' }}>Mobile:</strong> {c.mobile}</div>}
                      {c.gst && <div><strong style={{ color: 'var(--text-secondary)' }}>GST:</strong> {c.gst}</div>}
                    </div>
                  )}
                  {c.address && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{c.address}</div>}
                </div>
                {isSuperAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn-small" onClick={() => {
                      setEditingMaster({ type: 'inv_company', id: c.id, oldName: c.name });
                      setCompanyData({ name: c.name, address: c.address || '', mobile: c.mobile || '', poc: c.poc || '', gst: c.gst || '' });
                      setShowCompanyModal(true);
                    }} title="Edit Company"><Edit size={14} color="var(--accent-primary)" /></button>
                    <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_company', c.id, c.name)} title="Delete Company"><Trash2 size={14} color="var(--danger)" /></button>
                  </div>
                )}
              </div>
            </li>
          ))}
              </ul>
            </div>
          )}

          {activeSettingsTab === 'Internal Departments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Manage Internal Departments</h3>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                  <div className="search-bar" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search departments..." 
                      className="search-input"
                      value={departmentSearch}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={() => {
                    setEditingMaster(null);
                    setDepartmentFormName('');
                    setShowDepartmentModal(true);
                  }}><Plus size={16} style={{ marginRight: '0.4rem' }}/> Add Department</button>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {departments.filter(d => d.name.toLowerCase().includes(departmentSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name)).map(d => (
            <li key={d.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{d.name}</div>
                {isSuperAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn-small" onClick={() => {
                      setEditingMaster({ type: 'inv_department', id: d.id, oldName: d.name });
                      setDepartmentFormName(d.name);
                      setShowDepartmentModal(true);
                    }} title="Edit Department"><Edit size={14} color="var(--accent-primary)" /></button>
                    <button className="icon-btn-small" onClick={() => handleDeleteMaster('inv_department', d.id, d.name)} title="Delete Department"><Trash2 size={14} color="var(--danger)" /></button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {departments.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No departments configured.</li>}
              </ul>
            </div>
          )}
          
        </div>
      </div>

      {/* Items Settings */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <FilePlus size={18} color="var(--success)" />
          <span>Master Items List</span>
          <button className="icon-btn" onClick={() => {
            setEditingMaster(null);
            setItemData({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [], minStockLevels: {} });
            setSupplierSearch('');
            setShowItemModal(true);
          }}><Plus size={18} /></button>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {existingCategories.length > 0 ? (() => {
            const currentCategoryTab = activeCategoryTab || existingCategories[0];
            return (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                {existingCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategoryTab(cat)}
                    style={{
                      padding: '0.6rem 1.2rem',
                      background: currentCategoryTab === cat ? 'var(--bg-tertiary)' : 'transparent',
                      color: currentCategoryTab === cat ? 'var(--accent-primary)' : 'var(--text-muted)',
                      border: 'none',
                      borderBottom: currentCategoryTab === cat ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {sortedItems.filter(i => i.category === currentCategoryTab).map(item => (
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
                              setItemData({ name: item.name, unit: item.unit, category: item.category, isNewCategory: false, suppliers: item.suppliers || [], minStockLevels: item.minStockLevels || {} });
                              setSupplierSearch('');
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
                {items.filter(i => i.category === currentCategoryTab).length === 0 && (
                  <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No items found in this category.</div>
                )}
              </div>
            </>
            );
          })() : (
            <div style={{ color: 'var(--text-muted)' }}>No items configured.</div>
          )}
        </div>
      </div>

    </div>
  );
};

  const renderAIInsights = () => {
    const insights = calculateInventoryInsights(transactions, items, getGlobalStock);
    
    return (
      <div className="animate-fade-in">
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <LineChart size={24} color="var(--accent-primary)" />
          Predictive Inventory Forecasting
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Calculated using the last 30 days of consumption (Burn Rate) and current Global Stock.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {insights.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              Not enough data. Perform some inventory outgoing transactions to see AI forecasts.
            </div>
          ) : (
            insights.map((insight, idx) => (
              <div key={idx} className="card" style={{ borderLeft: `4px solid ${insight.urgency === 'high' ? 'var(--danger)' : insight.urgency === 'medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{insight.itemName}</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: insight.urgency === 'high' ? 'rgba(239,68,68,0.1)' : insight.urgency === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)', color: insight.urgency === 'high' ? 'var(--danger)' : insight.urgency === 'medium' ? 'var(--warning)' : 'var(--success)' }}>
                    {insight.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Global Stock:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{insight.currentStock} {insight.unit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>30-Day Burn Rate:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{insight.dailyBurnRate} {insight.unit}/day</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Estimated Runway:</span>
                    <span style={{ fontWeight: '700', color: insight.urgency === 'high' ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {insight.urgency === 'high' && <AlertCircle size={14} />}
                      {insight.runwayDays} {insight.runwayDays === 'Infinite' ? '' : 'Days'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

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
        <button className={`tab ${activeTab === 'AI Insights' ? 'active' : ''}`} onClick={() => { setActiveTab('AI Insights'); setSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LineChart size={14} /> AI Insights
        </button>
      </div>

      {activeTab === 'Overview' && renderGlobalOverview()}
      {activeTab === 'Settings' && renderSettings()}
      {activeTab === 'AI Insights' && renderAIInsights()}
      {activeTab !== 'Overview' && activeTab !== 'Settings' && activeTab !== 'AI Insights' && renderLocationView(activeTab)}

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
                  {sortedUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Map Authorized Suppliers (Optional)</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Search suppliers..." 
                      value={supplierSearch}
                      onChange={e => setSupplierSearch(e.target.value)}
                      style={{ marginBottom: 0, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
                    {sortedCompanies.filter(c => c.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px' }} className="supplier-row">
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
                    {sortedCompanies.filter(c => c.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No companies found.</div>}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Minimum Stock Levels (Per Location)</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', padding: '0.5rem' }}>
                  {sortedLocations.map(loc => (
                    <div key={loc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.9rem' }}>{loc.name}</span>
                      <input 
                        type="number" 
                        min="0"
                        className="input-field" 
                        style={{ width: '100px', padding: '0.3rem 0.5rem', marginBottom: 0 }}
                        placeholder="Min Qty"
                        value={itemData.minStockLevels?.[loc.name] !== undefined ? itemData.minStockLevels[loc.name] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemData({
                            ...itemData,
                            minStockLevels: {
                              ...itemData.minStockLevels,
                              [loc.name]: val !== '' ? Number(val) : undefined
                            }
                          });
                        }}
                      />
                    </div>
                  ))}
                  {sortedLocations.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No locations configured.</div>}
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
          <div className="card animate-fade-in" style={{ width: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{editingMaster ? 'Edit' : 'Add'} Supplier Company</h3>
            <form onSubmit={handleAddCompany}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Company Name *</label>
                <input type="text" className="input-field" value={companyData.name} onChange={e => setCompanyData({ ...companyData, name: e.target.value })} placeholder="e.g. ABC Metals Pvt Ltd" autoFocus required />
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Point of Contact (Optional)</label>
                  <input type="text" className="input-field" value={companyData.poc} onChange={e => setCompanyData({ ...companyData, poc: e.target.value })} placeholder="Person Name" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Mobile Number (Optional)</label>
                  <input type="text" className="input-field" value={companyData.mobile} onChange={e => setCompanyData({ ...companyData, mobile: e.target.value })} placeholder="+91..." />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Address (Optional)</label>
                <textarea className="input-field" value={companyData.address} onChange={e => setCompanyData({ ...companyData, address: e.target.value })} placeholder="Full Address" rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">GST Number (Optional)</label>
                <input type="text" className="input-field" value={companyData.gst} onChange={e => setCompanyData({ ...companyData, gst: e.target.value })} placeholder="e.g. 22AAAAA0000A1Z5" style={{ textTransform: 'uppercase' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCompanyModal(false); setEditingMaster(null); setCompanyData({ name: '', address: '', mobile: '', poc: '', gst: '' }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDepartmentModal && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '400px', padding: '2rem' }}>
            <h3>{editingMaster ? 'Edit' : 'Add'} Department</h3>
            <form onSubmit={handleAddDepartment}>
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Department Name *</label>
                <input type="text" className="input-field" value={departmentFormName} onChange={e => setDepartmentFormName(e.target.value)} placeholder="e.g. Maintenance, Production" autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDepartmentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Department</button>
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
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Search suppliers..." 
                      value={supplierSearch}
                      onChange={e => setSupplierSearch(e.target.value)}
                      style={{ marginBottom: 0, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
                    {sortedCompanies.filter(c => c.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px' }} className="supplier-row">
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
                    {sortedCompanies.filter(c => c.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No companies found.</div>}
                  </div>
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
              {showTxnModal.type === 'OUT' && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="input-label">Usage Type</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="usageType" value="INTERNAL" checked={txnData.usageType === 'INTERNAL'} onChange={() => setTxnData({ ...txnData, usageType: 'INTERNAL', companyName: '' })} />
                        <span style={{ fontSize: '0.9rem' }}>Internal Use</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="usageType" value="EXTERNAL" checked={txnData.usageType === 'EXTERNAL'} onChange={() => setTxnData({ ...txnData, usageType: 'EXTERNAL', department: '' })} />
                        <span style={{ fontSize: '0.9rem' }}>External Sale</span>
                      </label>
                    </div>
                  </div>
                  {txnData.usageType === 'INTERNAL' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label className="input-label">Department</label>
                      <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            style={{ marginBottom: 0 }}
                            value={departmentDropdownOpen ? departmentSearch : txnData.department}
                            onChange={e => {
                              setDepartmentSearch(e.target.value);
                              if (!departmentDropdownOpen) setDepartmentDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setDepartmentDropdownOpen(true);
                              setDepartmentSearch('');
                            }}
                            placeholder="Select or enter department..."
                          />
                          {departmentDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '4px', boxShadow: 'var(--shadow-md)', maxHeight: '200px', overflowY: 'auto' }}>
                              {(() => {
                                const term = departmentSearch.toLowerCase();
                                const mappedList = departments.filter(d => d.name.toLowerCase().includes(term)).sort((a,b) => a.name.localeCompare(b.name));
                                return (
                                  <>
                                    {mappedList.length > 0 && (
                                      <>
                                        <div style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)' }}>AVAILABLE DEPARTMENTS</div>
                                        {mappedList.map(d => (
                                          <div 
                                            key={d.id} 
                                            onClick={() => {
                                              setTxnData({ ...txnData, department: d.name });
                                              setDepartmentDropdownOpen(false);
                                              setDepartmentSearch('');
                                            }}
                                            style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s', backgroundColor: txnData.department === d.name ? 'var(--accent-glow)' : 'transparent' }}
                                            onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.target.style.backgroundColor = txnData.department === d.name ? 'var(--accent-glow)' : 'transparent'}
                                          >
                                            {d.name} {txnData.department === d.name && <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>✓</span>}
                                          </div>
                                        ))}
                                      </>
                                    )}
                                    {mappedList.length === 0 && (
                                      <div style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching departments found.</div>
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
                          title="Add New Department"
                          style={{ border: '1px solid var(--border-color)', borderRadius: '8px', width: '42px', height: '42px', flexShrink: 0 }}
                          onClick={() => { setDepartmentDropdownOpen(false); setShowDepartmentModal(true); }}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {(showTxnModal.type === 'IN' || txnData.usageType === 'EXTERNAL') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">{showTxnModal.type === 'IN' ? 'Company Name' : 'Customer Company (Optional)'}</label>
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
                      required={showTxnModal.type === 'IN' && !txnData.companyName}
                    />
                    {companyDropdownOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', maxHeight: '160px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                        {(() => {
                          const targetItem = items.find(i => i.name === showTxnModal.item);
                          const mappedSuppliers = targetItem?.suppliers || [];
                          
                          // Filter mapped vs unmapped, then apply search
                          const mappedList = sortedCompanies.filter(c => mappedSuppliers.includes(c.name) && c.name.toLowerCase().includes(companySearch.toLowerCase()));
                          const otherList = sortedCompanies.filter(c => !mappedSuppliers.includes(c.name) && c.name.toLowerCase().includes(companySearch.toLowerCase()));

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
                    onClick={() => { setCompanyDropdownOpen(false); setEditingMaster(null); setCompanyData({ name: '', address: '', mobile: '', poc: '', gst: '' }); setShowCompanyModal(true); }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Bill / Invoice No. (Optional)</label>
                <input type="text" className="input-field" value={txnData.billNo} onChange={e => setTxnData({ ...txnData, billNo: e.target.value })} placeholder="E.g. INV-2026-0451" />
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
