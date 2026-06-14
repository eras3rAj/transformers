import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, Layers, Factory, Users, LogOut, Zap, Shield, ClipboardList, TrendingUp, UserCog, FileText, ClipboardCheck, ShoppingCart, ListTodo, Briefcase, Percent, Target, Bell, Moon, Sun, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Layout.css';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { currentUser, logout } = useAuth();
  const { unreadCount, notifications, markAllAsRead, markAsRead } = useNotifications();
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({ Overview: true });

  useEffect(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setIsDarkMode(true);
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', adminOk: true, normalOk: true, section: 'Overview' },
    { name: 'Project Management', icon: <ListTodo size={20} />, path: '/projects', adminOk: true, normalOk: true, section: 'Overview' },
    { name: 'Manufacturing Hub', icon: <Factory size={20} />, path: '/manufacturing', adminOk: true, normalOk: true, section: 'Manufacturing' },
    { name: 'Inventory Stores', icon: <PackageSearch size={20} />, path: '/inventory', adminOk: true, normalOk: true, section: 'Manufacturing' },
    { name: 'Daily Operations', icon: <FileText size={20} />, path: '/operations', adminOk: true, normalOk: true, section: 'Manufacturing' },
    { name: 'Financial Hub', icon: <TrendingUp size={20} />, path: '/finance', adminOk: true, normalOk: true, section: 'Financial' },
    { name: 'HR Management', icon: <Users size={20} />, path: '/hr', adminOk: true, normalOk: true, section: 'System' },
    { name: 'Audit Logs', icon: <ClipboardList size={20} />, path: '/logs', adminOk: false, normalOk: false, section: 'System' },
    { name: 'User Management', icon: <UserCog size={20} />, path: '/users', adminOk: false, normalOk: false, section: 'System' },
  ];

  const visibleNavItems = React.useMemo(() => navItems.filter(item => {
    if (currentUser?.role === 'superadmin') return true;
    
    const hubMap = {
      '/': ['dashboard'],
      '/hr': ['employees', 'payroll'],
      '/projects': ['pending-tasks', 'milestones'],
      '/manufacturing': ['production', 'inspections', 'warranty', 'bom'],
      '/inventory': ['inventory'],
      '/operations': ['daily-reports', 'expenses', 'eod-summary'],
      '/finance': ['purchase-orders', 'vendor-purchasing', 'price-variation', 'bg-lc', 'custom-duty'],
    };
    
    const requiredModules = hubMap[item.path] || [];
    
    // Always show Dashboard if no modules are strictly mapped (or if we want it global)
    if (item.path === '/') return true;
    
    // If the user has ANY of the required modules for this hub, show the hub
    if (currentUser?.modules && requiredModules.some(mod => currentUser.modules.includes(mod))) {
      return true;
    }
    
    // Fallback to legacy role checks if modules aren't populated yet
    if (currentUser?.modules === undefined) {
      if (currentUser?.role === 'admin') return item.adminOk;
      if (currentUser?.role === 'normal') return item.normalOk;
    }
    
    return false;
  }), [currentUser]);

  const sectionsWithItems = React.useMemo(() => {
    const sections = ['Overview', 'Manufacturing', 'Financial', 'System'];
    return sections.map(secName => ({
      name: secName,
      items: visibleNavItems.filter(item => item.section === secName)
    })).filter(sec => sec.items.length > 0);
  }, [visibleNavItems]);

  useEffect(() => {
    // Automatically expand the section that contains the current active route
    const activeSection = sectionsWithItems.find(sec => sec.items.some(i => i.path === location.pathname));
    if (activeSection) {
      setExpandedSections(prev => {
        if (prev[activeSection.name]) return prev;
        return { ...prev, [activeSection.name]: true };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleSection = (secName) => {
    setExpandedSections(prev => ({ ...prev, [secName]: !prev[secName] }));
  };

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Zap className="logo-icon" size={28} />
          <h2>VoltForge</h2>
        </div>
        <p className="subtitle">Manufacturing ERP</p>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto' }}>
        {sectionsWithItems.map((sec) => (
          <div key={sec.name} className="sidebar-section" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 
              className="section-title" 
              onClick={() => toggleSection(sec.name)}
              style={{ 
                fontSize: '0.7rem', 
                fontWeight: '700', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                marginBottom: '0.5rem', 
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{sec.name}</span>
              {expandedSections[sec.name] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </h3>
            {expandedSections[sec.name] && (
              <div className="section-items" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sec.items.map((item) => (
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
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto', position: 'relative' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', marginBottom: '1rem' }}>
          {currentUser && (
            <NavLink 
              to="/profile" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', color: 'inherit', borderRadius: '8px', flex: 1 }} 
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

          <button onClick={() => setShowNotifPopup(!showNotifPopup)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--text-muted)' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'var(--danger)', color: 'white', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '10px', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0 1rem' }}>
          <button onClick={toggleTheme} className="nav-item" style={{ flex: 1, background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'center', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span style={{ fontSize: '0.85rem' }}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {showNotifPopup && (
          <div style={{ position: 'absolute', bottom: '100%', left: '1rem', right: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '400px' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
              <h4 style={{ margin: 0 }}>Notifications</h4>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>Mark all as read</button>
              )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => { markAsRead(n.id); if(n.link_url) window.location.href = n.link_url; }} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)', transition: 'background 0.2s' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
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
