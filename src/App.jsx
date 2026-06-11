import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { LogProvider } from './context/LogContext';
import { POProvider } from './context/POContext';
import { PVProvider } from './context/PVContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WarrantyProvider } from './context/WarrantyContext';
import { ProductionProvider } from './context/ProductionContext';
import { InspectionProvider } from './context/InspectionContext';
import { InventoryProvider } from './context/InventoryContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { EmployeeProvider } from './context/EmployeeContext';
import { VendorProvider } from './context/VendorContext';
import { TaskProvider } from './context/TaskContext';
import { MilestoneProvider } from './context/MilestoneContext';
import { BgLcProvider } from './context/BgLcContext';
import { CustomDutyProvider } from './context/CustomDutyContext';
import { NotificationProvider } from './context/NotificationContext';
import { DailyReportProvider } from './context/DailyReportContext';
import { ToastProvider } from './context/ToastContext';

// Lazy loaded page components for Code Splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const WarrantyManagement = React.lazy(() => import('./pages/WarrantyManagement'));
const SystemLogs = React.lazy(() => import('./pages/SystemLogs'));
const PriceVariation = React.lazy(() => import('./pages/PriceVariation'));
const PurchaseOrders = React.lazy(() => import('./pages/PurchaseOrders'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const ProfileSettings = React.lazy(() => import('./pages/ProfileSettings'));
const ProductionTracker = React.lazy(() => import('./pages/ProductionTracker'));
const Inspections = React.lazy(() => import('./pages/Inspections'));
const InventoryManagement = React.lazy(() => import('./pages/InventoryManagement'));
const DailyExpenses = React.lazy(() => import('./pages/DailyExpenses'));
const Employees = React.lazy(() => import('./pages/Employees'));
const VendorPurchasing = React.lazy(() => import('./pages/VendorPurchasing'));
const PendingTasks = React.lazy(() => import('./pages/PendingTasks'));
const Milestones = React.lazy(() => import('./pages/Milestones'));
const EodSummary = React.lazy(() => import('./pages/EodSummary'));
const BankGuaranteeLC = React.lazy(() => import('./pages/BankGuaranteeLC'));
const CustomDuty = React.lazy(() => import('./pages/CustomDuty'));
const DailyReports = React.lazy(() => import('./pages/DailyReports'));

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireSuperAdmin }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && currentUser?.role !== 'superadmin') return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  React.useEffect(() => {
    // Default to light theme on initial load
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);
  return (
    <UserProvider>
      <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <LogProvider>
          <POProvider>
            <PVProvider>
              <WarrantyProvider>
                <ProductionProvider>
                  <InspectionProvider>
                    <InventoryProvider>
                      <ExpenseProvider>
                        <EmployeeProvider>
                          <VendorProvider>
                            <TaskProvider>
                              <MilestoneProvider>
                                <BgLcProvider>
                                  <CustomDutyProvider>
                                    <DailyReportProvider>
      <Router>
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading application...</div>}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="production" element={<ProductionTracker />} />
              <Route path="inspections" element={<Inspections />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="expenses" element={<DailyExpenses />} />
              <Route path="employees" element={<Employees />} />
              <Route path="vendor-purchasing" element={<VendorPurchasing />} />
              <Route path="pending-tasks" element={<PendingTasks />} />
              <Route path="milestones" element={<Milestones />} />
              <Route path="warranty" element={<WarrantyManagement />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="price-variation" element={<PriceVariation />} />
              <Route path="eod-summary" element={<EodSummary />} />
              <Route path="bg-lc" element={<BankGuaranteeLC />} />
              <Route path="custom-duty" element={<CustomDuty />} />
              <Route path="daily-reports" element={<DailyReports />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="users" element={<ProtectedRoute requireSuperAdmin={true}><UserManagement /></ProtectedRoute>} />
              <Route path="logs" element={<ProtectedRoute requireSuperAdmin={true}><SystemLogs /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
                                    </DailyReportProvider>
                                  </CustomDutyProvider>
                                </BgLcProvider>
                              </MilestoneProvider>
                            </TaskProvider>
                          </VendorProvider>
                        </EmployeeProvider>
                      </ExpenseProvider>
                    </InventoryProvider>
                  </InspectionProvider>
                </ProductionProvider>
              </WarrantyProvider>
            </PVProvider>
          </POProvider>
        </LogProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
    </UserProvider>
  );
}

export default App;
