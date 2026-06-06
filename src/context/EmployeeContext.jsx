import { createContext, useContext, useEffect } from 'react';
import { useSupabaseCrud } from '../hooks/useSupabaseCrud';

const EmployeeContext = createContext();

export const useEmployees = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }) => {
  const { data: employees, loading, fetchAll, insert, update } = useSupabaseCrud('employees');

  useEffect(() => {
    fetchAll('name', true);
  }, [fetchAll]);

  const addEmployee = async (employeeData) => {
    return await insert(employeeData);
  };

  const updateEmployee = async (id, updatedFields) => {
    return await update(id, updatedFields);
  };

  return (
    <EmployeeContext.Provider value={{ 
      employees, 
      loading,
      addEmployee, 
      updateEmployee,
      refreshEmployees: () => fetchAll('name', true)
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};

