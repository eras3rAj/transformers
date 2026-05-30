import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const WarrantyContext = createContext();

export const useWarranty = () => useContext(WarrantyContext);

export const WarrantyProvider = ({ children }) => {
  const [claims, setClaims] = useState([]);

  const fetchClaims = async () => {
    const { data, error } = await supabase.from('warranty_claims').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const mappedClaims = data.map(claim => ({
        id: claim.id,
        slNo: claim.sl_no,
        utilityBoard: claim.utility_board,
        storeName: claim.store_name,
        capacity: claim.capacity,
        poNo: claim.po_no,
        poDate: claim.po_date,
        damageDate: claim.damage_date,
        intimationDate: claim.intimation_date,
        returnDays: Number(claim.return_days),
        returnDate: claim.return_date,
        inspectionDate: claim.inspection_date,
        status: claim.status,
        remarks: claim.remarks,
        deletionReason: claim.deletion_reason,
        isHidden: claim.is_hidden
      }));
      setClaims(mappedClaims);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);



  const addOrUpdateClaim = async (claimData) => {
    const existingIdx = claims.findIndex(c => c.id === claimData.id);
    
    const dbRecord = {
      sl_no: claimData.slNo,
      utility_board: claimData.utilityBoard,
      store_name: claimData.storeName,
      capacity: claimData.capacity,
      po_no: claimData.poNo,
      po_date: claimData.poDate,
      damage_date: claimData.damageDate,
      intimation_date: claimData.intimationDate,
      return_days: claimData.returnDays,
      return_date: claimData.returnDate,
      inspection_date: claimData.inspectionDate,
      status: claimData.status,
      remarks: claimData.remarks,
      deletion_reason: claimData.deletionReason || null,
      is_hidden: claimData.isHidden || false
    };

    // If existingIdx >= 0 and it's not a temporary ID (we will assume real IDs are UUIDs or fetched from DB)
    // Actually, in our old logic, new claims had Date.now() as ID. Let's just check if it exists in our array.
    if (existingIdx >= 0 && claimData.id.length > 20) { // UUIDs are 36 chars
      const { data, error } = await supabase.from('warranty_claims').update(dbRecord).eq('id', claimData.id).select();
      if (!error && data) {
        setClaims(prev => prev.map(c => c.id === claimData.id ? { ...claimData, id: data[0].id } : c));
        return { ...claimData, id: data[0].id };
      }
    } else {
      const { data, error } = await supabase.from('warranty_claims').insert([dbRecord]).select();
      if (!error && data) {
        const newClaim = { ...claimData, id: data[0].id };
        setClaims(prev => [newClaim, ...prev]);
        return newClaim;
      }
    }
    return null;
  };

  const updateClaimStatus = async (id, status, isHidden, deletionReason = null) => {
    const dbRecord = { status, is_hidden: isHidden };
    if (deletionReason) dbRecord.deletion_reason = deletionReason;

    const { error } = await supabase.from('warranty_claims').update(dbRecord).eq('id', id);
    if (!error) {
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status, isHidden, deletionReason: deletionReason || c.deletionReason } : c));
    }
  };

  return (
    <WarrantyContext.Provider value={{ claims, addOrUpdateClaim, updateClaimStatus }}>
      {children}
    </WarrantyContext.Provider>
  );
};
