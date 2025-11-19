import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  verifyOnlinePayment,
  getTransactionByReference,
  GATEWAY_NAMES,
  TRANSACTION_STATUS
} from '@/lib/paymentGatewayService';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [verificationState, setVerificationState] = useState('verifying'); // verifying, success, failed, error
  const [transaction, setTransaction] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    verifyPaymentFromCallback();
  }, []);

  const verifyPaymentFromCallback = async () => {
    try {
      // Get merchant reference from URL parameters
      const merchantReference = searchParams.get('ref') || searchParams.get('merchant_reference');
      const status = searchParams.get('status');
      const transactionId = searchParams.get('transaction_id');

      console.log('Payment callback received:', {
        merchantReference,
        status,
        transactionId,
        allParams: Object.fromEntries(searchParams.entries())
      });

      if (!merchantReference) {
        setVerificationState('error');
        setErrorMessage('Invalid payment callback - missing reference number');
        return;
      }

      // Get transaction from database
      const txn = await getTransactionByReference(merchantReference);
      setTransaction(txn);

      // If callback indicates failure immediately
      if (status === 'failed' || status === 'cancelled' || status === 'error') {
        setVerificationState('failed');
        setErrorMessage(searchParams.get('message') || 'Payment was not completed');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: 'The payment was not successful. Please try again.'
        });
        return;
      }

      // Verify payment with gateway
      const verificationResult = await verifyOnlinePayment(
        txn.gatewayName || GATEWAY_NAMES.KINA_BANK,
        merchantReference
      );

      console.log('Payment verification result:', verificationResult);

      if (verificationResult.success) {
        setVerificationState('success');
        setTransaction(verificationResult.transaction);
        toast({
          title: 'Payment Successful!',
          description: `Payment of PGK ${txn.amount} has been processed successfully.`
        });
      } else {
        setVerificationState('failed');
        setErrorMessage(verificationResult.errorMessage || 'Payment verification failed');
        toast({
          variant: 'destructive',
          title: 'Payment Verification Failed',
          description: 'Unable to verify payment status. Please contact support.'
        });
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationState('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        variant: 'destructive',
        title: 'Verification Error',
        description: error.message || 'Failed to verify payment. Please contact support.'
      });
    }
  };

  const handleContinue = () => {
    if (verificationState === 'success' && transaction) {
      // If transaction has a purchase ID, navigate to voucher view
      if (transaction.purchaseId) {
        navigate(`/voucher/${transaction.purchaseId}`, {
          state: { paymentSuccessful: true }
        });
      } else {
        // Otherwise go to dashboard
        navigate('/', {
          state: { message: 'Payment processed successfully' }
        });
      }
    } else {
      // For failed payments, go back to purchase page
      navigate('/individual-purchase', {
        state: { message: 'Payment failed. Please try again.' }
      });
    }
  };

  const handleRetry = () => {
    navigate('/individual-purchase', {
      state: { retryPayment: true }
    });
  };

  const renderVerificationContent = () => {
    switch (verificationState) {
      case 'verifying':
        return (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment with the bank.</p>
            <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>

            {transaction && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction Reference:</span>
                    <span className="font-mono font-semibold text-green-700">
                      {transaction.merchantReference}
                    </span>
                  </div>
                  {transaction.transactionReference && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bank Reference:</span>
                      <span className="font-mono font-semibold">
                        {transaction.transactionReference}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-green-700">
                      PGK {transaction.amount?.toFixed(2)}
                    </span>
                  </div>
                  {transaction.paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold">
                        {transaction.paymentMethod}
                        {transaction.cardLastFour && ` •••• ${transaction.cardLastFour}`}
                      </span>
                    </div>
                  )}
                  {transaction.paymentDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Date:</span>
                      <span className="font-semibold">
                        {new Date(transaction.paymentDate).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={handleContinue} size="lg" className="bg-green-600 hover:bg-green-700">
                Continue
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">We couldn't process your payment.</p>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            {transaction && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto mb-6">
                <div className="space-y-2 text-left text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono">{transaction.merchantReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">PGK {transaction.amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={handleRetry} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" size="lg">
                Cancel
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              If you continue to experience issues, please contact support with reference:
              <span className="font-mono font-semibold"> {transaction?.merchantReference}</span>
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <AlertCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-orange-700 mb-2">Verification Error</h2>
            <p className="text-gray-600 mb-4">We encountered an error while verifying your payment.</p>

            {errorMessage && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                <p className="text-sm text-orange-800">{errorMessage}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
              <p className="text-sm text-blue-800">
                Your payment may still be processing. Please check your email for confirmation or contact support.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={verifyPaymentFromCallback} variant="outline" size="lg">
                Retry Verification
              </Button>
              <Button onClick={() => navigate('/')} size="lg">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CardTitle className="text-center text-2xl">Payment Processing</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderVerificationContent()}
          </CardContent>
        </Card>

        {/* Debug info (only in development) */}
        {import.meta.env.DEV && (
          <Card className="mt-4 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm text-yellow-800">Debug Info (Dev Only)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  state: verificationState,
                  params: Object.fromEntries(searchParams.entries()),
                  transaction: transaction ? {
                    merchantRef: transaction.merchantReference,
                    status: transaction.status,
                    amount: transaction.amount
                  } : null
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
