import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VendorContext = createContext();

export const useVendors = () => useContext(VendorContext);

export const VendorProvider = ({ children }) => {
  const [vendors, setVendors] = useState([]);
  const [vendorPOs, setVendorPOs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Vendors
    const { data: vData, error: vError } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });
      
    if (!vError && vData) setVendors(vData);

    // Fetch Vendor POs
    const { data: poData, error: poError } = await supabase
      .from('vendor_pos')
      .select('*, vendors(name)')
      .order('created_at', { ascending: false });

    if (!poError && poData) setVendorPOs(poData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addVendor = async (vendorData) => {
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select();
      
    if (!error && data) {
      setVendors(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const updateVendor = async (id, updatedFields) => {
    const { data, error } = await supabase
      .from('vendors')
      .update(updatedFields)
      .eq('id', id)
      .select();
      
    if (!error && data) {
      setVendors(prev => prev.map(v => v.id === id ? data[0] : v));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const addVendorPO = async (poData) => {
    const { data, error } = await supabase
      .from('vendor_pos')
      .insert([{
        ...poData,
        total_price: poData.quantity * poData.unit_price
      }])
      .select('*, vendors(name)');
      
    if (!error && data) {
      setVendorPOs(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  const updateVendorPOStatus = async (id, newStatus) => {
    const { data, error } = await supabase
      .from('vendor_pos')
      .update({ status: newStatus })
      .eq('id', id)
      .select('*, vendors(name)');
      
    if (!error && data) {
      setVendorPOs(prev => prev.map(po => po.id === id ? data[0] : po));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  };

  return (
    <VendorContext.Provider value={{ 
      vendors, 
      vendorPOs,
      loading,
      addVendor, 
      updateVendor,
      addVendorPO,
      updateVendorPOStatus,
      refreshData: fetchData
    }}>
      {children}
    </VendorContext.Provider>
  );
};
