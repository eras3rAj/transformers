import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BgLcContext = createContext();

export const useBgLc = () => useContext(BgLcContext);

export const BgLcProvider = ({ children }) => {
  const [lcs, setLcs] = useState([]);
  const [bgs, setBgs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLcs = async () => {
    const { data, error } = await supabase
      .from('letters_of_credit')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedLcs = data.map(lc => ({
        id: lc.id,
        dateOfIssue: lc.date_of_issue,
        usdAmount: Number(lc.usd_amount),
        paymentDueDays: Number(lc.payment_due_days),
        blDate: lc.bl_date,
        usdToInrPrice: Number(lc.usd_to_inr_price),
        createdAt: lc.created_at
      }));
      setLcs(mappedLcs);
    }
  };

  const fetchBgs = async () => {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedBgs = data.map(bg => ({
        id: bg.id,
        dateOfIssue: bg.date_of_issue,
        validTill: bg.valid_till,
        amount: Number(bg.amount),
        poId: bg.po_id,
        poNo: bg.po_no,
        isCourtCase: bg.is_court_case,
        courtCaseDetails: bg.court_case_details,
        createdAt: bg.created_at
      }));
      setBgs(mappedBgs);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchLcs(), fetchBgs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addLC = async (newLC) => {
    const dbRecord = {
      date_of_issue: newLC.dateOfIssue,
      usd_amount: Number(newLC.usdAmount),
      payment_due_days: Number(newLC.paymentDueDays),
      bl_date: newLC.blDate,
      usd_to_inr_price: Number(newLC.usdToInrPrice)
    };

    if (newLC.id) {
      // Update
      const { data, error } = await supabase
        .from('letters_of_credit')
        .update(dbRecord)
        .eq('id', newLC.id)
        .select();

      if (!error && data) {
        const updatedLC = {
          id: data[0].id,
          dateOfIssue: data[0].date_of_issue,
          usdAmount: Number(data[0].usd_amount),
          paymentDueDays: Number(data[0].payment_due_days),
          blDate: data[0].bl_date,
          usdToInrPrice: Number(data[0].usd_to_inr_price),
          createdAt: data[0].created_at
        };
        setLcs(prev => prev.map(lc => lc.id === newLC.id ? updatedLC : lc));
        return { success: true, data: updatedLC };
      }
      return { success: false, error };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('letters_of_credit')
        .insert([dbRecord])
        .select();

      if (!error && data) {
        const createdLC = {
          id: data[0].id,
          dateOfIssue: data[0].date_of_issue,
          usdAmount: Number(data[0].usd_amount),
          paymentDueDays: Number(data[0].payment_due_days),
          blDate: data[0].bl_date,
          usdToInrPrice: Number(data[0].usd_to_inr_price),
          createdAt: data[0].created_at
        };
        setLcs(prev => [createdLC, ...prev]);
        return { success: true, data: createdLC };
      }
      return { success: false, error };
    }
  };

  const deleteLC = async (id) => {
    const { error } = await supabase
      .from('letters_of_credit')
      .delete()
      .eq('id', id);

    if (!error) {
      setLcs(prev => prev.filter(lc => lc.id !== id));
      return { success: true };
    }
    return { success: false, error };
  };

  const addBG = async (newBG) => {
    const dbRecord = {
      date_of_issue: newBG.dateOfIssue,
      valid_till: newBG.validTill,
      amount: Number(newBG.amount),
      po_id: newBG.poId || null,
      po_no: newBG.poNo || null,
      is_court_case: !!newBG.isCourtCase,
      court_case_details: newBG.courtCaseDetails || null
    };

    if (newBG.id) {
      // Update
      const { data, error } = await supabase
        .from('bank_guarantees')
        .update(dbRecord)
        .eq('id', newBG.id)
        .select();

      if (!error && data) {
        const updatedBG = {
          id: data[0].id,
          dateOfIssue: data[0].date_of_issue,
          validTill: data[0].valid_till,
          amount: Number(data[0].amount),
          poId: data[0].po_id,
          poNo: data[0].po_no,
          isCourtCase: data[0].is_court_case,
          courtCaseDetails: data[0].court_case_details,
          createdAt: data[0].created_at
        };
        setBgs(prev => prev.map(bg => bg.id === newBG.id ? updatedBG : bg));
        return { success: true, data: updatedBG };
      }
      return { success: false, error };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('bank_guarantees')
        .insert([dbRecord])
        .select();

      if (!error && data) {
        const createdBG = {
          id: data[0].id,
          dateOfIssue: data[0].date_of_issue,
          validTill: data[0].valid_till,
          amount: Number(data[0].amount),
          poId: data[0].po_id,
          poNo: data[0].po_no,
          isCourtCase: data[0].is_court_case,
          courtCaseDetails: data[0].court_case_details,
          createdAt: data[0].created_at
        };
        setBgs(prev => [createdBG, ...prev]);
        return { success: true, data: createdBG };
      }
      return { success: false, error };
    }
  };

  const deleteBG = async (id) => {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', id);

    if (!error) {
      setBgs(prev => prev.filter(bg => bg.id !== id));
      return { success: true };
    }
    return { success: false, error };
  };

  return (
    <BgLcContext.Provider value={{
      lcs,
      bgs,
      loading,
      addLC,
      deleteLC,
      addBG,
      deleteBG,
      refreshData: loadData
    }}>
      {children}
    </BgLcContext.Provider>
  );
};
