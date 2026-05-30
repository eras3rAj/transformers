import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setExpenses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async (expenseData) => {
    const { data, error } = await supabase
      .from('daily_expenses')
      .insert([expenseData])
      .select();
      
    if (!error && data) {
      setExpenses(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const updateExpenseStatus = async (id, status, approvedBy) => {
    const { data, error } = await supabase
      .from('daily_expenses')
      .update({ 
        status, 
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (!error && data) {
      setExpenses(prev => prev.map(exp => exp.id === id ? data[0] : exp));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      loading,
      addExpense, 
      updateExpenseStatus,
      refreshExpenses: fetchExpenses
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
