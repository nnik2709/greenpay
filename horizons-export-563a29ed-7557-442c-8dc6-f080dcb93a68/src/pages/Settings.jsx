import React from 'react';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

const Settings = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center h-[60vh]"
    >
      <Construction className="w-24 h-24 text-amber-500 mb-6" />
      <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
        Settings Under Construction
      </h1>
      <p className="text-slate-600 text-lg max-w-md">
        This section is currently being developed. You can request specific settings or features in your next prompt!
      </p>
    </motion.div>
  );
};

export default Settings;