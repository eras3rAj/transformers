import sys

with open('src/pages/InventoryManagement.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add DataTable import
if "import DataTable from '../components/common/DataTable';" not in content:
    content = content.replace("import SkeletonLoader from '../components/common/SkeletonLoader';", "import SkeletonLoader from '../components/common/SkeletonLoader';\nimport DataTable from '../components/common/DataTable';")

# 2. Add ledger columns and replace the raw HTML table
old_table = """          <div style={{ overflowX: 'auto' }}>
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
          </div>"""

new_table = """
          <DataTable 
            title=""
            data={filteredTxns}
            columns={[
              { Header: 'DATE', accessor: 'date', Cell: ({ value, row }) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(value || row.timestamp)}</span> },
              { Header: 'TYPE', accessor: 'type', Cell: ({ value }) => (
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: value === 'IN' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: value === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                    {value}
                  </span>
                ) 
              },
              { Header: 'ITEM', accessor: 'item', Cell: ({ value }) => (
                  <span style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => {
                    const matchedItem = items.find(i => i.name === value);
                    if (matchedItem) setSelectedItemDetails(matchedItem);
                  }}>
                    {value}
                  </span>
                ) 
              },
              { Header: 'QTY', accessor: 'qty', Cell: ({ row }) => {
                  const matchedItem = items.find(i => i.name === row.item);
                  return <span style={{ fontWeight: '500' }}>{row.qty} {matchedItem?.unit || ''}</span>;
                } 
              },
              { Header: 'RATE', accessor: 'unitPrice', Cell: ({ value }) => value ? `₹${value}` : '-' },
              { Header: 'PARTY / DEPT', accessor: 'party', Cell: ({ row }) => (
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.companyName || row.department || '-'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.companyName ? 'VENDOR' : row.department ? 'INTERNAL' : ''}</div>
                  </div>
                ) 
              },
              { Header: 'BILL NO', accessor: 'billNo', Cell: ({ value }) => value || '-' },
              { Header: 'REMARKS', accessor: 'remarks', Cell: ({ value }) => (
                  <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={value}>
                    {value || '-'}
                  </div>
                ) 
              }
            ]}
          />"""

content = content.replace(old_table, new_table)

with open('src/pages/InventoryManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("DataTable patched into InventoryManagement.jsx")
