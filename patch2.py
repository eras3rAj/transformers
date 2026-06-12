import sys

with open('src/pages/InventoryManagement.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update flowFilters state
content = content.replace("const [flowFilters, setFlowFilters] = useState({ startDate: '', endDate: '', type: 'ALL', usageType: 'ALL', entity: 'ALL' });", 
"const [flowFilters, setFlowFilters] = useState({ startDate: '', endDate: '', showIn: true, showOut: true, usageType: 'ALL', entity: 'ALL', item: 'ALL', vendor: 'ALL' });")

# 2. Update renderAdvancedFilters
old_filter_bar = """
        <select 
          value={flowFilters.type} 
          onChange={e => setFlowFilters({...flowFilters, type: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Directions</option>
          <option value="IN">Inward (IN)</option>
          <option value="OUT">Outward (OUT)</option>
        </select>
        
        <select 
          value={flowFilters.usageType} 
          onChange={e => setFlowFilters({...flowFilters, usageType: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Usage Types</option>
          <option value="INTERNAL">Internal Consumption</option>
          <option value="DISPATCH">Dispatch / Sale</option>
          <option value="LOSS">Loss / Damage</option>
        </select>
        
        <button 
          onClick={() => setFlowFilters({ startDate: '', endDate: '', type: 'ALL', usageType: 'ALL', entity: 'ALL' })}
          style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          Clear
        </button>"""

new_filter_bar = """
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={flowFilters.showIn} onChange={e => setFlowFilters({...flowFilters, showIn: e.target.checked})} />
          Stock IN
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={flowFilters.showOut} onChange={e => setFlowFilters({...flowFilters, showOut: e.target.checked})} />
          Stock OUT
        </label>
        
        <select 
          value={flowFilters.usageType} 
          onChange={e => setFlowFilters({...flowFilters, usageType: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Usage Types</option>
          <option value="INTERNAL">Internal Consumption</option>
          <option value="DISPATCH">Dispatch / Sale</option>
          <option value="LOSS">Loss / Damage</option>
        </select>

        <select 
          value={flowFilters.item} 
          onChange={e => setFlowFilters({...flowFilters, item: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Items</option>
          {items.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
        </select>

        <select 
          value={flowFilters.vendor} 
          onChange={e => setFlowFilters({...flowFilters, vendor: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Suppliers</option>
          {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select 
          value={flowFilters.entity} 
          onChange={e => setFlowFilters({...flowFilters, entity: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        
        <button 
          onClick={() => setFlowFilters({ startDate: '', endDate: '', showIn: true, showOut: true, usageType: 'ALL', entity: 'ALL', item: 'ALL', vendor: 'ALL' })}
          style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          Clear
        </button>"""

content = content.replace(old_filter_bar, new_filter_bar)

# 3. Add Transaction Ledger Table to renderAnalytics
ledger_table_ui = """
        {/* Section 3: Transaction Ledger */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Database size={24} color="var(--accent-primary)" />
            Filtered Transaction Ledger
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>ITEM</th>
                  <th>QTY</th>
                  <th>PARTY / DEPT</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions found for current filters.</td></tr>
                ) : (
                  filteredTxns.slice(0, 100).map((txn, idx) => (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(txn.date || txn.timestamp)}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: txn.type === 'IN' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: txn.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                          {txn.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500', cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => {
                        const matchedItem = items.find(i => i.name === txn.item);
                        if (matchedItem) setSelectedItemDetails(matchedItem);
                      }}>
                        {txn.item}
                      </td>
                      <td>{txn.qty}</td>
                      <td>{txn.companyName || txn.department || '-'}</td>
                      <td>{txn.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredTxns.length > 100 && <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Showing latest 100 transactions. Export CSV to see all.</p>}
          </div>
        </div>
      </div>
    );
"""

content = content.replace("</div>\n    );\n  };\n\n  const renderAIInsightsOld", ledger_table_ui + "\n  };\n\n  const renderAIInsightsOld")

with open('src/pages/InventoryManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully")
