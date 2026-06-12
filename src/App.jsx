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
import { BOMProvider } from './context/BOMContext';
import { DailyReportProvider } from './context/DailyReportContext';
import { ToastProvider } from './context/ToastContext';
import { DispatchProvider } from './context/DispatchContext';


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
const BOMManagement = React.lazy(() => import('./pages/BOMManagement'));

const FinanceHub = React.lazy(() => import('./pages/FinanceHub'));
const ManufacturingHub = React.lazy(() => import('./pages/ManufacturingHub'));
const HRHub = React.lazy(() => import('./pages/HRHub'));
const OperationsHub = React.lazy(() => import('./pages/OperationsHub'));
const ProjectHub = React.lazy(() => import('./pages/ProjectHub'));

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
          <BOMProvider>
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
<DispatchProvider>
      <Router>
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading application...</div>}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="finance" element={<FinanceHub />} />
              <Route path="manufacturing" element={<ManufacturingHub />} />
              <Route path="hr" element={<HRHub />} />
              <Route path="operations" element={<OperationsHub />} />
              <Route path="projects" element={<ProjectHub />} />
              <Route path="inventory" element={<InventoryManagement />} />
              
              {/* Legacy route redirects to preserve bookmarks */}
              <Route path="production" element={<Navigate to="/manufacturing#production" replace />} />
              <Route path="inspections" element={<Navigate to="/manufacturing#inspections" replace />} />
              <Route path="warranty" element={<Navigate to="/manufacturing#warranty" replace />} />
              <Route path="bom" element={<Navigate to="/manufacturing#bom" replace />} />
              <Route path="purchase-orders" element={<Navigate to="/finance#purchase-orders" replace />} />
              <Route path="vendor-purchasing" element={<Navigate to="/finance#vendor-purchasing" replace />} />
              <Route path="price-variation" element={<Navigate to="/finance#price-variation" replace />} />
              <Route path="bg-lc" element={<Navigate to="/finance#bg-lc" replace />} />
              <Route path="custom-duty" element={<Navigate to="/finance#custom-duty" replace />} />
              <Route path="employees" element={<Navigate to="/hr#employees" replace />} />
              <Route path="payroll" element={<Navigate to="/hr#payroll" replace />} />
              <Route path="daily-reports" element={<Navigate to="/operations#daily-reports" replace />} />
              <Route path="expenses" element={<Navigate to="/operations#expenses" replace />} />
              <Route path="eod-summary" element={<Navigate to="/operations#eod-summary" replace />} />
              <Route path="pending-tasks" element={<Navigate to="/projects#pending-tasks" replace />} />
              <Route path="milestones" element={<Navigate to="/projects#milestones" replace />} />

              <Route path="profile" element={<ProfileSettings />} />
              <Route path="users" element={<ProtectedRoute requireSuperAdmin={true}><UserManagement /></ProtectedRoute>} />
              <Route path="logs" element={<ProtectedRoute requireSuperAdmin={true}><SystemLogs /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
                                    </DispatchProvider>
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
        </BOMProvider>
                  </LogProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
    </UserProvider>
  );
}

export default App;
