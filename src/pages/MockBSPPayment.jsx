import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/**
 * Mock BSP Payment Gateway Page
 * Simulates the BSP payment interface for development/testing
 *
 * REPLACE THIS WITH ACTUAL BSP REDIRECTION IN PRODUCTION!
 */

const MockBSPPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const merchantRef = searchParams.get('merchant_ref');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'PGK';
  const txnId = searchParams.get('txn_id');
  const returnUrl = searchParams.get('return_url');
  const cancelUrl = searchParams.get('cancel_url');

  // Auto-redirect countdown for successful payment
  useEffect(() => {
    if (isProcessing && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isProcessing && countdown === 0) {
      handleRedirectBack('success');
    }
  }, [isProcessing, countdown]);

  const handlePayment = () => {
    setIsProcessing(true);
  };

  const handleCancel = () => {
    handleRedirectBack('cancelled');
  };

  const handleRedirectBack = (status) => {
    // Construct callback URL with payment result
    const callbackUrl = new URL(returnUrl);
    callbackUrl.searchParams.set('status', status);
    callbackUrl.searchParams.set('merchant_ref', merchantRef);
    callbackUrl.searchParams.set('txn_id', txnId);

    if (status === 'success') {
      callbackUrl.searchParams.set('payment_method', paymentMethod.toUpperCase());
      callbackUrl.searchParams.set('amount', amount);
      callbackUrl.searchParams.set('currency', currency);
      callbackUrl.searchParams.set('auth_code', `AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    } else {
      callbackUrl.searchParams.set('error_message', 'Payment cancelled by user');
    }

    // Redirect back to application
    window.location.href = callbackUrl.toString();
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-green-200 shadow-xl">
            <CardContent className="p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-6xl mb-6"
              >
                ✓
              </motion.div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              <p className="text-slate-600 mb-6">
                Your payment of <span className="font-bold">PGK {amount}</span> has been processed.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Transaction ID:</strong> {txnId}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Payment Method:</strong> {paymentMethod.toUpperCase()}
                </p>
              </div>
              <p className="text-sm text-slate-500">
                Redirecting back to PNG Green Fees in <span className="font-bold text-lg">{countdown}</span>...
              </p>
              <Button
                onClick={() => handleRedirectBack('success')}
                className="mt-4"
                variant="outline"
              >
                Return Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-full p-4 shadow-lg mb-4">
            <img
              src="https://www.bsp.com.pg/wp-content/themes/bsp/img/logo.svg"
              alt="BSP Logo"
              className="h-12 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }} className="text-2xl font-bold text-blue-600">
              🏦 BSP Bank
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Secure Payment Gateway</h1>
          <p className="text-slate-600 mt-2">MOCK - Development Environment Only</p>
        </div>

        {/* Warning Badge */}
        <Alert className="mb-6 bg-yellow-50 border-yellow-300">
          <AlertDescription className="text-yellow-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Mock Payment Gateway</p>
                <p className="text-sm">This is a simulated BSP payment page for development. No real payment is processed.</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Payment Details */}
        <Card className="shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-3">
                <span className="text-slate-600">Merchant:</span>
                <span className="font-semibold">PNG Green Fees System</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-slate-600">Reference:</span>
                <span className="font-mono text-sm">{merchantRef}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-slate-600">Transaction ID:</span>
                <span className="font-mono text-sm">{txnId}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4">
                <span className="text-lg font-semibold text-slate-800">Amount to Pay:</span>
                <span className="text-3xl font-bold text-blue-600">
                  {currency} {parseFloat(amount).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                {/* Visa/Mastercard */}
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="visa" id="visa" />
                  <Label htmlFor="visa" className="flex-1 cursor-pointer flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-semibold">Visa / Mastercard</p>
                      <p className="text-xs text-slate-500">Debit or Credit Card</p>
                    </div>
                  </Label>
                </div>

                {/* BSP Pay */}
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="bsp_pay" id="bsp_pay" />
                  <Label htmlFor="bsp_pay" className="flex-1 cursor-pointer flex items-center gap-2">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-semibold">BSP Pay</p>
                      <p className="text-xs text-slate-500">Mobile App Payment</p>
                    </div>
                  </Label>
                </div>

                {/* Mobile Money */}
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="flex-1 cursor-pointer flex items-center gap-2">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-semibold">Mobile Money</p>
                      <p className="text-xs text-slate-500">USSD *131#</p>
                    </div>
                  </Label>
                </div>

                {/* EFTPOS */}
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="eftpos" id="eftpos" />
                  <Label htmlFor="eftpos" className="flex-1 cursor-pointer flex items-center gap-2">
                    <span className="text-2xl">🏦</span>
                    <div>
                      <p className="font-semibold">EFTPOS Online</p>
                      <p className="text-xs text-slate-500">Bank Transfer</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* Mock card input (only shown for card payment) */}
            {paymentMethod === 'visa' && (
              <div className="mt-6 space-y-4 bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-slate-700">Card Details (Mock)</h4>
                <Input placeholder="4242 4242 4242 4242" disabled />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM/YY" disabled />
                  <Input placeholder="CVV" disabled />
                </div>
                <p className="text-xs text-slate-500">
                  This is a mock interface. Any input is accepted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1 h-14"
          >
            Cancel Payment
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-semibold"
          >
            🔒 Pay {currency} {parseFloat(amount).toFixed(2)}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔐 Secured by BSP Bank PNG | PCI DSS Compliant
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Mock payment gateway - For development and testing only
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MockBSPPayment;
