with open('src/pages/InventoryManagement.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

import_str = "import ItemDetailsModal from '../components/inventory/ItemDetailsModal';\n"
if 'import ItemDetailsModal' not in c:
    c = c.replace("import ConfirmModal from '../components/common/ConfirmModal';", "import ConfirmModal from '../components/common/ConfirmModal';\n" + import_str)

state_str = "  const [selectedItemDetails, setSelectedItemDetails] = useState(null);\n"
if 'selectedItemDetails' not in c:
    c = c.replace("  const [showLocationModal, setShowLocationModal] = useState(false);", state_str + "  const [showLocationModal, setShowLocationModal] = useState(false);")

btn_old = """                                    <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'IN', item: item.name })}>
                                      <LogIn size={14} /> Stock In
                                    </button>"""
btn_new = """                                    <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setSelectedItemDetails(item)}>
                                      <FileText size={14} /> Info
                                    </button>
                                    <button className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => setShowTxnModal({ isOpen: true, type: 'IN', item: item.name })}>
                                      <LogIn size={14} /> Stock In
                                    </button>"""
c = c.replace(btn_old, btn_new)

modal_old = "{/* Location Modal */}"
modal_new = """      <ItemDetailsModal 
        isOpen={!!selectedItemDetails} 
        onClose={() => setSelectedItemDetails(null)} 
        item={selectedItemDetails} 
        transactions={transactions} 
        currentStock={selectedItemDetails ? getGlobalStock(selectedItemDetails.name) : 0} 
      />

      {/* Location Modal */}"""
if '<ItemDetailsModal' not in c:
    c = c.replace(modal_old, modal_new)

with open('src/pages/InventoryManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated InventoryManagement.jsx')
