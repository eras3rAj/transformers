with open('src/components/layout/MainLayout.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add Menu import from lucide-react
c = c.replace("import { Menu } from 'lucide-react';", "") # Remove if exists
c = c.replace("import { ChevronLeft, ChevronRight,", "import { ChevronLeft, ChevronRight, Menu,")

# Add state
c = c.replace("  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);", "  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);\n  const [isMobileOpen, setIsMobileOpen] = useState(false);")

# Add mobile toggle to header
header_start = """      <main className="main-content">
        <header className="top-header">"""
header_replace = """      <main className="main-content">
        <header className="top-header">
          <button className="mobile-header-toggle" onClick={() => setIsMobileOpen(true)}>
            <Menu size={24} />
          </button>"""
c = c.replace(header_start, header_replace)

# Modify sidebar classes
sidebar_start = """      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>"""
sidebar_replace = """      <div className={`mobile-overlay ${isMobileOpen ? 'open' : ''}`} onClick={() => setIsMobileOpen(false)}></div>
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>"""
c = c.replace(sidebar_start, sidebar_replace)

# Add glass-panel to command palette
c = c.replace('className="command-palette-container"', 'className="command-palette-container glass-panel"')

# Close sidebar on nav click
nav_link = 'onClick={() => setShowCommandPalette(false)}'
nav_replace = 'onClick={() => { setShowCommandPalette(false); setIsMobileOpen(false); }}'
c = c.replace(nav_link, nav_replace)

with open('src/components/layout/MainLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated MainLayout.jsx')
