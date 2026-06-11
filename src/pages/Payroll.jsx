import { useState, useMemo } from 'react';
import { FileText, Plus, Calculator } from 'lucide-react';
import { useEmployees } from '../context/EmployeeContext';
import DataTable from '../components/common/DataTable';
import '../components/layout/Layout.css';

const Payroll = () => {
  const { employees, loading } = useEmployees();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate default payroll based on employee base salary
  const payrollData = useMemo(() => {
    if (!employees) return [];
    
    // 22 working days as baseline
    const WORKING_DAYS = 22;
    
    return employees.map(emp => {
      const baseSalary = Number(emp.salary) || 0;
      const dailyRate = baseSalary / WORKING_DAYS;
      
      // Randomize somewhat for demonstration
      const daysWorked = emp.status === 'Active' ? WORKING_DAYS - Math.floor(Math.random() * 3) : 0;
      const overtimeHours = emp.status === 'Active' ? Math.floor(Math.random() * 10) : 0;
      
      // Calculate pay
      const regularPay = dailyRate * daysWorked;
      const otRate = dailyRate / 8 * 1.5; // time and a half
      const overtimePay = overtimeHours * otRate;
      const grossPay = regularPay + overtimePay;
      
      // Deductions (e.g. 10% tax/provident fund)
      const deductions = grossPay * 0.10;
      const netPay = grossPay - deductions;

      return {
        id: emp.id,
        emp_code: emp.emp_code,
        name: emp.name,
        department: emp.department,
        baseSalary: baseSalary.toFixed(2),
        daysWorked,
        regularPay: regularPay.toFixed(2),
        overtimeHours,
        overtimePay: overtimePay.toFixed(2),
        grossPay: grossPay.toFixed(2),
        deductions: deductions.toFixed(2),
        netPay: netPay.toFixed(2),
        status: emp.status
      };
    });
  }, [employees, selectedMonth]);

  const columns = [
    { Header: 'EMP CODE', accessor: 'emp_code' },
    { Header: 'NAME', accessor: 'name' },
    { Header: 'DEPT', accessor: 'department' },
    { Header: 'DAYS WORKED', accessor: 'daysWorked' },
    { Header: 'OT (HRS)', accessor: 'overtimeHours' },
    { Header: 'BASE SALARY', accessor: 'baseSalary', Cell: ({ value }) => `₹${Number(value).toLocaleString()}` },
    { Header: 'GROSS PAY', accessor: 'grossPay', Cell: ({ value }) => `₹${Number(value).toLocaleString()}` },
    { Header: 'DEDUCTIONS', accessor: 'deductions', Cell: ({ value }) => <span style={{ color: 'var(--danger)' }}>-₹{Number(value).toLocaleString()}</span> },
    { Header: 'NET PAY', accessor: 'netPay', Cell: ({ value }) => <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{Number(value).toLocaleString()}</span> }
  ];

  if (loading) return <div style={{ padding: '2rem' }}>Loading Payroll Data...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Payroll & Timesheet
          </h1>
          <p>Calculate wages, track overtime, and export timesheets to accounting software.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Month:</span>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="input-field" 
              style={{ marginBottom: 0 }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => {}}>
            <Calculator size={18} /> Run Payroll
          </button>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={payrollData}
        title={`Payroll_Export_${selectedMonth}`}
        searchPlaceholder="Search employee name or code..."
      />
    </div>
  );
};

export default Payroll;
