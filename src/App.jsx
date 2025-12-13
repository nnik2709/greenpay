import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';
import RoleBasedRedirect from '@/components/RoleBasedRedirect';

// Eager load critical pages
import HomePage from '@/pages/HomePage';
import Login from '@/pages/Login';
import BuyOnline from '@/pages/BuyOnline';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentCancelled from '@/pages/PaymentCancelled';
import NotFound from '@/pages/NotFound';
import ResetPassword from '@/pages/ResetPassword';
import PublicRegistration from '@/pages/PublicRegistration';
import PublicRegistrationSuccess from '@/pages/PublicRegistrationSuccess';
import ScannerTest from '@/pages/ScannerTest';
// Public voucher purchase pages (no auth required)
import PublicVoucherPurchase from '@/pages/PublicVoucherPurchase';
import PublicPurchaseCallback from '@/pages/PublicPurchaseCallback';
import MockBSPPayment from '@/pages/MockBSPPayment';

// Lazy load pages for code splitting and better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Passports = lazy(() => import('@/pages/Passports'));
const EditPassport = lazy(() => import('@/pages/EditPassport'));
const PaymentsList = lazy(() => import('@/pages/PaymentsList'));
const Reports = lazy(() => import('@/pages/Reports'));
const Users = lazy(() => import('@/pages/Users'));
const Tickets = lazy(() => import('@/pages/Tickets'));
const Quotations = lazy(() => import('@/pages/Quotations'));
const ViewQuotation = lazy(() => import('@/pages/ViewQuotation'));
const IndividualPurchase = lazy(() => import('@/pages/IndividualPurchase'));
const PaymentCallback = lazy(() => import('@/pages/PaymentCallback'));
const BulkPassportUpload = lazy(() => import('@/pages/BulkPassportUpload'));
const CorporateExitPass = lazy(() => import('@/pages/CorporateExitPass'));
const CorporateBatchHistory = lazy(() => import('@/pages/CorporateBatchHistory'));
const CorporateVoucherRegistration = lazy(() => import('@/pages/CorporateVoucherRegistration'));
const CreateQuotation = lazy(() => import('@/pages/CreateQuotation'));
const OfflineTemplate = lazy(() => import('@/pages/OfflineTemplate'));
const OfflineUpload = lazy(() => import('@/pages/OfflineUpload'));
const PassportReports = lazy(() => import('@/pages/reports/PassportReports'));
const PaymentModes = lazy(() => import('@/pages/admin/PaymentModes'));
const PaymentGatewaySettings = lazy(() => import('@/pages/admin/PaymentGatewaySettings'));
const EmailTemplates = lazy(() => import('@/pages/admin/EmailTemplates'));
const Customers = lazy(() => import('@/pages/admin/Customers'));
const Settings = lazy(() => import('@/pages/admin/SettingsRPC'));
const ProfileSettings = lazy(() => import('@/pages/ProfileSettings'));
const LoginHistory = lazy(() => import('@/pages/admin/LoginHistory'));
const SMSSettings = lazy(() => import('@/pages/admin/SMSSettings'));
const IndividualPurchaseReports = lazy(() => import('@/pages/reports/IndividualPurchaseReports'));
const CorporateVoucherReports = lazy(() => import('@/pages/reports/CorporateVoucherReports'));
const RevenueGeneratedReports = lazy(() => import('@/pages/reports/RevenueGeneratedReports'));
const BulkPassportUploadReports = lazy(() => import('@/pages/reports/BulkPassportUploadReports'));
const QuotationsReports = lazy(() => import('@/pages/reports/QuotationsReports'));
const RefundedReport = lazy(() => import('@/pages/reports/RefundedReport'));
const ScanAndValidate = lazy(() => import('@/pages/ScanAndValidate'));
const AgentLanding = lazy(() => import('@/pages/AgentLanding'));
const CashReconciliation = lazy(() => import('@/pages/CashReconciliation'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const VouchersList = lazy(() => import('@/pages/VouchersList'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

// Login route component that uses useAuth hook
const LoginRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" /> : <Login />;
};

// Special route for /scan - restricted to Counter_Agent and Finance_Manager only
const ScanRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to finish loading
  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || 'Flex_Admin';

  // Only Flex_Admin, Counter_Agent and Finance_Manager can access scan page
  if (!['Flex_Admin', 'Counter_Agent', 'Finance_Manager'].includes(userRole)) {
    return <Navigate to="/app" replace />;
  }

  // Authorized: Show scan page
  return <ScanAndValidate />;
};

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to finish loading
  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || 'Flex_Admin';

  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Home Page at root */}
        <Route path="/" element={<HomePage />} />

        {/* Staff Login */}
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />

        {/* Public routes - No authentication required */}
        <Route path="/buy-online" element={<BuyOnline />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        <Route path="/buy-voucher" element={<PublicVoucherPurchase />} />
        <Route path="/purchase/callback" element={<PublicPurchaseCallback />} />
        <Route path="/mock-bsp-payment" element={<MockBSPPayment />} />
        <Route path="/register/:voucherCode" element={<PublicRegistration />} />
        <Route path="/register/success/:voucherCode" element={<PublicRegistrationSuccess />} />
        <Route path="/corporate-voucher-registration" element={<CorporateVoucherRegistration />} />

        {/* All authenticated routes under MainLayout */}
        <Route path="/app" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
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
            <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager']}>
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
          <Route path="scanner-test" element={
            <PrivateRoute roles={['Flex_Admin', 'IT_Support', 'Counter_Agent']}>
              <ScannerTest />
            </PrivateRoute>
          } />
          <Route path="vouchers-list" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support', 'Counter_Agent']}>
              <VouchersList />
            </PrivateRoute>
          } />
          <Route path="payments/corporate-exit-pass" element={
            <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager']}>
              <CorporateExitPass />
            </PrivateRoute>
          } />
          <Route path="payments/corporate-batch-history" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
              <CorporateBatchHistory />
            </PrivateRoute>
          } />
          <Route path="payments/offline-template" element={
            <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
              <OfflineTemplate />
            </PrivateRoute>
          } />
          <Route path="payments/offline-upload" element={
            <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
              <OfflineUpload />
            </PrivateRoute>
          } />
          <Route path="payments" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager']}>
              <PaymentsList />
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
          <Route path="quotations/:id" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager']}>
              <ViewQuotation />
            </PrivateRoute>
          } />
          <Route path="invoices" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
              <Invoices />
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
          <Route path="reports/refunded" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
              <RefundedReport />
            </PrivateRoute>
          } />
          <Route path="reports/cash-reconciliation" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'Counter_Agent']}>
              <CashReconciliation />
            </PrivateRoute>
          } />
          <Route path="admin/customers" element={
            <PrivateRoute roles={['Flex_Admin', 'Finance_Manager']}>
              <Customers />
            </PrivateRoute>
          } />
          <Route path="admin/payment-modes" element={
            <PrivateRoute roles={['Flex_Admin']}>
              <PaymentModes />
            </PrivateRoute>
          } />
          <Route path="admin/payment-gateway" element={
            <PrivateRoute roles={['Flex_Admin']}>
              <PaymentGatewaySettings />
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
          <Route path="profile" element={
            <PrivateRoute>
              <ProfileSettings />
            </PrivateRoute>
          } />
          <Route path="admin/login-history" element={
            <PrivateRoute roles={['Flex_Admin', 'IT_Support']}>
              <LoginHistory />
            </PrivateRoute>
          } />
          <Route path="admin/sms-settings" element={
            <PrivateRoute roles={['Flex_Admin']}>
              <SMSSettings />
            </PrivateRoute>
          } />
          <Route path="corporate-batch-history" element={
            <PrivateRoute roles={['Flex_Admin', 'IT_Support']}>
              <CorporateBatchHistory />
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