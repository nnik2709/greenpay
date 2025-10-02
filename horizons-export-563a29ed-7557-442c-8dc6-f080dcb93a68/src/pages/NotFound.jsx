import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center h-[60vh]"
    >
      <AlertTriangle className="w-24 h-24 text-red-500 mb-6" />
      <h1 className="text-6xl font-bold text-slate-800 mb-3">404</h1>
      <h2 className="text-3xl font-semibold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
        Page Not Found
      </h2>
      <p className="text-slate-600 text-lg max-w-md mb-8">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </motion.div>
  );
};

export default NotFound;