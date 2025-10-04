import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/pages/Dashboard';
import AgentLanding from '@/pages/AgentLanding';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  
  // Show loading while user data is being fetched
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Render the appropriate component based on user role
  switch (user?.role) {
    case 'Counter_Agent':
      return <AgentLanding />;
    case 'Flex_Admin':
    case 'Finance_Manager':
    case 'IT_Support':
    default:
      return <Dashboard />;
  }
};

export default RoleBasedRedirect;
