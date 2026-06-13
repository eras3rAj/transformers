import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const POContext = createContext();

export const usePO = () => useContext(POContext);

export const POProvider = ({ children }) => {
  const [pos, setPos] = useState([]);

  // Global categorical data for dropdowns (defaults + dynamic)
  const [boards, setBoards] = useState(['UPCL', 'MSEDCL', 'BESCOM', 'KSEB', 'TNEB']);
  const [capacities, setCapacities] = useState(['10kVA', '16kVA', '25kVA', '63kVA', '100kVA', '200kVA', '250kVA', '315kVA', '400kVA', '500kVA', '630kVA', '1000kVA']);
  const [gstRates, setGstRates] = useState(['18', '12', '5']);
  const [companies, setCompanies] = useState([]);
  const [poSeries, setPoSeries] = useState([]);

  const fetchPOs = async () => {
    const { data: delData } = await supabase.from('deleted_options').select('*');
    const deletedBoards = delData ? delData.filter(d => d.option_type === 'board').map(d => d.option_value) : [];
    
    // Parse existing PO series
    const parsedSeries = delData ? delData
      .filter(d => d.option_type === 'po_series')
      .map(d => {
        const [poNo, prefix] = d.option_value.split('|');
        return { poNo, prefix };
      }) : [];
    setPoSeries(parsedSeries);

    const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      // Map database snake_case to frontend camelCase
      const mappedPOs = data.map(po => ({
        id: po.id,
        poNo: po.po_no,
        companyName: po.company_name || 'Unassigned',
        utilityBoard: po.utility_board,
        conductorType: po.conductor_type,
        capacity: po.no_of_phases === '1-Phase' && !String(po.capacity).includes('Single Phase') ? `${po.capacity} (Single Phase)` : po.capacity,
        baseMonthStr: po.base_month_str,
        exWorks: Number(po.ex_works),
        freight: Number(po.freight),
        gstRate: Number(po.gst_rate),
        noOfPhases: po.no_of_phases || '3-Phase',
        quantity: po.quantity || 1,
        remarks: po.remarks || '',
        // Formula Weights (properly handle 0)
        weightFixed: po.weight_fixed !== null ? Number(po.weight_fixed) : 15,
        weightAl: po.weight_al !== null ? Number(po.weight_al) : 22,
        weightCu: po.weight_cu !== null ? Number(po.weight_cu) : 0,
        weightCrgo: po.weight_crgo !== null ? Number(po.weight_crgo) : 36,
        weightOil: po.weight_oil !== null ? Number(po.weight_oil) : 10,
        weightSteel: po.weight_steel !== null ? Number(po.weight_steel) : 12,
        weightInsulating: po.weight_insulating !== null ? Number(po.weight_insulating) : 5,
        weightCpi: po.weight_cpi !== null ? Number(po.weight_cpi) : 0,
      }));
      setPos(mappedPOs);

      // Dynamically extract any custom boards or capacities from the DB
      const dbBoards = [...new Set(mappedPOs.map(p => p.utilityBoard).filter(Boolean))].filter(b => !deletedBoards.includes(b));
      const dbCaps = [...new Set(mappedPOs.map(p => p.capacity).filter(Boolean))];
      const dbComps = [...new Set(mappedPOs.map(p => p.companyName).filter(Boolean))];
      
      const defaultBoards = ['UPCL', 'MSEDCL', 'BESCOM', 'KSEB', 'TNEB'].filter(b => !deletedBoards.includes(b));
      setBoards([...new Set([...defaultBoards, ...dbBoards])]);
      setCapacities(prev => [...new Set([...prev, ...dbCaps])]);
      setCompanies(prev => [...new Set([...prev, ...dbComps])]);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);



  const addPO = async (newPO) => {
    // Check if PO already exists locally by ID
    const existingIdx = newPO.id ? pos.findIndex(p => p.id === newPO.id) : -1;
    const oldPoNo = existingIdx >= 0 ? pos[existingIdx].poNo : null;
    
    const dbRecord = {
      po_no: newPO.poNo,
      company_name: newPO.companyName || 'Unassigned',
      utility_board: newPO.utilityBoard,
      conductor_type: newPO.conductorType,
      capacity: newPO.capacity ? String(newPO.capacity).replace(' (Single Phase)', '') : newPO.capacity,
      base_month_str: newPO.baseMonthStr,
      ex_works: newPO.exWorks,
      freight: newPO.freight,
      gst_rate: newPO.gstRate,
      no_of_phases: newPO.noOfPhases || '3-Phase',
      quantity: newPO.quantity || 1,
      remarks: newPO.remarks || '',
      weight_fixed: newPO.weightFixed !== undefined && newPO.weightFixed !== '' ? Number(newPO.weightFixed) : 15,
      weight_al: newPO.weightAl !== undefined && newPO.weightAl !== '' ? Number(newPO.weightAl) : 22,
      weight_cu: newPO.weightCu !== undefined && newPO.weightCu !== '' ? Number(newPO.weightCu) : 0,
      weight_crgo: newPO.weightCrgo !== undefined && newPO.weightCrgo !== '' ? Number(newPO.weightCrgo) : 36,
      weight_oil: newPO.weightOil !== undefined && newPO.weightOil !== '' ? Number(newPO.weightOil) : 10,
      weight_steel: newPO.weightSteel !== undefined && newPO.weightSteel !== '' ? Number(newPO.weightSteel) : 12,
      weight_insulating: newPO.weightInsulating !== undefined && newPO.weightInsulating !== '' ? Number(newPO.weightInsulating) : 5,
      weight_cpi: newPO.weightCpi !== undefined && newPO.weightCpi !== '' ? Number(newPO.weightCpi) : 0,
    };

    if (existingIdx >= 0) {
      // Update
      const existingId = pos[existingIdx].id;
      const { data, error } = await supabase.from('purchase_orders').update(dbRecord).eq('id', existingId).select();
      if (!error && data) {
        // Cascade update the poNo if it changed
        if (oldPoNo && oldPoNo !== newPO.poNo) {
          await supabase.from('system_logs').update({ claim_id: newPO.poNo }).eq('claim_id', oldPoNo);
          await supabase.from('warranty_claims').update({ po_no: newPO.poNo }).eq('po_no', oldPoNo);
        }

        setPos(prev => {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...newPO };
          return updated;
        });
      }
    } else {
      // Insert
      const { data, error } = await supabase.from('purchase_orders').insert([dbRecord]).select();
      if (!error && data) {
        const createdPO = { ...newPO, id: data[0].id };
        setPos(prev => [createdPO, ...prev]);
      }
    }
  };

  const deletePO = async (id) => {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (!error) {
      setPos(prev => prev.filter(po => po.id !== id));
      return true;
    }
    return false;
  };

  const addBoard = (board) => {
    if (!boards.includes(board)) setBoards(prev => [...prev, board]);
  };

  const removeBoard = async (board) => {
    await supabase.from('deleted_options').insert([{ option_type: 'board', option_value: board }]);
    setBoards(prev => prev.filter(b => b !== board));
  };

  const addCapacity = (cap) => {
    if (!capacities.includes(cap)) setCapacities(prev => [...prev, cap]);
  };

  const addGstRate = (rate) => {
    if (!gstRates.includes(rate)) setGstRates(prev => [...prev, rate]);
  };

  const addCompany = (company) => {
    if (!companies.includes(company)) setCompanies(prev => [...prev, company]);
  };

  const addPOSeries = async (poNo, prefix) => {
    const value = `${poNo}|${prefix}`;
    await supabase.from('deleted_options').insert([{ option_type: 'po_series', option_value: value }]);
    setPoSeries(prev => [...prev, { poNo, prefix }]);
  };

  return (
    <POContext.Provider value={{ 
      pos, addPO, deletePO,
      boards, addBoard, removeBoard,
      capacities, addCapacity, 
      gstRates, addGstRate,
      companies, addCompany,
      poSeries, addPOSeries
    }}>
      {children}
    </POContext.Provider>
  );
};
