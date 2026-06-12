import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, PackageSearch, Factory, Users, Shield, ClipboardList, TrendingUp, UserCog, FileText, ClipboardCheck, ShoppingCart, ListTodo, Briefcase, Percent, Target } from 'lucide-react';
import './CommandPalette.css';

const COMMANDS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Purchase Orders', icon: FileText, path: '/purchase-orders' },
  { name: 'Production', icon: Factory, path: '/production' },
  { name: 'Daily Reports', icon: FileText, path: '/daily-reports' },
  { name: 'Inspections', icon: ClipboardCheck, path: '/inspections' },
  { name: 'Inventory Stores', icon: PackageSearch, path: '/inventory' },
  { name: 'Price Variation', icon: TrendingUp, path: '/price-variation' },
  { name: 'Warranty claims', icon: Shield, path: '/warranty' },
  { name: 'Employees', icon: Users, path: '/employees' },
  { name: 'Vendor Purchasing', icon: ShoppingCart, path: '/vendor-purchasing' },
  { name: 'Pending Tasks', icon: ListTodo, path: '/pending-tasks' },
  { name: 'Milestones', icon: Target, path: '/milestones' },
  { name: 'Daily Expenses', icon: FileText, path: '/expenses' },
  { name: 'Daily Summary', icon: FileText, path: '/eod-summary' },
  { name: 'Bank Guarantee & LC', icon: Briefcase, path: '/bg-lc' },
  { name: 'Custom Duty', icon: Percent, path: '/custom-duty' },
  { name: 'Audit Logs', icon: ClipboardList, path: '/logs' },
  { name: 'User Management', icon: UserCog, path: '/users' },
  { name: 'Profile Settings', icon: UserCog, path: '/profile' }
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex].path);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
        <div className="command-palette-header">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            className="command-palette-input"
            placeholder="Search commands or navigate..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="esc-hint">ESC</div>
        </div>
        <div className="command-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">No results found</div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.name}
                  className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelect(cmd.path)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Icon size={18} className="item-icon" />
                  <span>{cmd.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
