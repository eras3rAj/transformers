with open('src/App.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('const UserManagement = React.lazy(() => import(\'./pages/UserManagement\'));', 'const UserManagement = React.lazy(() => import(\'./pages/UserManagement\'));\nconst Payroll = React.lazy(() => import(\'./pages/Payroll\'));')

c = c.replace('<Route path="/employees" element={<Employees />} />', '<Route path="/employees" element={<Employees />} />\n              <Route path="/payroll" element={<Payroll />} />')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

with open('src/components/layout/MainLayout.jsx', 'r', encoding='utf-8') as f:
    m = f.read()

m = m.replace('Users, CalendarCheck', 'Users, CalendarCheck, Banknote')

target_nav = """    title: 'Workforce',
    items: [
      { title: 'Employees', path: '/employees', icon: <Users size={20} /> }
    ]
  },"""
replace_nav = """    title: 'Workforce',
    items: [
      { title: 'Employees', path: '/employees', icon: <Users size={20} /> },
      { title: 'Payroll', path: '/payroll', icon: <Banknote size={20} /> }
    ]
  },"""

m = m.replace(target_nav, replace_nav)

with open('src/components/layout/MainLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(m)

print("Modified both files.")
