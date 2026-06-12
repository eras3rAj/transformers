import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const DispatchContext = createContext();

export const useDispatch = () => useContext(DispatchContext);

export const DispatchProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [dispatchPlans, setDispatchPlans] = useState([]);
  const [loadings, setLoadings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDispatchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .in('action', ['dispatch_plan', 'dispatch_load'])
      .order('timestamp', { ascending: true });

    if (!error && data) {
      const plans = [];
      const loads = [];

      data.forEach(log => {
        const payload = log.changes || {};
        if (log.action === 'dispatch_plan') {
          const existingIdx = plans.findIndex(p => p.poNo === log.claim_id && p.station === payload.station);
          if (existingIdx >= 0) {
            plans[existingIdx].plannedQty = Number(payload.plannedQty);
          } else {
            plans.push({
              id: log.id,
              poNo: log.claim_id,
              station: payload.station,
              plannedQty: Number(payload.plannedQty),
            });
          }
        } else if (log.action === 'dispatch_load') {
          loads.push({
            id: log.id,
            poNo: log.claim_id,
            station: payload.station,
            loadedQty: Number(payload.loadedQty),
            date: payload.date,
            truckNo: payload.truckNo,
            remarks: payload.remarks || ''
          });
        }
      });
      setDispatchPlans(plans);
      setLoadings(loads);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const addDispatchPlan = async (poNo, station, plannedQty) => {
    const newLog = {
      action: 'dispatch_plan',
      user_name: currentUser?.name || 'System',
      claim_id: poNo,
      changes: {
        station,
        plannedQty
      }
    };

    const { error } = await supabase.from('system_logs').insert([newLog]);
    if (error) {
      showToast("Error saving dispatch plan.", "error");
      return false;
    }
    showToast("Dispatch plan saved successfully.", "success");
    await fetchDispatchData();
    return true;
  };

  const addLoading = async (poNo, station, loadedQty, date, truckNo, remarks) => {
    const newLog = {
      action: 'dispatch_load',
      user_name: currentUser?.name || 'System',
      claim_id: poNo,
      changes: {
        station,
        loadedQty,
        date,
        truckNo,
        remarks
      }
    };

    const { error } = await supabase.from('system_logs').insert([newLog]);
    if (error) {
      showToast("Error saving loading details.", "error");
      return false;
    }
    showToast("Loading details saved successfully.", "success");
    await fetchDispatchData();
    return true;
  };

  const getStationMetrics = (poNo) => {
    const poPlans = dispatchPlans.filter(p => p.poNo === poNo);
    const poLoads = loadings.filter(l => l.poNo === poNo);

    return poPlans.map(plan => {
      const stationLoads = poLoads.filter(l => l.station === plan.station);
      const totalLoaded = stationLoads.reduce((sum, l) => sum + l.loadedQty, 0);
      return {
        station: plan.station,
        plannedQty: plan.plannedQty,
        loadedQty: totalLoaded,
        pendingQty: plan.plannedQty - totalLoaded,
        loads: stationLoads
      };
    });
  };

  return (
    <DispatchContext.Provider value={{
      dispatchPlans,
      loadings,
      loading,
      addDispatchPlan,
      addLoading,
      getStationMetrics,
      refreshDispatchData: fetchDispatchData
    }}>
      {children}
    </DispatchContext.Provider>
  );
};
