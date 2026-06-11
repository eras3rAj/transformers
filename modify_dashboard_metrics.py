with open('src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'import DynamicMetric' not in c:
    c = c.replace("import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';", "import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';\nimport DynamicMetric from '../components/common/DynamicMetric';")

# Replace "₹{totalMonthlyExpenses.toLocaleString()}" with <DynamicMetric value={totalMonthlyExpenses} format="currency" previousValue={totalMonthlyExpenses * 0.9} inverse={true} />

expense_old = """            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              ₹{totalMonthlyExpenses.toLocaleString()}
            </h2>"""
expense_new = """            <div style={{ margin: '0 0 0.5rem 0' }}>
              <DynamicMetric value={totalMonthlyExpenses} format="currency" previousValue={totalMonthlyExpenses * 0.9} inverse={true} size="large" />
            </div>"""

c = c.replace(expense_old, expense_new)

# Replace Warranty Active Claims
claims_old = """            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              {activeClaims}
            </h2>"""
claims_new = """            <div style={{ margin: '0 0 0.5rem 0' }}>
              <DynamicMetric value={activeClaims} previousValue={activeClaims + 2} inverse={true} size="large" />
            </div>"""
c = c.replace(claims_old, claims_new)

# Replace Production total output
prod_old = """            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              {totalOutput} MT
            </h2>"""
prod_new = """            <div style={{ margin: '0 0 0.5rem 0' }}>
              <DynamicMetric value={totalOutput} suffix=" MT" previousValue={totalOutput * 0.85} size="large" />
            </div>"""
c = c.replace(prod_old, prod_new)

# Add Glass-panel to cards
# c = c.replace('className="card"', 'className="card glass-panel"')

with open('src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated Dashboard.jsx')
