import React, { useState, useMemo } from 'react';
import { Truck, MapPin, Plus, PackageOpen, AlertCircle } from 'lucide-react';
import { usePO } from '../../context/POContext';
import { useInspection } from '../../context/InspectionContext';
import { useDispatch } from '../../context/DispatchContext';
import { formatDate } from '../../utils/dateUtils';
import DataTable from '../common/DataTable';

const TransformerDispatch = () => {
  const { pos } = usePO();
  const { inspections } = useInspection();
  const { dispatchPlans, loadings, addDispatchPlan, addLoading, getStationMetrics } = useDispatch();

  const [selectedPO, setSelectedPO] = useState('');
  
  // Plan form state
  const [stationName, setStationName] = useState('');
  const [planQty, setPlanQty] = useState('');

  // Load Modal state
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [activeStation, setActiveStation] = useState(null);
  const [loadData, setLoadData] = useState({ date: new Date().toISOString().split('T')[0], qty: '', truckNo: '', remarks: '' });

  // Compute PO stats
  const currentPO = useMemo(() => pos.find(p => p.poNo === selectedPO), [pos, selectedPO]);
  
  const totalAccepted = useMemo(() => {
    if (!selectedPO) return 0;
    return inspections.filter(i => i.poNo === selectedPO).reduce((sum, i) => sum + Number(i.qtyAccepted || 0), 0);
  }, [inspections, selectedPO]);

  const stationMetrics = useMemo(() => {
    if (!selectedPO) return [];
    return getStationMetrics(selectedPO);
  }, [getStationMetrics, selectedPO, dispatchPlans, loadings]);

  const totalPlanned = stationMetrics.reduce((sum, m) => sum + m.plannedQty, 0);
  const totalLoaded = stationMetrics.reduce((sum, m) => sum + m.loadedQty, 0);

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!selectedPO || !stationName || !planQty) return;
    
    // Validation
    const availableToPlan = totalAccepted - totalPlanned;
    if (Number(planQty) > availableToPlan) {
      alert(`Cannot plan more than available accepted quantity (${availableToPlan}).`);
      return;
    }

    const success = await addDispatchPlan(selectedPO, stationName, Number(planQty));
    if (success) {
      setStationName('');
      setPlanQty('');
    }
  };

  const openLoadModal = (stationData) => {
    setActiveStation(stationData);
    setLoadData({ date: new Date().toISOString().split('T')[0], qty: '', truckNo: '', remarks: '' });
    setIsLoadModalOpen(true);
  };

  const handleLoadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPO || !activeStation || !loadData.qty) return;

    if (Number(loadData.qty) > activeStation.pendingQty) {
      alert(`Cannot load more than pending quantity for this station (${activeStation.pendingQty}).`);
      return;
    }

    const success = await addLoading(selectedPO, activeStation.station, Number(loadData.qty), loadData.date, loadData.truckNo, loadData.remarks);
    if (success) {
      setIsLoadModalOpen(false);
      setActiveStation(null);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        <Truck size={24} color="var(--accent-primary)" />
        Transformer Dispatch & Loading
      </h2>

      {/* PO Selector */}
      <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
        <label>Select Purchase Order</label>
        <select value={selectedPO} onChange={(e) => setSelectedPO(e.target.value)} required>
          <option value="">-- Choose PO --</option>
          {pos.map(p => (
            <option key={p.id} value={p.poNo}>{p.poNo} - {p.companyName}</option>
          ))}
        </select>
      </div>

      {selectedPO && currentPO && (
        <>
          {/* Dashboard Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ordered Quantity</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{currentPO.quantity}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Cleared Inspection</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{totalAccepted}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Total Planned</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{totalPlanned}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>Total Loaded</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{totalLoaded}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
            {/* Create Plan Panel */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} /> Add Station Plan
              </h3>
              <form onSubmit={handleAddPlan}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Station / Store Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Substation A" 
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Planned Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Pieces" 
                    value={planQty}
                    onChange={(e) => setPlanQty(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={totalAccepted - totalPlanned <= 0}>
                  <Plus size={18} /> Allocate Pieces
                </button>
                {totalAccepted - totalPlanned <= 0 && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center' }}>
                    No unallocated inspected pieces available.
                  </p>
                )}
              </form>
            </div>

            {/* Station Metrics Grid */}
            <div>
              <DataTable 
                title="Station-Wise Dispatch Status"
                data={stationMetrics}
                columns={[
                  { Header: 'STATION / STORE', accessor: 'station', Cell: ({value}) => <span style={{fontWeight: '600'}}>{value}</span> },
                  { Header: 'PLANNED', accessor: 'plannedQty' },
                  { Header: 'LOADED', accessor: 'loadedQty', Cell: ({value}) => <span style={{color: 'var(--success)', fontWeight: 'bold'}}>{value}</span> },
                  { Header: 'PENDING', accessor: 'pendingQty', Cell: ({value}) => (
                      <span style={{color: value > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 'bold'}}>{value}</span>
                  )},
                  { Header: 'ACTION', accessor: 'actions', Cell: ({row}) => (
                      <button 
                        onClick={() => openLoadModal(row)}
                        disabled={row.pendingQty <= 0}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: row.pendingQty > 0 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: row.pendingQty > 0 ? 'white' : 'var(--text-muted)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: row.pendingQty > 0 ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <PackageOpen size={14} /> Load Truck
                      </button>
                  )}
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* Loading Modal */}
      {isLoadModalOpen && activeStation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px',
            border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} color="var(--accent-primary)" />
              Load to {activeStation.station}
            </h3>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div><span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Pending:</span> <strong style={{color: 'var(--danger)'}}>{activeStation.pendingQty}</strong></div>
              <div><span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Already Loaded:</span> <strong style={{color: 'var(--success)'}}>{activeStation.loadedQty}</strong></div>
            </div>

            <form onSubmit={handleLoadSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Date of Loading</label>
                <input 
                  type="date" 
                  value={loadData.date}
                  onChange={(e) => setLoadData({...loadData, date: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Pieces Loaded</label>
                  <input 
                    type="number" 
                    min="1"
                    max={activeStation.pendingQty}
                    value={loadData.qty}
                    onChange={(e) => setLoadData({...loadData, qty: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Truck / Vehicle No.</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MH 12 AB 1234"
                    value={loadData.truckNo}
                    onChange={(e) => setLoadData({...loadData, truckNo: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Remarks / LR No.</label>
                <textarea 
                  placeholder="Any additional notes..."
                  value={loadData.remarks}
                  onChange={(e) => setLoadData({...loadData, remarks: e.target.value})}
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsLoadModalOpen(false)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Loading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TransformerDispatch;
