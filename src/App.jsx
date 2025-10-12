import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';
import RoleBasedRedirect from '@/components/RoleBasedRedirect';

// Eager load critical pages
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import ResetPassword from '@/pages/ResetPassword';
import PublicRegistration from '@/pages/PublicRegistration';
import PublicRegistrationSuccess from '@/pages/PublicRegistrationSuccess';

// Lazy load pages for code splitting and better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Passports = lazy(() => import('@/pages/Passports'));
const EditPassport = lazy(() => import('@/pages/EditPassport'));
const Purchases = lazy(() => import('@/pages/Purchases'));
const Reports = lazy(() => import('@/pages/Reports'));
const Users = lazy(() => import('@/pages/Users'));
const Tickets = lazy(() => import('@/pages/Tickets'));
const Quotations = lazy(() => import('@/pages/Quotations'));
const IndividualPurchase = lazy(() => import('@/pages/IndividualPurchase'));
const BulkPassportUpload = lazy(() => import('@/pages/BulkPassportUpload'));
const CorporateExitPass = lazy(() => import('@/pages/CorporateExitPass'));
const CorporateBatchHistory = lazy(() => import('@/pages/CorporateBatchHistory'));
const CreateQuotation = lazy(() => import('@/pages/CreateQuotation'));
const OfflineTemplate = lazy(() => import('@/pages/OfflineTemplate'));
const OfflineUpload = lazy(() => import('@/pages/OfflineUpload'));
const PassportReports = lazy(() => import('@/pages/reports/PassportReports'));
const PaymentModes = lazy(() => import('@/pages/admin/PaymentModes'));
const EmailTemplates = lazy(() => import('@/pages/admin/EmailTemplates'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const IndividualPurchaseReports = lazy(() => import('@/pages/reports/IndividualPurchaseReports'));
const CorporateVoucherReports = lazy(() => import('@/pages/reports/CorporateVoucherReports'));
const RevenueGeneratedReports = lazy(() => import('@/pages/reports/RevenueGeneratedReports'));
const BulkPassportUploadReports = lazy(() => import('@/pages/reports/BulkPassportUploadReports'));
const QuotationsReports = lazy(() => import('@/pages/reports/QuotationsReports'));
const ScanAndValidate = lazy(() => import('@/pages/ScanAndValidate'));
const AgentLanding = lazy(() => import('@/pages/AgentLanding'));
const CashReconciliation = lazy(() => import('@/pages/CashReconciliation'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

// Special route for /scan that redirects agents directly to scan page
const ScanRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, show the scan page directly
  // This allows direct access to /scan after login
  return <ScanAndValidate />;
};

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const userRole = user?.role || 'Flex_Admin'; 

  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<RoleBasedRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
        <Route path="agent" element={
          <PrivateRoute roles={['Counter_Agent']}>
            <AgentLanding />
          </PrivateRoute>
        } />
        <Route path="users" element={
          <PrivateRoute roles={['Flex_Admin', 'IT_Support']}>
            <Users />
          </PrivateRoute>
        } />
        <Route path="passports" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager']}>
            <Passports />
          </PrivateRoute>
        } />
        <Route path="passports/create" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <IndividualPurchase />
          </PrivateRoute>
        } />
        <Route path="passports/bulk-upload" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <BulkPassportUpload />
          </PrivateRoute>
        } />
        <Route path="passports/edit/:id" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <EditPassport />
          </PrivateRoute>
        } />
        <Route path="scan" element={<ScanRoute />} />
        <Route path="purchases/corporate-exit-pass" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager']}>
            <CorporateExitPass />
          </PrivateRoute>
        } />
        <Route path="purchases/corporate-batch-history" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <CorporateBatchHistory />
          </PrivateRoute>
        } />
        <Route path="purchases/offline-template" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <OfflineTemplate />
          </PrivateRoute>
        } />
        <Route path="purchases/offline-upload" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <OfflineUpload />
          </PrivateRoute>
        } />
        <Route path="purchases" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <Purchases />
          </PrivateRoute>
        } />
        <Route path="cash-reconciliation" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager']}>
            <CashReconciliation />
          </PrivateRoute>
        } />
        <Route path="quotations" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager']}>
            <Quotations />
          </PrivateRoute>
        } />
        <Route path="quotations/create" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager']}>
            <CreateQuotation />
          </PrivateRoute>
        } />
        <Route path="reports" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <Reports />
          </PrivateRoute>
        } />
        <Route path="reports/passports" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <PassportReports />
          </PrivateRoute>
        } />
        <Route path="reports/individual-purchase" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <IndividualPurchaseReports />
          </PrivateRoute>
        } />
        <Route path="reports/corporate-vouchers" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <CorporateVoucherReports />
          </PrivateRoute>
        } />
        <Route path="reports/revenue-generated" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <RevenueGeneratedReports />
          </PrivateRoute>
        } />
        <Route path="reports/bulk-passport-uploads" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <BulkPassportUploadReports />
          </PrivateRoute>
        } />
        <Route path="reports/quotations" element={
          <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
            <QuotationsReports />
          </PrivateRoute>
        } />
        <Route path="admin/payment-modes" element={
          <PrivateRoute roles={['Flex_Admin']}>
            <PaymentModes />
          </PrivateRoute>
        } />
        <Route path="admin/email-templates" element={
          <PrivateRoute roles={['Flex_Admin']}>
            <EmailTemplates />
          </PrivateRoute>
        } />
        <Route path="admin/settings" element={
          <PrivateRoute roles={['Flex_Admin']}>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="tickets" element={<Tickets />} />
        </Route>
        
        {/* Public Routes - No Authentication Required */}
        <Route path="/register/:voucherCode" element={<PublicRegistration />} />
        <Route path="/register/success/:voucherCode" element={<PublicRegistrationSuccess />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <>
      <Helmet>
        <title>PNG Green Fees System</title>
        <meta name="description" content="A comprehensive government application for managing passport-based green fee vouchers and payments in Papua New Guinea." />
      </Helmet>
      <Toaster />
      <AppRoutes />
    </>
  );
}

export default App;