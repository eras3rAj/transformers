import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const EmployeeContext = createContext();

export const useEmployees = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
      
    if (!error && data) {
      setEmployees(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const addEmployee = async (employeeData) => {
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select();
      
    if (!error && data) {
      setEmployees(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const updateEmployee = async (id, updatedFields) => {
    const { data, error } = await supabase
      .from('employees')
      .update(updatedFields)
      .eq('id', id)
      .select();
      
    if (!error && data) {
      setEmployees(prev => prev.map(emp => emp.id === id ? data[0] : emp));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  return (
    <EmployeeContext.Provider value={{ 
      employees, 
      loading,
      addEmployee, 
      updateEmployee,
      refreshEmployees: fetchEmployees
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};
