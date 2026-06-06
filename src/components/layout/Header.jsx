import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, Menu, Settings, LogOut, FileText } from 'lucide-react';
import './Layout.css';

const Header = ({ setIsMobileMenuOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchActive(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New order #1024 received', time: '5m ago', unread: true },
    { id: 2, text: 'Transformer T-500 KVA completed', time: '1h ago', unread: true },
    { id: 3, text: 'Low stock: Copper Wire 2mm', time: '2h ago', unread: true }
  ]);

  const markAllRead = () => setNotifications(notifications.map(n => ({...n, unread: false})));
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="search-container" ref={searchRef} style={{ position: 'relative' }}>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search orders, transformers, clients..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
            />
          </div>
          {isSearchActive && searchQuery.trim().length > 0 && (
            <div className="header-dropdown animate-fade-in" style={{ left: 0, width: '100%', top: '100%', marginTop: '0.5rem' }}>
              <div className="dropdown-header">Search Results</div>
              <div className="dropdown-body">
                <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
                  Press Enter to search for "{searchQuery}" across all modules.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="header-right">
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          
          {isNotificationsOpen && (
            <div className="header-dropdown animate-fade-in">
              <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                {unreadCount > 0 && <button className="btn-text" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={markAllRead}>Mark all read</button>}
              </div>
              <div className="dropdown-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border-color)', background: n.unread ? 'rgba(59, 130, 246, 0.05)' : 'transparent', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--accent-primary)', marginTop: '2px' }}><Bell size={14} /></div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: n.unread ? '500' : '400' }}>{n.text}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer" style={{ padding: '0.8rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                <a href="#" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>View all notifications</a>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div className="user-profile" onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}>
            <div className="avatar">
              <User size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">Admin User</span>
            </div>
          </div>
          
          {isProfileOpen && (
            <div className="header-dropdown animate-fade-in">
              <div className="dropdown-header">
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Admin User</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>admin@voltforge.com</div>
              </div>
              <div className="dropdown-body" style={{ padding: '0.5rem 0' }}>
                <button className="dropdown-item">
                  <User size={16} /> My Profile
                </button>
                <button className="dropdown-item">
                  <Settings size={16} /> Preferences
                </button>
                <button className="dropdown-item">
                  <FileText size={16} /> Activity Log
                </button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                <button className="dropdown-item text-danger" style={{ color: 'var(--danger)' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
