import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, RefreshCw, Edit } from 'lucide-react';
import api from '@/lib/api/client';

/**
 * Payment Cancelled Page
 *
 * Displayed when user cancels payment on gateway
 * Supports session recovery for retry without re-scanning passport
 */

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  // Check if we have a session to recover
  useEffect(() => {
    const checkSession = async () => {
      // Try to get session ID from URL or sessionStorage
      const sessionId = searchParams.get('payment_session') || sessionStorage.getItem('paymentSessionId');

      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch session data from backend
        const response = await api.get(`/buy-online/session/${sessionId}`);

        if (response.success && response.data) {
          setSessionData(response.data);
          console.log('Session recovered:', response.data);
        }
      } catch (error) {
        console.error('Failed to recover session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [searchParams]);

  // Retry payment with existing session data
  const handleRetryPayment = async () => {
    if (!sessionData) return;

    setRetrying(true);

    try {
      // Call backend to retry payment with existing session
      const response = await api.post('/buy-online/retry-payment', {
        sessionId: sessionData.id
      });

      if (response.success) {
        toast({
          title: 'Redirecting to Payment',
          description: 'Retrying your payment...',
        });

        // Redirect to payment gateway
        setTimeout(() => {
          window.location.href = response.data.paymentUrl;
        }, 1000);
      } else {
        throw new Error(response.error || 'Failed to retry payment');
      }
    } catch (error) {
      console.error('Retry payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Retry Failed',
        description: error.message || 'Unable to retry payment. Please start a new purchase.',
      });
      setRetrying(false);
    }
  };

  // Navigate to BuyOnline with pre-filled passport data
  const handleEditPassport = () => {
    if (!sessionData || !sessionData.passport_data) return;

    // Store passport data in sessionStorage for pre-filling
    sessionStorage.setItem('editPassportSession', JSON.stringify({
      sessionId: sessionData.id,
      email: sessionData.customer_email,
      quantity: sessionData.quantity,
      passportData: sessionData.passport_data
    }));

    navigate('/buy-online?edit=true');
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
                No charges were made to your card.
              </p>
            </div>

            {/* Session Recovery Info */}
            {!loading && sessionData && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-1">Your Information is Saved</h3>
                    <p className="text-sm text-emerald-700 mb-2">
                      We've kept your {sessionData.passport_data ? 'passport details and ' : ''}order information.
                      You can retry payment without entering everything again.
                    </p>
                    {sessionData.passport_data && (
                      <div className="text-xs text-emerald-600 bg-white/50 rounded px-2 py-1 mt-2">
                        Passport: {sessionData.passport_data.passportNumber} - {sessionData.passport_data.givenName} {sessionData.passport_data.surname}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && !sessionData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Want to try again?</h3>
                  <p className="text-sm text-blue-700">
                    Click the button below to return to the purchase page and complete your transaction.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {sessionData ? (
                <>
                  <Button
                    onClick={handleRetryPayment}
                    disabled={retrying}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
                  >
                    {retrying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Preparing Payment...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Payment (K {sessionData.amount?.toFixed(2)})
                      </>
                    )}
                  </Button>
                  {sessionData.passport_data && (
                    <Button
                      onClick={handleEditPassport}
                      variant="outline"
                      className="w-full h-12 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Passport Details
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate('/buy-online')}
                    variant="outline"
                    className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Start New Purchase
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
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
