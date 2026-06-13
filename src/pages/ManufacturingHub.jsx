import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductionTracker from './ProductionTracker';
import Inspections from './Inspections';
import WarrantyManagement from './WarrantyManagement';
import BOMManagement from './BOMManagement';
import '../components/layout/Layout.css';

const ManufacturingHub = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const allTabs = [
    { id: 'production', label: 'Production Tracker', component: <ProductionTracker /> },
    { id: 'inspections', label: 'Inspections & Quality', component: <Inspections /> },
    { id: 'warranty', label: 'Warranty Claims', component: <WarrantyManagement /> },
    { id: 'bom', label: 'BOM Config', component: <BOMManagement /> }
  ];

  // Filter tabs based on user permissions
  const availableTabs = allTabs.filter(tab => {
    if (currentUser?.role === 'superadmin') return true;
    if (currentUser?.modules !== undefined) {
      return currentUser.modules.includes(tab.id);
    }
    return true; // Legacy fallback for users without modules array
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
    navigate(`/manufacturing#${tabId}`, { replace: true });
  };

  if (availableTabs.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission to view any modules in this hub.</div>;
  }

  const activeComponent = availableTabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1>Manufacturing Hub</h1>
          <p>Centralized view for production stages, quality checks, and material recipes.</p>
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

export default ManufacturingHub;
