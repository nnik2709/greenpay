import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Payment Cancelled Page
 *
 * Displayed when user cancels payment on Stripe
 */

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 relative overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg-png.jpg)',
          filter: 'brightness(1.1) blur(3px)',
        }}
      />
      <div className="absolute inset-0 bg-white/75" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-cyan-50/60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Cancelled Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-700 mb-2">Payment Cancelled</h1>
          <p className="text-slate-600 text-lg">Your payment was not completed</p>
        </motion.div>

        <Card className="glass-effect border-slate-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="text-xl text-slate-800">What happened?</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700 mb-4">
                You cancelled the payment process before it was completed.
              </p>
              <p className="text-sm text-slate-600">
                No charges were made to your card and no passport data was saved.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Want to try again?</h3>
                <p className="text-sm text-blue-700">
                  Click the button below to return to the purchase page and complete your transaction.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/buy-online')}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Return to Home
              </Button>
            </div>

            {/* Help */}
            <div className="border-t pt-4">
              <p className="text-xs text-slate-500 text-center">
                Having trouble with payment? Your data is secure and not saved until payment completes.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCancelled;
