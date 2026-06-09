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
    if (expenseData.payable_to) {
      expenseData.payable_to = expenseData.payable_to
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return await insert(expenseData);
  };

  const updateExpenseStatus = async (id, status, approvedBy, comment = '') => {
    return await update(id, {
      status,
      approved_by: approvedBy,
      approver_comment: comment,
      approved_at: new Date().toISOString()
    });
  };

  const updateExpenseComment = async (id, comment) => {
    return await update(id, {
      approver_comment: comment
    });
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      loading,
      addExpense, 
      updateExpenseStatus,
      updateExpenseComment,
      refreshExpenses: () => fetchAll('created_at', false)
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
