import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import WarrantyManagement from './pages/WarrantyManagement';
import SystemLogs from './pages/SystemLogs';
import PriceVariation from './pages/PriceVariation';
import PurchaseOrders from './pages/PurchaseOrders';
import UserManagement from './pages/UserManagement';
import ProfileSettings from './pages/ProfileSettings';
import { LogProvider } from './context/LogContext';
import { POProvider } from './context/POContext';
import { PVProvider } from './context/PVContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WarrantyProvider } from './context/WarrantyContext';
import { ProductionProvider } from './context/ProductionContext';
import { InspectionProvider } from './context/InspectionContext';
import { InventoryProvider } from './context/InventoryContext';
import ProductionTracker from './pages/ProductionTracker';
import Inspections from './pages/Inspections';
import InventoryManagement from './pages/InventoryManagement';
import DailyExpenses from './pages/DailyExpenses';
import { ExpenseProvider } from './context/ExpenseContext';
import { Navigate } from 'react-router-dom';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireSuperAdmin }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && currentUser?.role !== 'superadmin') return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <UserProvider>
      <AuthProvider>
        <LogProvider>
          <POProvider>
            <PVProvider>
              <WarrantyProvider>
                <ProductionProvider>
                  <InspectionProvider>
                    <InventoryProvider>
                      <ExpenseProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="production" element={<ProductionTracker />} />
            <Route path="inspections" element={<Inspections />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="expenses" element={<DailyExpenses />} />
            <Route path="employees" element={<div>Employee Module (WIP)</div>} />
            <Route path="warranty" element={<WarrantyManagement />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="price-variation" element={<PriceVariation />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="users" element={<ProtectedRoute requireSuperAdmin={true}><UserManagement /></ProtectedRoute>} />
            <Route path="logs" element={<ProtectedRoute requireSuperAdmin={true}><SystemLogs /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
                      </ExpenseProvider>
                    </InventoryProvider>
                  </InspectionProvider>
                </ProductionProvider>
              </WarrantyProvider>
            </PVProvider>
          </POProvider>
        </LogProvider>
      </AuthProvider>
    </UserProvider>
  );
}

export default App;
