import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import PurchaseOrders from './PurchaseOrders';
import VendorPurchasing from './VendorPurchasing';
import PriceVariation from './PriceVariation';
import CustomDuty from './CustomDuty';
import BankGuaranteeLC from './BankGuaranteeLC';
import '../components/layout/Layout.css';

const FinanceHub = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const allTabs = [
    { id: 'purchase-orders', label: 'Purchase Orders', component: <PurchaseOrders /> },
    { id: 'vendor-purchasing', label: 'Vendor Purchasing', component: <VendorPurchasing /> },
    { id: 'price-variation', label: 'Price Variation', component: <PriceVariation /> },
    { id: 'bg-lc', label: 'Bank Guarantee & LC', component: <BankGuaranteeLC /> },
    { id: 'custom-duty', label: 'Custom Duty', component: <CustomDuty /> }
  ];

  // Filter tabs based on user permissions
  const availableTabs = allTabs.filter(tab => {
    if (currentUser?.role === 'superadmin') return true;
    if (currentUser?.modules !== undefined) {
      return currentUser.modules.includes(tab.id);
    }
    return true; // Legacy fallback for users without modules array
  });

  // Extract hash from URL to set active tab, or default to first available
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
    navigate(`/finance#${tabId}`, { replace: true });
  };

  if (availableTabs.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission to view any modules in this hub.</div>;
  }

  const activeComponent = availableTabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1>Financial Hub</h1>
          <p>Centralized management for procurement, pricing, and financial instruments.</p>
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

export default FinanceHub;
