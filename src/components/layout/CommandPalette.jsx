import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Users, ListTodo, Factory, PackageSearch, FileText, TrendingUp, ClipboardList, UserCog, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CommandPalette.css';

const ALL_ROUTES = [
  { name: 'Dashboard', path: '/', keywords: 'home overview main', icon: <LayoutDashboard size={18} /> },
  { name: 'HR Management', path: '/hr', keywords: 'human resources staff', icon: <Users size={18} /> },
  { name: 'Employees (HR)', path: '/hr#employees', keywords: 'staff workers hr', icon: <Users size={18} /> },
  { name: 'Payroll (HR)', path: '/hr#payroll', keywords: 'salary wages hr', icon: <Users size={18} /> },
  { name: 'Project Management', path: '/projects', keywords: 'tasks milestones', icon: <ListTodo size={18} /> },
  { name: 'Pending Tasks', path: '/projects#pending-tasks', keywords: 'todo kanban board projects', icon: <ListTodo size={18} /> },
  { name: 'Milestones', path: '/projects#milestones', keywords: 'goals timeline projects', icon: <ListTodo size={18} /> },
  { name: 'Manufacturing Hub', path: '/manufacturing', keywords: 'factory production', icon: <Factory size={18} /> },
  { name: 'Production Tracker', path: '/manufacturing#production', keywords: 'factory manufacturing output', icon: <Factory size={18} /> },
  { name: 'Inspections & Quality', path: '/manufacturing#inspections', keywords: 'quality control testing', icon: <Factory size={18} /> },
  { name: 'Warranty Claims', path: '/manufacturing#warranty', keywords: 'repairs damages defects', icon: <Factory size={18} /> },
  { name: 'BOM Config', path: '/manufacturing#bom', keywords: 'bill of materials recipe', icon: <Factory size={18} /> },
  { name: 'Inventory Stores', path: '/inventory', keywords: 'stock materials warehouse', icon: <PackageSearch size={18} /> },
  { name: 'Daily Operations', path: '/operations', keywords: 'reports expenses dispatch', icon: <FileText size={18} /> },
  { name: 'Daily Reports', path: '/operations#daily-reports', keywords: 'forms winders operators', icon: <FileText size={18} /> },
  { name: 'Daily Expenses', path: '/operations#expenses', keywords: 'costs petty cash', icon: <FileText size={18} /> },
  { name: 'EOD Summary', path: '/operations#eod-summary', keywords: 'end of day report', icon: <FileText size={18} /> },
  { name: 'Dispatch & Loading', path: '/operations#dispatch', keywords: 'shipping trucks transport', icon: <FileText size={18} /> },
  { name: 'Financial Hub', path: '/finance', keywords: 'money procurement', icon: <TrendingUp size={18} /> },
  { name: 'Purchase Orders', path: '/finance#purchase-orders', keywords: 'po procurement financials', icon: <TrendingUp size={18} /> },
  { name: 'Vendor Purchasing', path: '/finance#vendor-purchasing', keywords: 'suppliers materials buying', icon: <TrendingUp size={18} /> },
  { name: 'Price Variation', path: '/finance#price-variation', keywords: 'pv formula ieema', icon: <TrendingUp size={18} /> },
  { name: 'Bank Guarantee & LC', path: '/finance#bg-lc', keywords: 'bg letter of credit', icon: <TrendingUp size={18} /> },
  { name: 'Custom Duty', path: '/finance#custom-duty', keywords: 'taxes import', icon: <TrendingUp size={18} /> },
  { name: 'Profile Settings', path: '/settings', keywords: 'account password avatar', icon: <Settings size={18} /> },
  { name: 'Audit Logs', path: '/logs', keywords: 'history activity system', icon: <ClipboardList size={18} />, adminOnly: true },
  { name: 'User Management', path: '/users', keywords: 'admin roles system', icon: <UserCog size={18} />, adminOnly: true },
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredRoutes = React.useMemo(() => {
    return ALL_ROUTES.filter((route) => {
      // Permission check
      if (route.adminOnly && currentUser?.role !== 'superadmin') return false;
      
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return route.name.toLowerCase().includes(query) || route.keywords.includes(query);
    });
  }, [searchQuery, currentUser]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex + 1]; // +1 for header
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredRoutes.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredRoutes[selectedIndex]) {
        handleNavigate(filteredRoutes[selectedIndex].path);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={() => setIsOpen(false)}>
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <Search size={20} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, modules, or commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="command-search-input"
          />
          <div className="command-esc-hint">ESC</div>
        </div>

        <div className="command-palette-body">
          {filteredRoutes.length === 0 ? (
            <div className="command-no-results">No results found for "{searchQuery}"</div>
          ) : (
            <div className="command-list" ref={listRef}>
              <div className="command-list-header">Navigation</div>
              {filteredRoutes.map((route, idx) => (
                <div
                  key={route.path}
                  className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleNavigate(route.path)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-item-left">
                    <span className="command-item-icon">{route.icon}</span>
                    <span className="command-item-name">{route.name}</span>
                  </div>
                  <ChevronRight size={16} className="command-item-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="command-palette-footer">
          <div className="command-hint">
            <span className="key-cap">↑</span> <span className="key-cap">↓</span> to navigate
          </div>
          <div className="command-hint">
            <span className="key-cap">↵</span> to select
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
