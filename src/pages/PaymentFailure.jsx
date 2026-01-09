import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Payment Failure Page
 *
 * Displayed when payment fails on BSP/DOKU payment gateway
 */

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Get session ID and error from URL params
    const session = searchParams.get('session');
    const error = searchParams.get('error');

    if (session) setSessionId(session);
    if (error) setErrorMessage(decodeURIComponent(error));
  }, [searchParams]);

  const handleTryAgain = () => {
    // Return to start of purchase flow
    navigate('/buy-online');
  };

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
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-orange-50/50 to-amber-50/60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Failed Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-red-700 mb-2">Payment Failed</h1>
          <p className="text-slate-600 text-lg">Your payment could not be processed</p>
        </motion.div>

        <Card className="glass-effect border-red-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="text-xl text-red-800">What happened?</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">Error Details:</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Session ID */}
            {sessionId && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Transaction Reference:</p>
                <p className="text-sm text-slate-700 font-mono break-all">{sessionId}</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700 mb-4">
                Your payment was declined or failed during processing.
              </p>
              <p className="text-sm text-slate-600">
                No charges were made to your card and no passport data was saved.
              </p>
            </div>

            {/* Common Reasons */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">Common reasons for payment failure:</h3>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Insufficient funds in your account</li>
                <li>Card was declined by your bank</li>
                <li>Incorrect card details entered</li>
                <li>Card not authorized for online payments</li>
                <li>Network or connection issues</li>
              </ul>
            </div>

            {/* What to do */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">What should I do?</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Try again with a different payment method or card. If the issue persists, contact your bank.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleTryAgain}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Return to Home
              </Button>
            </div>

            {/* Help */}
            <div className="border-t pt-4">
              <p className="text-xs text-slate-500 text-center">
                Need help? Contact support with your transaction reference number.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;
