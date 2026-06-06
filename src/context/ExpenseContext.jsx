import { createContext, useContext, useEffect } from 'react';
import { useSupabaseCrud } from '../hooks/useSupabaseCrud';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const { data: expenses, loading, fetchAll, insert, update } = useSupabaseCrud('daily_expenses');

  useEffect(() => {
    fetchAll('created_at', false);
  }, [fetchAll]);

  const addExpense = async (expenseData) => {
    return await insert(expenseData);
  };

  const updateExpenseStatus = async (id, status, approvedBy) => {
    return await update(id, {
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    });
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      loading,
      addExpense, 
      updateExpenseStatus,
      refreshExpenses: () => fetchAll('created_at', false)
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
