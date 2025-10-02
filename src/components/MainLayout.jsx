import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';

const MainLayout = () => {
  const location = useLocation();
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-10 md:p-10 min-h-screen">
        <AnimatePresence mode="wait">
          <Outlet location={location} key={location.pathname} />
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout;
