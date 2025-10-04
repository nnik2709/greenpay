import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

const MainLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Don't show header for agent landing page
  const isAgentLanding = location.pathname === '/agent';
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      {!isAgentLanding && <Header />}
      <main className={`flex flex-1 flex-col gap-6 p-6 md:gap-10 md:p-10 min-h-screen ${isAgentLanding ? 'pt-0' : ''}`}>
        <AnimatePresence mode="wait">
          <Outlet location={location} key={location.pathname} />
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout;
