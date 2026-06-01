import React, { useMemo } from 'react';
import { Factory, AlertCircle, CheckCircle, Clock, Truck, TrendingUp, Package, FileText } from 'lucide-react';
import { usePO } from '../context/POContext';
import { usePV } from '../context/PVContext';
import { useProduction } from '../context/ProductionContext';
import { useInspection } from '../context/InspectionContext';
import { useExpenses } from '../context/ExpenseContext';
import { useWarranty } from '../context/WarrantyContext';
import { useInventory } from '../context/InventoryContext';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../components/layout/Layout.css';

const Dashboard = () => {
  const { pos, companies } = usePO();
  const { claims = [] } = usePV();
  const { productionLogs } = useProduction();
  const { inspections, schedules } = useInspection();
  const { expenses } = useExpenses();
  const { claims: warrantyClaims } = useWarranty();
  const { transactions: invTxns } = useInventory();

  const [companyFilter, setCompanyFilter] = React.useState('All');
  const [inspectionYear, setInspectionYear] = React.useState(new Date().getFullYear().toString());

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

  // 4. Expense Burn Rate Data (Last 14 Days)
  const expenseChartData = useMemo(() => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayExps = expenses.filter(e => e.date === dateStr && e.status === 'Approved');
      const totalAmt = dayExps.reduce((sum, e) => sum + Number(e.amount), 0);
      
      data.push({
        name: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        Amount: totalAmt
      });
    }
    return data;
  }, [expenses]);

  // 5. Warranty Claims Status (Pie Chart)
  const warrantyPieData = useMemo(() => {
    let pending = 0, resolved = 0, rejected = 0;
    warrantyClaims.forEach(c => {
      if (companyFilter !== 'All' && c.client !== companyFilter) return;
      if (c.status === 'Pending') pending++;
      else if (c.status === 'Resolved' || c.status === 'Replaced' || c.status === 'Repaired') resolved++;
      else if (c.status === 'Rejected') rejected++;
    });
    return [
      { name: 'Pending', value: pending, color: 'var(--warning)' },
      { name: 'Resolved', value: resolved, color: 'var(--success)' },
      { name: 'Rejected', value: rejected, color: 'var(--danger)' }
    ].filter(d => d.value > 0);
  }, [warrantyClaims, companyFilter]);

  // 6. Inventory Health (Global Stock)
  const inventoryChartData = useMemo(() => {
    // Group by item name
    const stockMap = {};
    invTxns.forEach(t => {
      if (!stockMap[t.item]) stockMap[t.item] = 0;
      if (t.type === 'IN') stockMap[t.item] += t.qty;
      else stockMap[t.item] -= t.qty;
    });
    // Convert to array and sort by stock descending (take top 5)
    return Object.entries(stockMap)
      .map(([name, stock]) => ({ name, Stock: stock }))
      .sort((a, b) => b.Stock - a.Stock)
      .slice(0, 5);
  }, [invTxns]);

  // 7. Inspection Trends (Monthly)
  const availableYears = useMemo(() => {
    const years = new Set(inspections.map(i => i.startDate ? i.startDate.substring(0, 4) : '').filter(Boolean));
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [inspections]);

  const inspectionChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, Offered: 0, Accepted: 0, breakdown: {} }));

    inspections.forEach(i => {
      if (companyFilter !== 'All' && !validPONos.has(i.poNo)) return;
      if (i.type !== 'Final') return;
      if (!i.startDate || !i.startDate.startsWith(inspectionYear)) return;
      
      const monthIdx = parseInt(i.startDate.substring(5, 7), 10) - 1;
      if (monthIdx >= 0 && monthIdx <= 11) {
        const off = Number(i.qtyOffered) || 0;
        const acc = Number(i.qtyAccepted) || 0;
        data[monthIdx].Offered += off;
        data[monthIdx].Accepted += acc;
        
        const poObj = pos.find(p => p.poNo === i.poNo);
        if (poObj) {
          let cap = poObj.capacity || 'Unknown';
          cap = cap.replace('(Single Phase)', '(SP)');
          
          let comp = '';
          if (poObj.companyName === 'J.M. Electricals') comp = 'JM';
          else if (poObj.companyName === 'J.R. Transformers') comp = 'JRTPL';
          else comp = poObj.companyName;
          
          const label = `${cap} | ${comp}`;

          if (!data[monthIdx].breakdown[label]) {
            data[monthIdx].breakdown[label] = { offered: 0, accepted: 0 };
          }
          data[monthIdx].breakdown[label].offered += off;
          data[monthIdx].breakdown[label].accepted += acc;
        }
      }
    });
    
    return data;
  }, [inspections, inspectionYear, companyFilter, validPONos, pos]);

  const CustomInspectionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.Offered === 0 && data.Accepted === 0) return null;
      
      return (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', padding: '1rem', minWidth: '220px' }}>
          <p style={{ margin: '0 0 0.8rem 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>{label}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {Object.entries(data.breakdown).map(([label, counts]) => {
              const [cap, comp] = label.split(' | ');
              return (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '1.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.9rem' }}>{cap}</span>
                  {comp && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '8px', fontWeight: 'normal', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{comp}</span>}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {counts.accepted}
                </span>
              </div>
              );
            })}
          </div>
          
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--success)' }}>Total Accepted:</span>
              <span>{data.Accepted}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
            {companies?.map(c => {
              let display = c;
              if (c === 'J.M. Electricals') display = 'JM';
              if (c === 'J.R. Transformers') display = 'JRTPL';
              return <option key={c} value={c}>{display}</option>;
            })}
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
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Pending Dispatch</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>{(totalOrdered - totalDispatched).toLocaleString()}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Units Remaining</div>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--warning)' }}>
              <Clock size={24} />
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
      
      {/* SECOND ROW OF CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Expense Burn Rate */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--danger)" />
            14-Day Expense Burn Rate
          </h2>
          <div style={{ flex: 1, minHeight: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={expenseChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="Amount" stroke="var(--danger)" fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warranty Claims Pie */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="var(--warning)" />
            Warranty Status
          </h2>
          <div style={{ flex: 1, minHeight: '250px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {warrantyPieData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No warranty claims found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={warrantyPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {warrantyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Inventory */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--success)" />
            Top Inventory Stock
          </h2>
          <div style={{ flex: 1, minHeight: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="Stock" fill="var(--success)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
      {/* THIRD ROW OF CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Inspection Trends */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="var(--accent-primary)" />
              Inspection Trends (Monthly)
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Year:</span>
              <select value={inspectionYear} onChange={(e) => setInspectionYear(e.target.value)} className="input-field" style={{ marginBottom: 0, minWidth: '100px' }}>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={<CustomInspectionTooltip />}
                  cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Accepted" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
