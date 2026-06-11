with open('src/components/common/DataTable.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'import EmptyState' not in c:
    c = c.replace("import './DataTable.css';", "import './DataTable.css';\nimport EmptyState from './EmptyState';")

empty_state_old = """            {currentTableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  No records found matching your criteria.
                </td>
              </tr>
            ) : ("""

empty_state_new = """            {currentTableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <EmptyState 
                    title="No Records Found" 
                    message="We couldn't find any data matching your current filters or search criteria."
                  />
                </td>
              </tr>
            ) : ("""

c = c.replace(empty_state_old, empty_state_new)

with open('src/components/common/DataTable.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated DataTable.jsx')
