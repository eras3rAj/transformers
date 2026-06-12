import sys

with open('src/pages/InventoryManagement.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update AI Insights button in the tabs
content = content.replace("AI Insights", "Analytics & Flow")

# 2. Add the Filter Bar component string
filter_bar_component = """
  const renderAdvancedFilters = () => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          <Filter size={18} /> Filters:
        </div>
        
        <input 
          type="date" 
          value={flowFilters.startDate} 
          onChange={e => setFlowFilters({...flowFilters, startDate: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input 
          type="date" 
          value={flowFilters.endDate} 
          onChange={e => setFlowFilters({...flowFilters, endDate: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        />
        
        <select 
          value={flowFilters.type} 
          onChange={e => setFlowFilters({...flowFilters, type: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Directions</option>
          <option value="IN">Inward (IN)</option>
          <option value="OUT">Outward (OUT)</option>
        </select>
        
        <select 
          value={flowFilters.usageType} 
          onChange={e => setFlowFilters({...flowFilters, usageType: e.target.value})}
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Usage Types</option>
          <option value="INTERNAL">Internal Consumption</option>
          <option value="DISPATCH">Dispatch / Sale</option>
          <option value="LOSS">Loss / Damage</option>
        </select>
        
        <button 
          onClick={() => setFlowFilters({ startDate: '', endDate: '', type: 'ALL', usageType: 'ALL', entity: 'ALL' })}
          style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
    );
  };

  const renderAnalytics = () => {
    const { filteredTxns, topConsumers, topSuppliers, monthlyTrend } = processMaterialFlow(transactions, flowFilters);
    const insights = calculateInventoryInsights(transactions, items, getGlobalStock);
    
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {renderAdvancedFilters()}

        {/* Section 1: Top Line Metrics & Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card">
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingDown size={18} color="var(--danger)" /> Top Consumers (Value Rs.)</h4>
            {topConsumers.slice(0, 5).map(c => (
              <div key={c.name} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: '500' }}>{c.name}</span>
                  <span>Rs. {c.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((c.value / (topConsumers[0]?.value || 1)) * 100, 100)}%`, height: '100%', background: 'var(--danger)', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
            {topConsumers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No outward transaction data.</p>}
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} color="var(--success)" /> Top Suppliers (Value Rs.)</h4>
            {topSuppliers.slice(0, 5).map(c => (
              <div key={c.name} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: '500' }}>{c.name}</span>
                  <span>Rs. {c.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((c.value / (topSuppliers[0]?.value || 1)) * 100, 100)}%`, height: '100%', background: 'var(--success)', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
            {topSuppliers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No inward transaction data.</p>}
          </div>

        </div>

        {/* Section 2: Predictive Forecasting (Legacy) */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <LineChart size={24} color="var(--accent-primary)" />
            Predictive Inventory Forecasting
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Calculated using the last 30 days of consumption (Burn Rate) and current Global Stock.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {insights.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                Not enough data. Perform some inventory outgoing transactions to see AI forecasts.
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div key={idx} className="card" style={{ borderLeft: `4px solid ${insight.urgency === 'high' ? 'var(--danger)' : insight.urgency === 'medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{insight.itemName}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: insight.urgency === 'high' ? 'rgba(239,68,68,0.1)' : insight.urgency === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)', color: insight.urgency === 'high' ? 'var(--danger)' : insight.urgency === 'medium' ? 'var(--warning)' : 'var(--success)' }}>
                      {insight.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current Global Stock:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{insight.currentStock} {insight.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Est. Burn Rate:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{insight.burnRate} {insight.unit}/day</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Days Remaining:</span>
                      <span style={{ fontWeight: '600', color: insight.daysRemaining <= 7 ? 'var(--danger)' : 'var(--text-primary)' }}>{insight.daysRemaining} days</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };
"""

content = content.replace("const renderAIInsights = () => {", filter_bar_component + "\n  const renderAIInsightsOld = () => {")

# 3. Replace the call to renderAIInsights with renderAnalytics
content = content.replace("activeTab === 'Analytics & Flow' && renderAIInsights()", "activeTab === 'Analytics & Flow' && renderAnalytics()")

with open('src/pages/InventoryManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully")
