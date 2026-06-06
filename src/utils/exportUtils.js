import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to a formatted PDF document.
 * @param {string} title The title of the document
 * @param {Array<string>} headers Array of column headers
 * @param {Array<Array<any>>} rows Array of data rows (each row is an array matching headers)
 * @param {string} filename The filename to save as (without .pdf)
 */
export const exportToPDF = (title, headers, rows, filename) => {
  const doc = new jsPDF();

  // Add Logo/Header Text
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('VoltForge ERP', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(title, 14, 32);

  // Add generation timestamp
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

  // Auto-table
  doc.autoTable({
    startY: 45,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
};

/**
 * Export data to an Excel (.xlsx) file.
 * @param {Array<Object>} data Array of objects representing the rows
 * @param {string} sheetName Name of the worksheet
 * @param {string} filename The filename to save as (without .xlsx)
 */
export const exportToExcel = (data, sheetName, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
