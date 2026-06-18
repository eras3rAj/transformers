import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatDate } from '../utils/dateUtils';
import { Search, Download, Building2, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { exportToCSV } from '../utils/MaterialFlowUtils';
import DataTable from '../components/common/DataTable';

const CompanyLedger = () => {
  const { transactions, companies } = useInventory();
  
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'ALL' // 'ALL', 'IN', 'OUT'
  });

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredTxns = useMemo(() => {
    let txns = transactions.filter(t => t.companyName === selectedCompany);

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      txns = txns.filter(t => new Date(t.date).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      txns = txns.filter(t => new Date(t.date).getTime() <= end);
    }
    if (filters.type !== 'ALL') {
      txns = txns.filter(t => t.type === filters.type);
    }
    
    return txns.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedCompany, filters]);

  const summary = useMemo(() => {
    let totalInValue = 0;
    let totalOutValue = 0;
    let totalInQty = 0;
    let totalOutQty = 0;

    filteredTxns.forEach(t => {
      const val = parseFloat(t.qty) * (parseFloat(t.unitPrice) || 0);
      if (t.type === 'IN') {
        totalInValue += val;
        totalInQty += parseFloat(t.qty);
      } else {
        totalOutValue += val;
        totalOutQty += parseFloat(t.qty);
      }
    });

    return { totalInValue, totalOutValue, totalInQty, totalOutQty };
  }, [filteredTxns]);

  const handleExportCSV = () => {
    const dataToExport = filteredTxns.map(t => ({
      'Date': formatDate(t.date),
      'Type': t.type,
      'Item': t.item,
      'Quantity': t.qty,
      'Unit Price': t.unitPrice || '0',
      'Total Value': (parseFloat(t.qty) * (parseFloat(t.unitPrice) || 0)).toFixed(2),
      'Bill No': t.billNo || '-',
      'Remarks': t.remarks || '-'
    }));
    exportToCSV(dataToExport, `${selectedCompany || 'Company'}_Ledger`);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Filters Section */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end', zIndex: 10 }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={16} /> Select Company
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ marginBottom: 0, paddingLeft: '35px' }}
              placeholder="Search and select company..."
              value={dropdownOpen ? companySearch : selectedCompany}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                if (!dropdownOpen) setDropdownOpen(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
                setCompanySearch('');
              }}
            />
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '4px', boxShadow: 'var(--shadow-md)', maxHeight: '250px', overflowY: 'auto' }}>
                {(() => {
                  // Get a unique list of companies from existing transactions as well as the companies master list
                  const allCompanyNames = [...new Set([...companies.map(c => c.name), ...transactions.filter(t => t.companyName).map(t => t.companyName)])].filter(Boolean);
                  const filtered = allCompanyNames.filter(c => c.toLowerCase().includes(companySearch.toLowerCase())).sort((a, b) => a.localeCompare(b));
                  
                  return (
                    <>
                      {filtered.length > 0 ? filtered.map((c, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setSelectedCompany(c);
                            setDropdownOpen(false);
                            setCompanySearch('');
                          }}
                          style={{ padding: '0.8rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', backgroundColor: selectedCompany === c ? 'var(--bg-tertiary)' : 'transparent' }}
                          onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.target.style.backgroundColor = selectedCompany === c ? 'var(--bg-tertiary)' : 'transparent'}
                        >
                          {c}
                        </div>
                      )) : (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No matches found.</div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          {/* Overlay to close dropdown */}
          {dropdownOpen && (
            <div 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
              onClick={() => setDropdownOpen(false)}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '2 1 auto' }}>
          <div>
            <label className="input-label">Start Date</label>
            <input type="date" className="input-field" style={{ marginBottom: 0 }} value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
          </div>
          <div>
            <label className="input-label">End Date</label>
            <input type="date" className="input-field" style={{ marginBottom: 0 }} value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Type</label>
            <select className="input-field" style={{ marginBottom: 0, minWidth: '150px' }} value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="ALL">All Transactions</option>
              <option value="IN">Incoming (IN)</option>
              <option value="OUT">Outgoing (OUT)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 'auto' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={!selectedCompany || filteredTxns.length === 0}>
              <Download size={18} /> Export
            </button>
          </div>
        </div>
      </div>

      {!selectedCompany ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Building2 size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
          <h3>Select a Company</h3>
          <p>Search and select a company from the dropdown above to view its transaction ledger.</p>
        </div>
      ) : (
        <>
          {/* Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Incoming Value</h3>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(summary.totalInValue)}</p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.4rem', fontWeight: '600' }}>+{summary.totalInQty.toLocaleString()} units received</div>
                </div>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--success)' }}>
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Outgoing Value</h3>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(summary.totalOutValue)}</p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '0.4rem', fontWeight: '600' }}>-{summary.totalOutQty.toLocaleString()} units dispatched</div>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--danger)' }}>
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Net Difference (IN - OUT)</h3>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {formatCurrency(summary.totalInValue - summary.totalOutValue)}
                  </p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Based on current filtered range</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.8rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                  <ArrowRightLeft size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              Ledger Transactions
            </h3>
            
            {filteredTxns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No transactions found for {selectedCompany} in the specified date range.
              </div>
            ) : (
              <DataTable 
                data={filteredTxns}
                footerRow={
                  <>
                    <td colSpan={5} style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-muted)' }}>NET TOTAL (IN - OUT)</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                      {formatCurrency(summary.totalInValue - summary.totalOutValue)}
                    </td>
                    <td colSpan={2}></td>
                  </>
                }
                columns={[
                  { Header: 'DATE', accessor: 'date', Cell: ({ value }) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(value)}</span> },
                  { Header: 'TYPE', accessor: 'type', Cell: ({ value }) => (
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: value === 'IN' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: value === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                        {value}
                      </span>
                    ) 
                  },
                  { Header: 'ITEM', accessor: 'item', Cell: ({ value }) => <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{value}</span> },
                  { Header: 'QTY', accessor: 'qty', Cell: ({ value }) => <span style={{ fontWeight: '500' }}>{value}</span> },
                  { Header: 'RATE', accessor: 'unitPrice', Cell: ({ value }) => value ? formatCurrency(value) : '-' },
                  { Header: 'TOTAL VALUE', accessor: 'totalValue', Cell: ({ row }) => (
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatCurrency(parseFloat(row.qty) * (parseFloat(row.unitPrice) || 0))}
                      </span>
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
              />
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default CompanyLedger;
