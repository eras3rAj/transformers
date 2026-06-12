import sys

with open('src/pages/InventoryManagement.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add MultiSelect import
content = content.replace("import SkeletonLoader from '../components/common/SkeletonLoader';", "import SkeletonLoader from '../components/common/SkeletonLoader';\nimport MultiSelect from '../components/common/MultiSelect';")

# 2. Update setFlowFilters initial state
content = content.replace(
    "const [flowFilters, setFlowFilters] = useState({ startDate: '', endDate: '', showIn: true, showOut: true, usageType: 'ALL', entity: 'ALL', item: 'ALL', vendor: 'ALL' });",
    "const [flowFilters, setFlowFilters] = useState({ startDate: '', endDate: '', showIn: true, showOut: true, usageType: 'ALL', entity: 'ALL', items: [], vendors: [] });"
)

# 3. Replace the Item and Vendor basic selects with MultiSelect
old_item_select = """        <select 
          value={flowFilters.item} 
          onChange={e => setFlowFilters({...flowFilters, item: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Items</option>
          {items.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
        </select>"""

new_item_select = """        <MultiSelect 
          options={items.map(i => i.name)}
          selectedValues={flowFilters.items}
          onChange={(vals) => setFlowFilters({...flowFilters, items: vals})}
          placeholder="All Items"
        />"""

old_vendor_select = """        <select 
          value={flowFilters.vendor} 
          onChange={e => setFlowFilters({...flowFilters, vendor: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Suppliers</option>
          {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>"""

new_vendor_select = """        <MultiSelect 
          options={companies.map(c => c.name)}
          selectedValues={flowFilters.vendors}
          onChange={(vals) => setFlowFilters({...flowFilters, vendors: vals})}
          placeholder="All Suppliers"
        />"""

content = content.replace(old_item_select, new_item_select)
content = content.replace(old_vendor_select, new_vendor_select)

# 4. Update the "Clear" button to reset arrays
old_clear = "setFlowFilters({ startDate: '', endDate: '', showIn: true, showOut: true, usageType: 'ALL', entity: 'ALL', item: 'ALL', vendor: 'ALL' })"
new_clear = "setFlowFilters({ startDate: '', endDate: '', showIn: true, showOut: true, usageType: 'ALL', entity: 'ALL', items: [], vendors: [] })"
content = content.replace(old_clear, new_clear)

with open('src/pages/InventoryManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to InventoryManagement.jsx")
