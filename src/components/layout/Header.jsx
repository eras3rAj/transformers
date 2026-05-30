import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import './Layout.css';

const Header = ({ setIsMobileMenuOpen }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search orders, transformers, clients..." className="search-input" />
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
