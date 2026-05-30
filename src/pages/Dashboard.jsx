import React, { useMemo } from 'react';
import { Factory, AlertCircle, CheckCircle, Clock, Truck, TrendingUp, Package, FileText } from 'lucide-react';
import { usePO } from '../context/POContext';
import { usePV } from '../context/PVContext';
import { useProduction } from '../context/ProductionContext';
import { useInspection } from '../context/InspectionContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../components/layout/Layout.css';

const Dashboard = () => {
  const { pos, companies } = usePO();
  const { claims = [] } = usePV();
  const { productionLogs } = useProduction();
  const { inspections, schedules } = useInspection();

  const [companyFilter, setCompanyFilter] = React.useState('All');

  // 1. Global KPIs
  const filteredPOs = useMemo(() => {
    return companyFilter === 'All' ? pos : pos.filter(po => po.companyName === companyFilter);
  }, [pos, companyFilter]);
  
  const validPONos = useMemo(() => new Set(filteredPOs.map(po => po.poNo)), [filteredPOs]);

  const totalOrdered = useMemo(() => filteredPOs.reduce((sum, po) => sum + po.quantity, 0), [filteredPOs]);
  const totalDispatched = useMemo(() => inspections.filter(i => i.type === 'Final' && validPONos.has(i.poNo)).reduce((sum, i) => sum + Number(i.qtyAccepted), 0), [inspections, validPONos]);
  const pendingPVs = useMemo(() => claims.filter(c => c.status !== 'Settled' && validPONos.has(c.poNo)).length, [claims, validPONos]);
  
  // 2. Production Velocity Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = productionLogs.find(l => l.date === dateStr);
      
      let boxUp = 0, cca = 0, ht = 0, lt = 0;
      if (log && log.batches) {
        log.batches.forEach(b => {
          // If we have a company filter, only count batches for POs belonging to that company
          if (companyFilter !== 'All' && !validPONos.has(b.poNo)) return;
          
          if (b.component === 'Box Up') boxUp += b.quantity;
          if (b.component === 'CCA') cca += b.quantity;
          if (b.component === 'HT Winding') ht += b.quantity;
          if (b.component === 'LT Winding') lt += b.quantity;
        });
      }
      
      data.push({
        name: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        'Box Up': boxUp,
        'CCA': cca,
        'HT Winding': ht,
        'LT Winding': lt
      });
    }
    return data;
  }, [productionLogs]);

  const todaysBoxUps = chartData[6]['Box Up'];

  // 3. Upcoming Schedules
  const upcomingSchedules = useMemo(() => {
    const all = [];

    schedules.forEach(poSched => {
      if (companyFilter !== 'All' && !validPONos.has(poSched.poNo)) return;
      
      const poInsp = inspections.filter(i => i.poNo === poSched.poNo && i.type === 'Final');
      const acceptedQty = poInsp.reduce((sum, i) => sum + Number(i.qtyAccepted), 0);
      
      let remainingDelivered = acceptedQty;
      
      if (poSched.schedules) {
        const sorted = [...poSched.schedules].sort((a, b) => new Date(a.date) - new Date(b.date));
        for (const s of sorted) {
          if (remainingDelivered >= Number(s.quantity)) {
            remainingDelivered -= Number(s.quantity);
          } else {
            // Found the next unfulfilled schedule!
            const remainingToDeliver = Number(s.quantity) - remainingDelivered;
            all.push({ poNo: poSched.poNo, date: s.date, quantity: remainingToDeliver, originalQuantity: s.quantity });
            break; // only push the immediate next unfulfilled one per PO
          }
        }
      }
    });
    
    return all.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  }, [schedules, inspections, companyFilter, validPONos]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-primary)' }}>
            <Factory size={28} color="var(--accent-primary)" />
            Command Center
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Live overview of your entire manufacturing operations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Master Filter:</span>
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="input-field" style={{ marginBottom: 0, minWidth: '200px' }}>
            <option value="All">All Companies (Global)</option>
            {companies?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Active POs</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{filteredPOs.length}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{totalOrdered.toLocaleString()} Units Ordered</div>
            </div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Global Delivery Progress</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>{totalDispatched.toLocaleString()}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Units Dispatched</div>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--success)' }}>
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Pending PV Claims</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>{pendingPVs}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Unsettled Bills</div>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--warning)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Today's Output</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>{todaysBoxUps}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Transformers Boxed Up</div>
            </div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--danger)' }}>
              <Package size={24} />
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Production Velocity Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-primary)" />
            7-Day Production Velocity
          </h2>
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  itemStyle={{ fontWeight: '600' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Box Up" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CCA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="HT Winding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="LT Winding" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Schedules */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--warning)" />
            Upcoming Delivery Schedules
          </h2>
          
          {upcomingSchedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              No upcoming schedules found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {upcomingSchedules.map((sched, idx) => {
                const isUrgent = new Date(sched.date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // Less than 7 days
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: `4px solid ${isUrgent ? 'var(--danger)' : 'var(--accent-primary)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: '8px' }}>
                        <Truck size={20} color={isUrgent ? 'var(--danger)' : 'var(--accent-primary)'} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{sched.poNo}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(sched.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{sched.quantity}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Units Required</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
