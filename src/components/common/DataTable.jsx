import React, { useState, useMemo } from 'react';
import { Download, Printer, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { exportToCSV, printDocument } from '../../utils/exportUtils';
import './DataTable.css';
import EmptyState from './EmptyState';

const DataTable = ({ 
  columns, 
  data, 
  title = "Data Export",
  searchPlaceholder = "Search records...",
  searchable = true,
  exportable = true,
  printable = true,
  pagination = true,
  defaultRowsPerPage = 10,
  footerRow = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let sortedData = [...data];

    // Global Search
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      sortedData = sortedData.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowercasedSearch)
        );
      });
    }

    // Sort
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortedData;
  }, [data, searchTerm, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const currentTableData = pagination 
    ? processedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : processedData;

  const handleExportCSV = () => {
    exportToCSV(processedData, `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
  };

  const handlePrint = () => {
    printDocument(title, processedData);
  };

  return (
    <div className="datatable-container">
      <div className="datatable-toolbar">
        {searchable && (
          <div className="datatable-search">
            <Search size={18} className="datatable-search-icon" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-field"
            />
          </div>
        )}
        <div className="datatable-actions">
          {exportable && (
            <button className="btn btn-secondary action-btn" onClick={handleExportCSV} title="Export CSV">
              <Download size={16} /> Export
            </button>
          )}
          {printable && (
            <button className="btn btn-secondary action-btn" onClick={handlePrint} title="Print/PDF">
              <Printer size={16} /> Print
            </button>
          )}
        </div>
      </div>

      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  className={col.sortable !== false ? 'sortable-header' : ''}
                  style={{ width: col.width || 'auto' }}
                >
                  <div className="header-content">
                    {col.Header}
                    {col.sortable !== false && (
                      <ArrowUpDown size={14} className={`sort-icon ${sortConfig.key === col.accessor ? 'active' : ''}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentTableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <EmptyState 
                    title="No Records Found" 
                    message="We couldn't find any data matching your current filters or search criteria."
                  />
                </td>
              </tr>
            ) : (
              currentTableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.Cell ? col.Cell({ value: row[col.accessor], row }) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
            {footerRow && currentTableData.length > 0 && (
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                {typeof footerRow === 'function' ? footerRow(processedData) : footerRow}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && processedData.length > 0 && (
        <div className="datatable-footer">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select 
              value={rowsPerPage} 
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="input-field select-compact"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="pagination-info">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, processedData.length)} of {processedData.length} entries
          </div>

          <div className="pagination-controls">
            <button 
              className="btn-icon" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="page-indicator">Page {currentPage} of {totalPages}</span>
            <button 
              className="btn-icon" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
