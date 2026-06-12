import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import DailyReports from './DailyReports';
import DailyExpenses from './DailyExpenses';
import EodSummary from './EodSummary';
import '../components/layout/Layout.css';

const OperationsHub = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const allTabs = [
    { id: 'daily-reports', label: 'Daily Reports', component: <DailyReports /> },
    { id: 'expenses', label: 'Daily Expenses', component: <DailyExpenses /> },
    { id: 'eod-summary', label: 'EOD Summary', component: <EodSummary /> }
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
    navigate(`/operations#${tabId}`, { replace: true });
  };

  if (availableTabs.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission to view any modules in this hub.</div>;
  }

  const activeComponent = availableTabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1>Daily Operations</h1>
          <p>Centralized tracking for daily reports, expenses, and EOD summaries.</p>
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

export default OperationsHub;
