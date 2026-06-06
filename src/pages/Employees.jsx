import React, { useState } from 'react';
import { Users, Plus, Edit, Briefcase, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useEmployees } from '../context/EmployeeContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

const Employees = () => {
  const { employees, addEmployee, updateEmployee, loading } = useEmployees();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [statusPrompt, setStatusPrompt] = useState({ isOpen: false, employee: null, action: '' });
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    emp_code: '',
    name: '',
    department: 'Production',
    designation: '',
    contact: '',
    join_date: new Date().toISOString().split('T')[0],
    salary: '',
    pan_number: '',
    aadhaar_number: '',
    custom_department: ''
  });

  const baseDepartments = ['Production', 'Stores', 'Management', 'Quality', 'Sales', 'Logistics'];
  const departments = [...new Set([...baseDepartments, ...employees.map(e => e.department).filter(Boolean)])];

  const filteredEmployees = employees.filter(emp => {
    if (departmentFilter !== 'All' && emp.department !== departmentFilter) return false;
    return true;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const employeeData = {
      ...formData,
      department: formData.department === '+ Add New' ? formData.custom_department : formData.department,
      salary: formData.salary ? parseFloat(formData.salary) : null
    };
    delete employeeData.custom_department;
    
    if (editingEmployeeId) {
      await updateEmployee(editingEmployeeId, employeeData);
    } else {
      employeeData.status = 'Active';
      await addEmployee(employeeData);
    }
    
    setFormData({
      emp_code: '',
      name: '',
      department: 'Production',
      designation: '',
      contact: '',
      join_date: new Date().toISOString().split('T')[0],
      salary: '',
      pan_number: '',
      aadhaar_number: '',
      custom_department: ''
    });
    setEditingEmployeeId(null);
    setShowForm(false);
  };

  const generateNextEmpCode = () => {
    if (!employees || employees.length === 0) return 'VF-001';
    
    let maxNum = 0;
    employees.forEach(emp => {
      const match = emp.emp_code.match(/VF-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    
    return `VF-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleEditClick = (emp) => {
    setEditingEmployeeId(emp.id);
    setFormData({
      emp_code: emp.emp_code,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      contact: emp.contact || '',
      join_date: emp.join_date ? new Date(emp.join_date).toISOString().split('T')[0] : '',
      salary: emp.salary || '',
      pan_number: emp.pan_number || '',
      aadhaar_number: emp.aadhaar_number || '',
      custom_department: ''
    });
    setShowForm(true);
  };

  const confirmToggleStatus = async (employee, action) => {
    const newStatus = action === 'suspend' ? 'Resigned' : 'Active';
    await updateEmployee(employee.id, { status: newStatus });
    setStatusPrompt({ isOpen: false, employee: null, action: '' });
  };

  if (loading) {
    return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Loading employees...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={28} color="var(--accent-primary)" />
            Workforce Directory
          </h1>
          <p>Manage factory employees, departments, and payroll details.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => {
            setEditingEmployeeId(null);
            setFormData({
              emp_code: generateNextEmpCode(), name: '', department: 'Production', designation: '', contact: '',
              join_date: new Date().toISOString().split('T')[0], salary: '', pan_number: '', aadhaar_number: '', custom_department: ''
            });
            setShowForm(true);
          }}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>EMP CODE</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>NAME</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DESIGNATION & DEPT</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CONTACT</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>JOINED</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No employees found in this department.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: emp.status !== 'Active' ? 0.6 : 1 }} className="table-row">
                    <td style={{ padding: '1rem', fontWeight: '600', fontFamily: 'monospace' }}>{emp.emp_code}</td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>{emp.designation}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{emp.contact || '-'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(emp.join_date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      {emp.status === 'Active' ? (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Active</span>
                      ) : (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>{emp.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="icon-btn text-accent" title="Edit Employee" onClick={() => handleEditClick(emp)}>
                          <Edit size={18} />
                        </button>
                        {emp.status === 'Active' ? (
                          <button className="icon-btn text-warning" title="Mark Resigned" onClick={() => setStatusPrompt({ isOpen: true, employee: emp, action: 'suspend' })}>
                            <XCircle size={18} />
                          </button>
                        ) : (
                          <button className="icon-btn text-success" title="Mark Active" onClick={() => setStatusPrompt({ isOpen: true, employee: emp, action: 'reactivate' })}>
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingEmployeeId ? <Edit size={24} color="var(--accent-primary)" /> : <Plus size={24} color="var(--accent-primary)" />} 
              {editingEmployeeId ? 'Edit Employee Details' : 'Onboard New Employee'}
            </h3>
            
            <form onSubmit={handleCreateEmployee}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Employee Code</label>
                  <input type="text" name="emp_code" value={formData.emp_code} onChange={handleInputChange} className="input-field" placeholder="e.g. VF-100" required autoFocus />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="input-label">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="e.g. Rahul Sharma" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Department</label>
                  <select name="department" value={formData.department} onChange={handleInputChange} className="input-field" required>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="+ Add New">+ Add New...</option>
                  </select>
                  {formData.department === '+ Add New' && (
                    <input 
                      type="text" 
                      name="custom_department" 
                      value={formData.custom_department || ''} 
                      onChange={handleInputChange} 
                      className="input-field animate-fade-in" 
                      placeholder="Enter new department name" 
                      style={{ marginTop: '0.5rem' }} 
                      required 
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="input-field" placeholder="e.g. Senior Welder" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Contact Number</label>
                  <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className="input-field" placeholder="+91..." />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Join Date</label>
                  <input type="date" name="join_date" value={formData.join_date} onChange={handleInputChange} className="input-field" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Salary (Optional)</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className="input-field" placeholder="Monthly ₹" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">PAN Number (Optional)</label>
                  <input type="text" name="pan_number" value={formData.pan_number || ''} onChange={handleInputChange} className="input-field" placeholder="e.g. ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Aadhaar Number (Optional)</label>
                  <input type="text" name="aadhaar_number" value={formData.aadhaar_number || ''} onChange={handleInputChange} className="input-field" placeholder="e.g. 1234 5678 9012" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingEmployeeId ? 'Update Details' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={statusPrompt.isOpen}
        title={statusPrompt.action === 'suspend' ? 'Mark as Resigned/Inactive' : 'Reactivate Employee'}
        message={statusPrompt.action === 'suspend' 
          ? "Are you sure you want to mark this employee as inactive?" 
          : "Are you sure you want to mark this employee as active again?"}
        confirmText={statusPrompt.action === 'suspend' ? 'Mark Inactive' : 'Reactivate'}
        confirmType={statusPrompt.action === 'suspend' ? 'danger' : 'primary'}
        onConfirm={() => confirmToggleStatus(statusPrompt.employee, statusPrompt.action)}
        onCancel={() => setStatusPrompt({ isOpen: false, employee: null, action: '' })}
      />
    </div>
  );
};

export default Employees;
