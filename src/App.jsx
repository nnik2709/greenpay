import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Passports from '@/pages/Passports';
import Payments from '@/pages/Payments';
import Reports from '@/pages/Reports';
import Users from '@/pages/Users';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Tickets from '@/pages/Tickets';
import Quotations from '@/pages/Quotations';
import IndividualPurchase from '@/pages/IndividualPurchase';
import BulkPassportUpload from '@/pages/BulkPassportUpload';
import CorporateExitPass from '@/pages/CorporateExitPass';
import CreateQuotation from '@/pages/CreateQuotation';
import OfflineTemplate from '@/pages/OfflineTemplate';
import OfflineUpload from '@/pages/OfflineUpload';
import PassportReports from '@/pages/reports/PassportReports';
import PaymentModes from '@/pages/admin/PaymentModes';
import EmailTemplates from '@/pages/admin/EmailTemplates';
import IndividualPurchaseReports from '@/pages/reports/IndividualPurchaseReports';
import CorporateVoucherReports from '@/pages/reports/CorporateVoucherReports';
import RevenueGeneratedReports from '@/pages/reports/RevenueGeneratedReports';
import BulkPassportUploadReports from '@/pages/reports/BulkPassportUploadReports';
import QuotationsReports from '@/pages/reports/QuotationsReports';
import ScanAndValidate from '@/pages/ScanAndValidate';
import AgentLanding from '@/pages/AgentLanding';
import ResetPassword from '@/pages/ResetPassword';
import RoleBasedRedirect from '@/components/RoleBasedRedirect';

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
        <Route path="scan" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager', 'IT_Support']}>
            <ScanAndValidate />
          </PrivateRoute>
        } />
        <Route path="purchases/corporate-exit-pass" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent', 'Finance_Manager']}>
            <CorporateExitPass />
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
        <Route path="payments" element={
          <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
            <Payments />
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
        <Route path="tickets" element={<Tickets />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
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