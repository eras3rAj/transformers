import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Employees from './Employees';
import Payroll from './Payroll';
import '../components/layout/Layout.css';

const HRHub = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const allTabs = [
    { id: 'employees', label: 'Employee Directory', component: <Employees /> },
    { id: 'payroll', label: 'Payroll Management', component: <Payroll /> }
  ];

  // Filter tabs based on user permissions
  const availableTabs = allTabs.filter(tab => {
    if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') return true;
    if (currentUser?.modules && currentUser.modules.includes(tab.id)) return true;
    return false;
  });

  const hashTab = location.hash.replace('#', '');
  const defaultTab = availableTabs.some(t => t.id === hashTab) ? hashTab : (availableTabs[0]?.id || '');
  
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (hashTab && availableTabs.some(t => t.id === hashTab)) {
      setActiveTab(hashTab);
    }
  }, [hashTab, availableTabs]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/hr#${tabId}`, { replace: true });
  };

  if (availableTabs.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission to view any modules in this hub.</div>;
  }

  const activeComponent = availableTabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1>HR Management</h1>
          <p>Centralized view for personnel, attendance, and wages.</p>
        </div>
      </div>

      <div className="hub-tabs-container">
        {availableTabs.map(tab => (
          <button 
            key={tab.id}
            className={`hub-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hub-tab-content">
        {activeComponent}
      </div>
    </div>
  );
};

export default HRHub;
