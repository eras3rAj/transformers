import { formatDate } from '../utils/dateUtils';
import { useState } from 'react';
import { ShoppingCart, Plus, Building } from 'lucide-react';
import { useVendors } from '../context/VendorContext';
import '../components/layout/Layout.css';

const VendorPurchasing = () => {
  const { vendors, vendorPOs, addVendor, addVendorPO, updateVendorPOStatus, loading } = useVendors();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'vendors'
  
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);

  const [vendorData, setVendorData] = useState({
    name: '', contact_person: '', phone: '', email: '', gst_number: '', address: ''
  });

  const [poData, setPoData] = useState({
    po_number: '', vendor_id: '', item: '', quantity: '', unit: 'kg', unit_price: '', expected_delivery: ''
  });

  const [editingVendor, setEditingVendor] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg('');
    let res;
    if (editingVendor) {
      res = await updateVendor(editingVendor.id, vendorData);
    } else {
      res = await addVendor(vendorData);
    }
    
    if (res && res.success) {
      setVendorData({ name: '', contact_person: '', phone: '', email: '', gst_number: '', address: '' });
      setShowVendorForm(false);
      setEditingVendor(null);
    } else {
      setAlertMsg(res?.error?.message || 'Failed to save vendor. Please try again.');
    }
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    await addVendorPO({
      ...poData,
      quantity: parseFloat(poData.quantity),
      unit_price: parseFloat(poData.unit_price)
    });
    setPoData({ po_number: '', vendor_id: '', item: '', quantity: '', unit: 'kg', unit_price: '', expected_delivery: '' });
    setShowPOForm(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading purchasing data...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={28} color="var(--accent-primary)" />
            Procurement & Vendors
          </h1>
          <p>Manage suppliers and track incoming raw materials.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('orders')}>
            Purchase Orders
          </button>
          <button className={`btn ${activeTab === 'vendors' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('vendors')}>
            Vendor Directory
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowPOForm(true)}>
              <Plus size={18} /> Create Vendor PO
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PO NUMBER</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>VENDOR</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MATERIAL</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>QTY & VALUE</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>EXPECTED</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPOs.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No purchase orders raised yet.</td></tr>
                  ) : (
                    vendorPOs.map(po => (
                      <tr key={po.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{po.po_number}</td>
                        <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{po.vendors?.name || 'Unknown'}</td>
                        <td style={{ padding: '1rem' }}>{po.item}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600' }}>{po.quantity} {po.unit}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{po.total_price?.toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          {po.expected_delivery ? formatDate(po.expected_delivery) : 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <select 
                            value={po.status} 
                            onChange={(e) => updateVendorPOStatus(po.id, e.target.value)}
                            className="input-field" 
                            style={{ 
                              marginBottom: 0, padding: '0.3rem', fontSize: '0.85rem',
                              backgroundColor: po.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 
                                               po.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-tertiary)',
                              color: po.status === 'Completed' ? 'var(--success)' : 
                                     po.status === 'Pending' ? 'var(--warning)' : 'var(--text-primary)'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Partially Received">Partially Received</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'vendors' && (
        <>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowVendorForm(true)}>
              <Plus size={18} /> Add New Vendor
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>VENDOR NAME</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CONTACT PERSON</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CONTACT DETAILS</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>GST NUMBER</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vendors added yet.</td></tr>
                  ) : (
                    vendors.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row">
                        <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={16} color="var(--text-muted)" /> {v.name}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>{v.contact_person || '-'}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          <div>{v.phone || '-'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{v.email || ''}</div>
                        </td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{v.gst_number || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button className="icon-btn-small" onClick={() => {
                            setEditingVendor(v);
                            setVendorData({ name: v.name, contact_person: v.contact_person || '', phone: v.phone || '', email: v.email || '', gst_number: v.gst_number || '', address: v.address || '' });
                            setShowVendorForm(true);
                          }} style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Forms */}
      {showVendorForm && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h3>{editingVendor ? 'Edit' : 'Add'} Vendor</h3>
            {alertMsg && <div style={{ padding: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{alertMsg}</div>}
            <form onSubmit={handleVendorSubmit}>
              <label className="input-label">Company Name *</label>
              <input type="text" className="input-field" required value={vendorData.name} onChange={e => setVendorData({...vendorData, name: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Contact Person</label>
                  <input type="text" className="input-field" value={vendorData.contact_person} onChange={e => setVendorData({...vendorData, contact_person: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Phone</label>
                  <input type="text" className="input-field" value={vendorData.phone} onChange={e => setVendorData({...vendorData, phone: e.target.value})} />
                </div>
              </div>
              
              <label className="input-label">GST Number</label>
              <input type="text" className="input-field" value={vendorData.gst_number} onChange={e => setVendorData({...vendorData, gst_number: e.target.value})} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVendorForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPOForm && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
            <h3>Create Purchase Order</h3>
            <form onSubmit={handlePOSubmit}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">PO Number *</label>
                  <input type="text" className="input-field" required placeholder="e.g. VPO-001" value={poData.po_number} onChange={e => setPoData({...poData, po_number: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Vendor *</label>
                  <select className="input-field" required value={poData.vendor_id} onChange={e => setPoData({...poData, vendor_id: e.target.value})}>
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <label className="input-label">Material Name *</label>
              <input type="text" className="input-field" required placeholder="e.g. Transformer Oil" value={poData.item} onChange={e => setPoData({...poData, item: e.target.value})} />

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Quantity *</label>
                  <input type="number" className="input-field" required value={poData.quantity} onChange={e => setPoData({...poData, quantity: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Unit *</label>
                  <select className="input-field" required value={poData.unit} onChange={e => setPoData({...poData, unit: e.target.value})}>
                    <option value="kg">KG</option>
                    <option value="ltr">Liters</option>
                    <option value="nos">Numbers</option>
                    <option value="tons">Tons</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Unit Price (₹) *</label>
                  <input type="number" className="input-field" required value={poData.unit_price} onChange={e => setPoData({...poData, unit_price: e.target.value})} />
                </div>
              </div>

              <label className="input-label">Expected Delivery Date</label>
              <input type="date" className="input-field" value={poData.expected_delivery} onChange={e => setPoData({...poData, expected_delivery: e.target.value})} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPOForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={vendors.length === 0}>Raise PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorPurchasing;
