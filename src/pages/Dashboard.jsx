import { formatDate } from '../utils/dateUtils';
import React, { useMemo } from 'react';
import { Factory, AlertCircle, CheckCircle, Clock, Truck, TrendingUp, Package, FileText, Target, Building2 } from 'lucide-react';
import { usePO } from '../context/POContext';
import { usePV } from '../context/PVContext';
import { useProduction } from '../context/ProductionContext';
import { useInspection } from '../context/InspectionContext';
import { useExpenses } from '../context/ExpenseContext';
import { useWarranty } from '../context/WarrantyContext';
import { useInventory } from '../context/InventoryContext';
import { useMilestones } from '../context/MilestoneContext';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import '../components/layout/Layout.css';

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

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  const hasModule = (moduleId) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return currentUser.modules && currentUser.modules.includes(moduleId);
  };
  
  const hasAnyDashboardModule = 
    hasModule('purchase-orders') || 
    hasModule('inspections') || 
    hasModule('price-variation') || 
    hasModule('production') || 
    hasModule('inventory') || 
    hasModule('expenses') || 
    hasModule('milestones');
  const { pos, companies } = usePO();
  const { claims = [] } = usePV();
  const { productionLogs } = useProduction();
  const { inspections, schedules } = useInspection();
  const { expenses } = useExpenses();
  const { claims: warrantyClaims } = useWarranty();
  const { transactions: invTxns } = useInventory();
  const { milestones } = useMilestones();

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
      
      let boxUp = 0, cca = 0, ht = 0, lt = 0, tanks = 0;
      if (log && log.batches) {
        log.batches.forEach(b => {
          // If we have a company filter, only count batches for POs belonging to that company
          if (companyFilter !== 'All' && !validPONos.has(b.poNo)) return;
          
          if (b.component === 'Box Up') boxUp += b.quantity;
          if (b.component === 'CCA') cca += b.quantity;
          if (b.component === 'HT Winding') ht += b.quantity;
          if (b.component === 'LT Winding') lt += b.quantity;
          if (b.component === 'Tanks Fabricated') tanks += b.quantity;
        });
      }
      
      data.push({
        name: formatDate(d),
        'Box Up': boxUp,
        'CCA': cca,
        'HT Winding': ht,
        'LT Winding': lt,
        'Tanks Fabricated': tanks
      });
    }
    return data;
  }, [productionLogs]);

  const todaysBoxUps = chartData[6]['Box Up'];
  const todaysTanks = chartData[6]['Tanks Fabricated'];

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
        name: formatDate(d),
        Amount: totalAmt
      });
    }
    return data;
  }, [expenses]);

  // 5. Warranty Claims Status (Pie Chart)
  const warrantyPieData = useMemo(() => {
    let pendingAction = 0, inProgress = 0, resolved = 0;
    
    warrantyClaims.forEach(c => {
      if (c.isHidden || c.status === 'Deleted' || c.status === 'Pending Deletion') return;
      
      const poObj = pos.find(p => p.poNo === c.poNo);
      const claimCompany = poObj ? poObj.companyName : 'Unknown';
      if (companyFilter !== 'All' && claimCompany !== companyFilter) return;

      if (['To be lifted from store', 'Pending Return', 'Inspected'].includes(c.status)) {
        pendingAction++;
      } else if (c.status === 'Under Repair') {
        inProgress++;
      } else if (c.status === 'Resolved') {
        resolved++;
      }
    });

    return [
      { name: 'Pending Action', value: pendingAction, color: 'var(--danger)' },
      { name: 'Under Repair', value: inProgress, color: 'var(--warning)' },
      { name: 'Resolved', value: resolved, color: 'var(--success)' }
    ].filter(d => d.value > 0);
  }, [warrantyClaims, companyFilter, pos]);

  // 6. Critical Inventory Burn (Top 5 Shortages)
  const { items: invItems = [] } = useInventory();
  
  const inventoryChartData = useMemo(() => {
    const stockMap = {};
    invTxns.forEach(t => {
      if (!stockMap[t.item]) stockMap[t.item] = 0;
      if (t.type === 'IN') stockMap[t.item] += t.qty;
      else stockMap[t.item] -= t.qty;
    });
    
    // Calculate shortage against minStockLevels (assuming category 'Raw Material' as default or taking max minStock)
    const shortageData = invItems.map(item => {
      const currentStock = stockMap[item.name] || 0;
      let minStock = 0;
      if (item.minStockLevels) {
        minStock = Math.max(...Object.values(item.minStockLevels).map(Number));
      }
      return {
        name: item.name,
        Stock: currentStock,
        Shortage: Math.max(0, minStock - currentStock)
      };
    });
    
    return shortageData
      .filter(d => d.Shortage > 0 || d.Stock < 50) // Items with shortage or very low stock
      .sort((a, b) => b.Shortage - a.Shortage || a.Stock - b.Stock) // Prioritize highest shortage
      .slice(0, 5)
      .map(d => ({ name: d.name, Stock: d.Stock })); // Return format expected by chart
  }, [invTxns, invItems]);

  // 8. Milestones
  const upcomingMilestones = useMemo(() => {
    return milestones
      .filter(m => m.status === 'Pending')
      .filter(m => companyFilter === 'All' || m.company === 'All' || m.company === companyFilter)
      .slice(0, 5); // Limit to top 5
  }, [milestones, companyFilter]);

  // 9. Inspection Trends (Monthly)
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
          
          let comp;
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

      {/* Empty State */}
      {!hasAnyDashboardModule && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px dashed var(--border-color)', marginTop: '2rem' }}>
          <AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Welcome to VoltForge</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You do not have access to any dashboard widgets. Please navigate using the sidebar menu or contact your administrator to request additional module access.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {(hasModule('purchase-orders') || hasModule('inspections')) && (
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
        )}

        {hasModule('inspections') && (
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
        )}

        {(hasModule('purchase-orders') || hasModule('inspections')) && (
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
        )}

        {hasModule('production') && (
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
        )}

        {hasModule('production') && (
          <div className="card stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Today's Fabrication</h3>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{todaysTanks}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Tanks Fabricated</div>
              </div>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                <Factory size={24} />
              </div>
            </div>
          </div>
        )}

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Production Velocity Chart */}
        {hasModule('production') && (
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
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Box Up" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CCA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="HT Winding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="LT Winding" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tanks Fabricated" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Upcoming Schedules */}
        {(hasModule('purchase-orders') || hasModule('inspections')) && (
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
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(sched.date)}</p>
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
        )}

        {/* Milestones */}
        {hasModule('milestones') && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--success)" />
            Active Milestones
          </h2>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingMilestones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No active milestones.
              </div>
            ) : (
              upcomingMilestones.map(m => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: `4px solid ${m.term_type === 'Long Term' ? 'var(--accent-primary)' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.title}</h4>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{m.term_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={12} /> {m.company}</span>
                    {m.target_date && <span>Target: {formatDate(m.target_date)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

      </div>
      
      {/* SECOND ROW OF CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Expense Burn Rate */}
        {hasModule('expenses') && (
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
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} wrapperStyle={{ zIndex: 1000 }} />
                <Area type="monotone" dataKey="Amount" stroke="var(--danger)" fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Warranty Claims Pie */}
        {hasModule('warranty') && (
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
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} wrapperStyle={{ zIndex: 1000 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

        {/* Top Inventory */}
        {hasModule('inventory') && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--danger)" />
            Critical Inventory Shortages
          </h2>
          <div style={{ flex: 1, minHeight: '250px', width: '100%' }}>
            {inventoryChartData.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>No inventory shortages detected.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} wrapperStyle={{ zIndex: 1000 }} />
                  <Bar dataKey="Stock" fill="var(--warning)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

      </div>
      
      {/* THIRD ROW OF CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Inspection Trends */}
        {hasModule('inspections') && (
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
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Accepted" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
