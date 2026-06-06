import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CustomDutyContext = createContext();

export const useCustomDuty = () => useContext(CustomDutyContext);

export const CustomDutyProvider = ({ children }) => {
  const [customDuties, setCustomDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomDuties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_duties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedDuties = data.map(duty => ({
        id: duty.id,
        title: duty.title,
        importSource: duty.import_source,
        currency: duty.currency,
        exchangeRate: Number(duty.exchange_rate),
        invoiceValue: Number(duty.invoice_value),
        seaFreight: Number(duty.sea_freight),
        insurance: Number(duty.insurance),
        createdAt: duty.created_at
      }));
      setCustomDuties(mappedDuties);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomDuties();
  }, []);

  const addCustomDuty = async (newDuty) => {
    const dbRecord = {
      title: newDuty.title,
      import_source: newDuty.importSource,
      currency: newDuty.currency,
      exchange_rate: Number(newDuty.exchangeRate || 1.0),
      invoice_value: Number(newDuty.invoiceValue),
      sea_freight: Number(newDuty.seaFreight),
      insurance: Number(newDuty.insurance)
    };

    if (newDuty.id) {
      // Update
      const { data, error } = await supabase
        .from('custom_duties')
        .update(dbRecord)
        .eq('id', newDuty.id)
        .select();

      if (!error && data) {
        const updatedDuty = {
          id: data[0].id,
          title: data[0].title,
          importSource: data[0].import_source,
          currency: data[0].currency,
          exchangeRate: Number(data[0].exchange_rate),
          invoiceValue: Number(data[0].invoice_value),
          seaFreight: Number(data[0].sea_freight),
          insurance: Number(data[0].insurance),
          createdAt: data[0].created_at
        };
        setCustomDuties(prev => prev.map(d => d.id === newDuty.id ? updatedDuty : d));
        return { success: true, data: updatedDuty };
      }
      return { success: false, error };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('custom_duties')
        .insert([dbRecord])
        .select();

      if (!error && data) {
        const createdDuty = {
          id: data[0].id,
          title: data[0].title,
          importSource: data[0].import_source,
          currency: data[0].currency,
          exchangeRate: Number(data[0].exchange_rate),
          invoiceValue: Number(data[0].invoice_value),
          seaFreight: Number(data[0].sea_freight),
          insurance: Number(data[0].insurance),
          createdAt: data[0].created_at
        };
        setCustomDuties(prev => [createdDuty, ...prev]);
        return { success: true, data: createdDuty };
      }
      return { success: false, error };
    }
  };

  const deleteCustomDuty = async (id) => {
    const { error } = await supabase
      .from('custom_duties')
      .delete()
      .eq('id', id);

    if (!error) {
      setCustomDuties(prev => prev.filter(d => d.id !== id));
      return { success: true };
    }
    return { success: false, error };
  };

  return (
    <CustomDutyContext.Provider value={{
      customDuties,
      loading,
      addCustomDuty,
      deleteCustomDuty,
      refreshCustomDuties: fetchCustomDuties
    }}>
      {children}
    </CustomDutyContext.Provider>
  );
};
