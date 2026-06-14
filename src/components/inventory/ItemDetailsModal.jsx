import React, { useMemo, useState } from 'react';
import { X, Box, ArrowDownRight, ArrowUpRight, Truck, Filter } from 'lucide-react';
import DataTable from '../common/DataTable';
import DynamicMetric from '../common/DynamicMetric';
import { formatDate } from '../../utils/dateUtils';

const ItemDetailsModal = ({ isOpen, onClose, item, transactions = [], currentStock = 0 }) => {
  const [filterType, setFilterType] = useState('ALL');
  if (!isOpen || !item) return null;

  // Filter transactions specifically for this item
  const itemTransactions = useMemo(() => {
    return transactions
      .filter(t => t.item === item.name)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions, item]);

  // Calculate metrics
  const metrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    const uniqueParties = new Set();

    itemTransactions.forEach(t => {
      if (t.type === 'IN') {
        totalIn += Number(t.qty || 0);
      } else if (t.type === 'OUT') {
        totalOut += Number(t.qty || 0);
      }
      
      if (t.party) {
        uniqueParties.add(t.party);
      }
    });

    return { totalIn, totalOut, uniquePartiesCount: uniqueParties.size };
  }, [itemTransactions]);

  const columns = [
    { Header: 'DATE', accessor: 'date', Cell: ({ value }) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(value)}</span> },
    { Header: 'PARTY / DEPT', accessor: 'party', Cell: ({ value, row }) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
          {row.partyType && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.partyType.toUpperCase()}</div>}
        </div>
      ) 
    },
    { Header: 'BILL NO', accessor: 'billNo' },
    { 
      Header: 'TYPE', 
      accessor: 'type', 
      Cell: ({ value }) => (
        <span style={{ 
          padding: '0.2rem 0.5rem', 
          borderRadius: '4px', 
          fontSize: '0.75rem', 
          fontWeight: 'bold',
          backgroundColor: value === 'IN' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: value === 'IN' ? 'var(--success)' : 'var(--danger)'
        }}>
          {value}
        </span>
      )
    },
    { 
      Header: 'QUANTITY', 
      accessor: 'qty', 
      Cell: ({ value, row }) => (
        <span style={{ fontWeight: 'bold', color: row.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
          {row.type === 'IN' ? '+' : '-'}{Number(value).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.unit}</span>
        </span>
      )
    },
    { Header: 'LOCATION', accessor: 'location' },
    { Header: 'LOGGED BY', accessor: 'user' },
    { Header: 'REMARKS', accessor: 'remarks', Cell: ({ value }) => <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{value}</span> }
  ];

  return (
    <div className="modal-backdrop">
      <div className="card animate-fade-in glass-panel" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <Box size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{item.name}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                <span>Category: {item.category || 'Uncategorized'}</span>
                <span>Unit: {item.unit}</span>
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={24} color="var(--text-muted)" />
          </button>
        </div>

        {/* Metrics Summary */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Box size={14}/> Current Stock</span>
            <DynamicMetric value={currentStock} size="large" />
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ArrowDownRight size={14} color="var(--success)"/> Total IN</span>
            <DynamicMetric value={metrics.totalIn} size="large" />
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ArrowUpRight size={14} color="var(--danger)"/> Total OUT</span>
            <DynamicMetric value={metrics.totalOut} size="large" />
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Truck size={14}/> Associated Parties</span>
            <DynamicMetric value={metrics.uniquePartiesCount} size="large" />
          </div>
        </div>

        {/* Ledger Table */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Transaction Ledger</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select 
                className="input-field" 
                style={{ marginBottom: 0, padding: '0.4rem 2rem 0.4rem 0.8rem', width: 'auto' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Entries</option>
                <option value="IN">Stock In Only</option>
                <option value="OUT">Stock Out Only</option>
              </select>
            </div>
          </div>
          <DataTable 
            columns={columns}
            data={filterType === 'ALL' ? itemTransactions : itemTransactions.filter(t => t.type === filterType)}
            title={`${item.name.replace(/\s+/g, '_')}_Ledger`}
            searchPlaceholder="Filter by vendor, department, IN, OUT..."
            pagination={true}
            defaultRowsPerPage={10}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
