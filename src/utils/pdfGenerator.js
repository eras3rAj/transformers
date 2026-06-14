import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateTransactionPDF = (txn) => {
  const doc = new jsPDF();
  const isOut = txn.type === 'OUT';
  const title = isOut ? 'Material Issue Note' : 'Material Receipt Note';
  
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(txn.date).toLocaleDateString('en-GB')}`, 14, 30);
  doc.text(`Location: ${txn.location}`, 14, 35);
  
  let currentY = 40;
  if (!isOut && txn.companyName) {
    doc.text(`Supplier: ${txn.companyName}`, 14, currentY);
    currentY += 5;
    if (txn.billNo) {
      doc.text(`Bill No: ${txn.billNo}`, 14, currentY);
      currentY += 5;
    }
  }
  
  if (isOut && txn.usageType === 'INTERNAL') {
    doc.text(`Department: ${txn.department}`, 14, currentY);
    currentY += 5;
  } else if (isOut && txn.usageType === 'EXTERNAL' && txn.companyName) {
    doc.text(`Contractor: ${txn.companyName}`, 14, currentY);
    currentY += 5;
  }

  if (txn.remarks) {
    doc.text(`Remarks: ${txn.remarks}`, 14, currentY);
    currentY += 10;
  }
  
  currentY += 5;

  const tableData = [
    [
      1,
      txn.item,
      txn.qty
    ]
  ];

  doc.autoTable({
    startY: currentY,
    head: [['#', 'Item', 'Quantity']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  const finalY = doc.lastAutoTable.finalY || currentY;

  // Signatures
  doc.setFontSize(10);
  const signatureY = finalY + 40;
  doc.text("_______________________", 14, signatureY);
  doc.text("Store Manager", 20, signatureY + 5);
  
  doc.text("_______________________", 140, signatureY);
  doc.text(isOut ? "Material Receiver" : "Supplier / Driver", 145, signatureY + 5);
  
  doc.save(`${title.replace(/ /g, '_')}_${txn.id || Date.now()}.pdf`);
};

export const generateBatchIssuePDF = (cartItems, location) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Batch Material Issue Slip', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
  doc.text(`Location: ${location}`, 14, 35);
  
  const tableData = cartItems.map((item, idx) => [
    idx + 1,
    item.item.name,
    item.qtyStr,
    item.department || '-',
    item.remarks || '-'
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'Item', 'Quantity', 'Department', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  const finalY = doc.lastAutoTable.finalY || 45;
  const signatureY = finalY + 40;
  
  doc.text("_______________________", 14, signatureY);
  doc.text("Store Manager", 20, signatureY + 5);
  
  doc.text("_______________________", 140, signatureY);
  doc.text("Material Receiver", 145, signatureY + 5);
  
  doc.save(`Batch_Issue_Slip_${Date.now()}.pdf`);
};
