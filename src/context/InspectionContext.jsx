import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const InspectionContext = createContext();

export const useInspection = () => useContext(InspectionContext);

export const InspectionProvider = ({ children }) => {
  const [schedules, setSchedules] = useState([]);
  const [inspections, setInspections] = useState([]);

  const fetchInspectionData = async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .in('action', ['po_schedule', 'po_inspection'])
      .order('timestamp', { ascending: true });

    if (!error && data) {
      const sched = [];
      const insp = [];
      const disp = [];

      data.forEach(log => {
        const payload = log.changes || {};
        if (log.action === 'po_schedule') {
          // We assume a single record per PO for schedules, containing an array
          sched.push({ id: log.id, poNo: log.claim_id, schedules: payload.schedules || [] });
        } else if (log.action === 'po_inspection') {
          insp.push({
            id: log.id,
            poNo: log.claim_id,
            type: payload.type,
            startDate: payload.startDate || payload.date || '', // fallback to old date
            endDate: payload.endDate || payload.date || '',
            qtyOffered: Number(payload.qtyOffered || 0),
            qtyInspected: Number(payload.qtyInspected || 0),
            qtyAccepted: Number(payload.qtyAccepted || 0),
            weight: payload.weight || '',
            remarks: payload.remarks || ''
          });
        }
      });

      // For schedules, we might have multiple updates over time. Keep the latest one per PO.
      const uniqueScheds = Object.values(sched.reduce((acc, curr) => {
        acc[curr.poNo] = curr;
        return acc;
      }, {}));

      setSchedules(uniqueScheds);
      setInspections(insp);
    }
  };

  useEffect(() => {
    fetchInspectionData();
  }, []);

  const saveSchedule = async (poNo, scheduleArray) => {
    const dbRecord = {
      action: 'po_schedule',
      user_name: 'system',
      claim_id: poNo,
      changes: { schedules: scheduleArray }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setSchedules(prev => {
        const filtered = prev.filter(s => s.poNo !== poNo);
        return [...filtered, { id: data[0].id, poNo, schedules: scheduleArray }];
      });
      return true;
    }
    return false;
  };

  const logInspection = async (inspectionData) => {
    const dbRecord = {
      action: 'po_inspection',
      user_name: 'system',
      claim_id: inspectionData.poNo,
      changes: {
        type: inspectionData.type,
        startDate: inspectionData.startDate,
        endDate: inspectionData.endDate,
        qtyOffered: inspectionData.qtyOffered,
        qtyInspected: inspectionData.qtyInspected,
        qtyAccepted: inspectionData.qtyAccepted,
        weight: inspectionData.weight,
        remarks: inspectionData.remarks
      }
    };
    const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
    if (!error && data) {
      setInspections(prev => [...prev, { id: data[0].id, ...inspectionData }]);
      return true;
    }
    return false;
  };

  const updateInspection = async (id, updatedData) => {
    const dbRecord = {
      type: updatedData.type,
      startDate: updatedData.startDate,
      endDate: updatedData.endDate,
      qtyOffered: updatedData.qtyOffered,
      qtyInspected: updatedData.qtyInspected,
      qtyAccepted: updatedData.qtyAccepted,
      weight: updatedData.weight,
      remarks: updatedData.remarks
    };

    // We fetch the log first to get the existing changes, then update it.
    // However, since system_logs stores JSON, we can just update the `changes` column.
    // Wait, system_logs has `changes` as jsonb. We will update the whole changes object.
    const { data, error } = await supabase.from('system_logs')
      .update({ changes: dbRecord })
      .eq('id', id)
      .select();

    if (!error && data) {
      setInspections(prev => prev.map(insp => insp.id === id ? { ...insp, ...updatedData } : insp));
      return true;
    }
    return false;
  };

  const deleteInspection = async (id) => {
    const { error } = await supabase.from('system_logs').delete().eq('id', id);
    if (!error) {
      setInspections(prev => prev.filter(insp => insp.id !== id));
      return true;
    }
    return false;
  };

  const getStatsForPO = (poNo, totalOrderedQty) => {
    const poSched = schedules.find(s => s.poNo === poNo)?.schedules || [];
    const poInsp = inspections.filter(i => i.poNo === poNo);

    const scheduledQty = poSched.reduce((sum, s) => sum + Number(s.quantity), 0);
    const inspectedQty = poInsp.reduce((sum, i) => sum + Number(i.qtyInspected), 0);
    
    // Balance Stage Inspection logic
    const stageInspectedQty = poInsp.filter(i => i.type === 'Stage').reduce((sum, i) => sum + Number(i.qtyInspected), 0);
    const acceptedQty = poInsp.filter(i => i.type === 'Final').reduce((sum, i) => sum + Number(i.qtyAccepted), 0);
    
    const balanceStageQty = stageInspectedQty - acceptedQty;

    // Dispatched = Accepted
    const dispatchedQty = acceptedQty;
    const balanceQty = totalOrderedQty - dispatchedQty;

    // Next Pending Schedule (First schedule that is not fully fulfilled)
    const sortedSchedules = [...poSched].sort((a, b) => new Date(a.date) - new Date(b.date));
    let remainingDelivered = acceptedQty;
    let nextSchedule = null;

    for (const schedule of sortedSchedules) {
      if (remainingDelivered >= Number(schedule.quantity)) {
        remainingDelivered -= Number(schedule.quantity);
      } else {
        nextSchedule = { ...schedule, balanceQty: Number(schedule.quantity) - remainingDelivered };
        break;
      }
    }

    return { scheduledQty, inspectedQty, stageInspectedQty, acceptedQty, dispatchedQty, balanceQty, balanceStageQty, nextSchedule };
  };

  return (
    <InspectionContext.Provider value={{ 
      schedules, inspections, 
      saveSchedule, logInspection, updateInspection, deleteInspection, getStatsForPO 
    }}>
      {children}
    </InspectionContext.Provider>
  );
};
