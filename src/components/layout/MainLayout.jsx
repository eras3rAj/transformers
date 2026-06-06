import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from '../common/AIAssistant';
import './Layout.css';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Don't show sidebar and header on the login page
  if (isLoginPage) {
    return (
      <div className="app-container">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      {isMobileMenuOpen && (
        <div className="mobile-overlay show" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <div className="main-content">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
      <AIAssistant />
    </div>
  );
};

export default MainLayout;
