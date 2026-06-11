export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) return;

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Format rows
  const csvRows = data.map(row => 
    headers.map(header => {
      const cell = row[header] === null || row[header] === undefined ? '' : row[header];
      // Escape quotes
      const escaped = String(cell).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );

  // Combine headers and rows
  const csvString = [headers.join(','), ...csvRows].join('\n');

  // Trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printDocument = (title, dataToPrint) => {
  // A simple function to generate a printable view using a temporary window
  const printWindow = window.open('', '_blank');
  
  if (!dataToPrint || !dataToPrint.length) return;
  const headers = Object.keys(dataToPrint[0]);

  const tableHtml = `
    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; text-align: left;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #cbd5e1;">
          ${headers.map(h => `<th style="padding: 12px; font-size: 14px; text-transform: uppercase; color: #475569;">${h.replace(/_/g, ' ')}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${dataToPrint.map(row => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            ${headers.map(h => `<td style="padding: 12px; font-size: 13px; color: #1e293b;">${row[h] || ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const htmlContent = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
          h1 { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; color: #1e293b; }
          .footer { margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; }
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="color: #64748b; margin-bottom: 30px;">Generated on: ${new Date().toLocaleString()}</p>
        ${tableHtml}
        <div class="footer">Confidential System Generated Report</div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for resources to load before triggering print
  setTimeout(() => {
    printWindow.print();
    // printWindow.close(); // Optional: close after printing
  }, 250);
};
