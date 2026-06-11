with open('src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("import { calculateInventoryInsights } from '../utils/predictiveAnalytics';", "import { calculateInventoryInsights, getPredictiveMaintenanceAlerts } from '../utils/predictiveAnalytics';")
c = c.replace("import { useInventory } from '../context/InventoryContext';", "import { useInventory } from '../context/InventoryContext';\nimport { useDailyReport } from '../context/DailyReportContext';")

c = c.replace("  const { getGlobalStock, transactions, items } = useInventory();", "  const { getGlobalStock, transactions, items } = useInventory();\n  const { reports } = useDailyReport();")

c = c.replace("  const inventoryInsights = useMemo(() => calculateInventoryInsights(transactions, items, getGlobalStock), [transactions, items, getGlobalStock]);", "  const inventoryInsights = useMemo(() => calculateInventoryInsights(transactions, items, getGlobalStock), [transactions, items, getGlobalStock]);\n  const maintenanceAlerts = useMemo(() => getPredictiveMaintenanceAlerts(reports || []), [reports]);")


widget_block = """
        {hasModule('daily_reports') && maintenanceAlerts.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
              <AlertCircle size={20} color="var(--warning)" />
              Predictive Maintenance Alerts
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {maintenanceAlerts.map(alert => (
                <div key={alert.machine} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{alert.machine}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Downtime: <span style={{ color: alert.urgency === 'high' ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold' }}>{alert.totalDowntimeMinutes} mins</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', display: 'inline-block' }}>
                    {alert.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
"""

c = c.replace("        {/* Alerts Section */}", "        {/* Alerts Section */}" + widget_block)

with open('src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Modified Dashboard.jsx')
