with open('src/App.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'import { BOMProvider }' not in c:
    c = c.replace("import { NotificationProvider } from './context/NotificationContext';", "import { NotificationProvider } from './context/NotificationContext';\nimport { BOMProvider } from './context/BOMContext';")
    c = c.replace("import AdminLogin from './pages/AdminLogin';", "import AdminLogin from './pages/AdminLogin';\nimport BOMManagement from './pages/BOMManagement';")
    
    # Wrap with BOMProvider
    c = c.replace("<NotificationProvider>", "<NotificationProvider>\n          <BOMProvider>")
    c = c.replace("</NotificationProvider>", "          </BOMProvider>\n        </NotificationProvider>")
    
    # Add Route
    c = c.replace("<Route path=\"/inventory\" element={<InventoryManagement />} />", "<Route path=\"/inventory\" element={<InventoryManagement />} />\n                <Route path=\"/bom\" element={<BOMManagement />} />")

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated App.jsx")
else:
    print("Already updated App.jsx")

with open('src/components/layout/Sidebar.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

if '/bom' not in c:
    # Add BOM link after Inventory
    inv_link = """        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PackageSearch size={20} />
          <span className="nav-label">Inventory</span>
        </NavLink>"""
    
    bom_link = """        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PackageSearch size={20} />
          <span className="nav-label">Inventory</span>
        </NavLink>
        <NavLink to="/bom" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Layers size={20} />
          <span className="nav-label">BOM Config</span>
        </NavLink>"""
    
    c = c.replace(inv_link, bom_link)
    
    # Check if Layers is imported from lucide-react
    if 'Layers' not in c.split('from \'lucide-react\'')[0]:
        c = c.replace("import { LayoutDashboard, PackageSearch,", "import { LayoutDashboard, PackageSearch, Layers,")

    with open('src/components/layout/Sidebar.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated Sidebar.jsx")
else:
    print("Already updated Sidebar.jsx")
