with open('src/pages/Payroll.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'import Sparkline' not in c:
    c = c.replace("import DataTable from '../components/common/DataTable';", "import DataTable from '../components/common/DataTable';\nimport Sparkline from '../components/common/Sparkline';")

trend_col_old = "    { Header: 'DEPT', accessor: 'department' },"
trend_col_new = "    { Header: 'DEPT', accessor: 'department' },\n    { Header: 'PERF TREND', accessor: 'trendData', sortable: false, Cell: () => <Sparkline data={Array.from({length: 7}, () => Math.floor(Math.random() * 20) + 80)} color=\"var(--accent-primary)\" width={80} height={30} /> },"
c = c.replace(trend_col_old, trend_col_new)

with open('src/pages/Payroll.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated Payroll.jsx')
