import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, PackageSearch, Factory, Users, LogOut, Zap, Shield, ClipboardList, TrendingUp, UserCog, FileText, Activity, ClipboardCheck, ShoppingCart, ListTodo, Briefcase, Percent, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', adminOk: true, normalOk: true },
    { name: 'Purchase Orders', icon: <FileText size={20} />, path: '/purchase-orders', adminOk: true, normalOk: true },
    { name: 'Production', icon: <Factory size={20} />, path: '/production', adminOk: true, normalOk: true },
    { name: 'Inspections', icon: <ClipboardCheck size={20} />, path: '/inspections', adminOk: true, normalOk: true },
    { name: 'Inventory Stores', icon: <PackageSearch size={20} />, path: '/inventory', adminOk: true, normalOk: true },
    { name: 'Price Variation', icon: <TrendingUp size={20} />, path: '/price-variation', adminOk: true, normalOk: false },
    { name: 'Warranty claims', icon: <Shield size={20} />, path: '/warranty', adminOk: true, normalOk: true },
    { name: 'Employees', icon: <Users size={20} />, path: '/employees', adminOk: true, normalOk: true },
    { name: 'Vendor Purchasing', icon: <ShoppingCart size={20} />, path: '/vendor-purchasing', adminOk: true, normalOk: false },
    { name: 'Pending Tasks', icon: <ListTodo size={20} />, path: '/pending-tasks', adminOk: true, normalOk: true },
    { name: 'Milestones', icon: <Target size={20} />, path: '/milestones', adminOk: true, normalOk: true },
    { name: 'Daily Expenses', icon: <FileText size={20} />, path: '/expenses', adminOk: true, normalOk: true },
    { name: 'Daily Summary', icon: <FileText size={20} />, path: '/eod-summary', adminOk: true, normalOk: true },
    { name: 'Bank Guarantee & LC', icon: <Briefcase size={20} />, path: '/bg-lc', adminOk: true, normalOk: true },
    { name: 'Custom Duty', icon: <Percent size={20} />, path: '/custom-duty', adminOk: true, normalOk: true },
    { name: 'Audit Logs', icon: <ClipboardList size={20} />, path: '/logs', adminOk: false, normalOk: false },
    { name: 'User Management', icon: <UserCog size={20} />, path: '/users', adminOk: false, normalOk: false },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (currentUser?.role === 'superadmin') return true;
    
    // Check if the route is explicitly enabled via the user's modules array
    // We map the route path to the module id used in UserManagement
    const pathMap = {
      '/': 'dashboard',
      '/purchase-orders': 'purchase-orders',
      '/production': 'production',
      '/inspections': 'inspections',
      '/inventory': 'inventory',
      '/price-variation': 'price-variation',
      '/warranty': 'warranty',
      '/employees': 'employees',
      '/vendor-purchasing': 'vendor-purchasing',
      '/pending-tasks': 'pending-tasks',
      '/milestones': 'milestones',
      '/expenses': 'expenses',
      '/eod-summary': 'eod-summary',
      '/bg-lc': 'bg-lc',
      '/custom-duty': 'custom-duty'
    };
    
    const moduleId = pathMap[item.path];
    
    // Always show Dashboard if no modules are strictly mapped (or if we want it global)
    if (item.path === '/') return true;
    
    if (currentUser?.modules && currentUser.modules.includes(moduleId)) {
      return true;
    }
    
    // Fallback to legacy role checks if modules aren't populated yet
    if (!currentUser?.modules || currentUser.modules.length === 0) {
      if (currentUser?.role === 'admin') return item.adminOk;
      if (currentUser?.role === 'normal') return item.normalOk;
    }
    
    return false;
  });

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Zap className="logo-icon" size={28} />
          <h2>VoltForge</h2>
        </div>
        <p className="subtitle">Manufacturing ERP</p>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
        {currentUser && (
          <NavLink 
            to="/profile" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 1rem', marginBottom: '1rem', textDecoration: 'none', color: 'inherit', borderRadius: '8px' }} 
            className={({ isActive }) => isActive ? 'active-profile-link' : 'profile-link'}
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              {currentUser.name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.name || 'User'}</div>
            </div>
          </NavLink>
        )}
        
        <button onClick={logout} className="nav-item text-danger" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '1rem' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
