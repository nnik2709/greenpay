import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg-png.jpg)',
          filter: 'brightness(1.1) blur(3px)',
        }}
      />
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-white/75" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-cyan-50/60" />

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            PNG Green Fees
          </h1>
          <p className="text-slate-600 text-xl">Papua New Guinea Entry Permit System</p>
        </div>

        {/* Buy Online Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-effect rounded-3xl p-10 shadow-2xl border-2 border-emerald-200 mb-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Buy Green Fee Voucher Online
            </h2>
            <p className="text-slate-600 text-base">
              Secure credit card payment • Instant passport registration • Email delivery
            </p>
          </div>

          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate('/buy-online')}
                size="lg"
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-2xl transition-all"
              >
                Continue to Purchase →
              </Button>
            </motion.div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">How it works:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Enter your passport details</li>
                <li>Complete secure credit card payment</li>
                <li>Receive voucher via email instantly</li>
                <li>Present voucher at entry checkpoint</li>
              </ol>
            </div>

            <div className="text-center pt-2">
              <p className="text-lg font-bold text-emerald-700">
                Amount: K 50.00 per Passport
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Secure payment • Converted to USD for processing
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 space-y-2"
        >
          <p>© 2025 Eywa Systems. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-emerald-700 font-semibold">
            <button className="hover:underline" onClick={() => navigate('/terms')}>Terms &amp; Conditions</button>
            <button className="hover:underline" onClick={() => navigate('/privacy')}>Privacy Policy</button>
            <button className="hover:underline" onClick={() => navigate('/refunds')}>Refund / Return Policy</button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;
