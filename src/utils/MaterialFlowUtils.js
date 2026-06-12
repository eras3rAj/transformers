export const processMaterialFlow = (transactions, filters = {}) => {
  let filteredTxns = [...transactions];

  // Apply filters
  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    filteredTxns = filteredTxns.filter(t => new Date(t.date).getTime() >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    filteredTxns = filteredTxns.filter(t => new Date(t.date).getTime() <= end);
  }
  if (filters.type && filters.type !== 'ALL') {
    filteredTxns = filteredTxns.filter(t => t.type === filters.type);
  }
  if (filters.usageType && filters.usageType !== 'ALL') {
    filteredTxns = filteredTxns.filter(t => t.usageType === filters.usageType);
  }
  if (filters.entity && filters.entity !== 'ALL') {
    filteredTxns = filteredTxns.filter(t => t.department === filters.entity || t.companyName === filters.entity);
  }

  // 1. Top Consumers (Departments) - based on OUT transactions and unitPrice
  const departmentConsumption = {};
  filteredTxns.filter(t => t.type === 'OUT' && t.department).forEach(t => {
    const dept = t.department;
    const value = parseFloat(t.qty) * (parseFloat(t.unitPrice) || 0);
    if (!departmentConsumption[dept]) {
      departmentConsumption[dept] = { qty: 0, value: 0 };
    }
    departmentConsumption[dept].qty += parseFloat(t.qty);
    departmentConsumption[dept].value += value;
  });

  const topConsumers = Object.entries(departmentConsumption)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value);

  // 2. Top Suppliers - based on IN transactions
  const supplierVolume = {};
  filteredTxns.filter(t => t.type === 'IN' && t.companyName).forEach(t => {
    const sup = t.companyName;
    const value = parseFloat(t.qty) * (parseFloat(t.unitPrice) || 0);
    if (!supplierVolume[sup]) {
      supplierVolume[sup] = { qty: 0, value: 0 };
    }
    supplierVolume[sup].qty += parseFloat(t.qty);
    supplierVolume[sup].value += value;
  });

  const topSuppliers = Object.entries(supplierVolume)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value);

  // 3. In vs Out Monthly Trend
  const monthlyTrendMap = {};
  filteredTxns.forEach(t => {
    // Format to YYYY-MM
    const dateObj = new Date(t.date);
    if (isNaN(dateObj.getTime())) return;
    
    const month = dateObj.toISOString().slice(0, 7);
    if (!monthlyTrendMap[month]) {
      monthlyTrendMap[month] = { month, inQty: 0, inValue: 0, outQty: 0, outValue: 0 };
    }
    
    const value = parseFloat(t.qty) * (parseFloat(t.unitPrice) || 0);
    if (t.type === 'IN') {
      monthlyTrendMap[month].inQty += parseFloat(t.qty);
      monthlyTrendMap[month].inValue += value;
    } else {
      monthlyTrendMap[month].outQty += parseFloat(t.qty);
      monthlyTrendMap[month].outValue += value;
    }
  });

  const monthlyTrend = Object.values(monthlyTrendMap).sort((a, b) => a.month.localeCompare(b.month));

  return {
    filteredTxns,
    topConsumers,
    topSuppliers,
    monthlyTrend
  };
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] || '')).join(','))
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
