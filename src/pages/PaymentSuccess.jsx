import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api/client';

/**
 * Payment Success Page - Enhanced Flow
 *
 * After successful payment:
 * 1. Display voucher immediately with QR code
 * 2. Show Print and Download PDF buttons
 * 3. Show "Email Voucher" button that opens dialog for email input
 */

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState(null);

  // Email dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  const sessionId = searchParams.get('session_id');
  // Try to get payment session ID from URL first, then fallback to sessionStorage
  // Extract clean session ID without query parameters
  const rawPaymentSessionId = searchParams.get('payment_session') || sessionStorage.getItem('paymentSessionId');
  const paymentSessionId = rawPaymentSessionId ? rawPaymentSessionId.split('?')[0] : null;

  useEffect(() => {
    const fetchVoucherDetails = async () => {
      try {
        if (!paymentSessionId) {
          setError('No payment session found');
          setLoading(false);
          return;
        }

        // Poll for voucher creation (webhook might take a few seconds)
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          try {
            const response = await api.get(`/buy-online/voucher/${paymentSessionId}`);

            if (response.success && response.voucher) {
              setVoucher(response.voucher);
              // Pre-fill email dialog with Stripe email
              if (response.voucher.customerEmail) {
                setEmailInput(response.voucher.customerEmail);
              }
              setLoading(false);
              // Clear session storage
              sessionStorage.removeItem('paymentSessionId');
              sessionStorage.removeItem('passportData');
              return;
            }
          } catch (err) {
            // Voucher not ready yet, continue polling
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }

        // After 20 seconds, show message
        setError('Voucher is being processed. Please check back in a moment.');
        setLoading(false);

      } catch (err) {
        console.error('Error fetching voucher:', err);
        setError('Unable to retrieve voucher details.');
        setLoading(false);
      }
    };

    fetchVoucherDetails();
  }, [sessionId, paymentSessionId]);

  const handleEmailVoucher = async () => {
    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      alert('Please enter a valid email address');
      return;
    }

    setEmailSending(true);
    try {
      await api.post(`/buy-online/voucher/${paymentSessionId}/email`, {
        email: emailInput
      });
      alert('Voucher sent successfully to ' + emailInput);
      setShowEmailDialog(false);
      setEmailInput('');
    } catch (err) {
      console.error('Email failed:', err);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 relative overflow-hidden flex items-center justify-center">
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Processing Payment...</h2>
          <p className="text-slate-600 mt-2">Creating your voucher, please wait</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 relative overflow-hidden flex items-center justify-center">
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
          className="relative z-10 max-w-md"
        >
          <Card className="border-yellow-200 shadow-xl">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <span className="text-3xl">⚠️</span>
                Processing Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 mb-4">{error}</p>
              <p className="text-sm text-slate-600 mb-6">
                Your payment was successful. Please try refreshing the page.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 mb-2"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden flex items-center justify-center">
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-2xl w-full"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-emerald-700 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 text-lg">Your green fee voucher is ready</p>
        </motion.div>

        <Card className="glass-effect border-emerald-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-2xl text-emerald-800">Voucher Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Voucher Code + QR Code */}
            <div className="bg-white rounded-lg p-6 border-2 border-emerald-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Voucher Code</p>
                  <p className="text-3xl font-bold text-emerald-700 tracking-wider font-mono mb-4">
                    {voucher?.voucherCode || voucher?.code}
                  </p>
                  <p className="text-xs text-slate-500">
                    Present this code at the gate for entry
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  {voucher?.qrCode && (
                    <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                      <img
                        src={voucher.qrCode}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                      <p className="text-xs text-center text-slate-500 mt-2">
                        Scan at gate
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Passport Number</p>
                <p className="font-semibold text-slate-800">
                  {voucher?.passportNumber}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Amount Paid</p>
                <p className="font-semibold text-slate-800">K {voucher?.amount || '50.00'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Valid From</p>
                <p className="font-semibold text-slate-800">
                  {voucher?.validFrom ? new Date(voucher.validFrom).toLocaleDateString() : 'Today'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Valid Until</p>
                <p className="font-semibold text-slate-800">
                  {voucher?.validUntil ? new Date(voucher.validUntil).toLocaleDateString() : '30 days'}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-900 mb-2">Next Steps:</h3>
              <ol className="text-sm text-emerald-700 space-y-1 list-decimal list-inside">
                <li>Save or print this voucher confirmation</li>
                <li>Present your voucher code at the entry checkpoint</li>
                <li>Keep your passport with you for verification</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                onClick={async () => {
                  try {
                    const url = `/api/buy-online/voucher/${paymentSessionId}/pdf`;
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `voucher-${voucher?.code}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (err) {
                    console.error('Download failed:', err);
                  }
                }}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Download PDF
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Print
              </Button>
              <Button
                onClick={() => setShowEmailDialog(true)}
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Email Voucher
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Thank you for using PNG Green Fees System
        </p>
      </motion.div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Voucher</DialogTitle>
            <DialogDescription>
              Send voucher to the email used during payment, or change to a different email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={emailSending}
              />
              <p className="text-xs text-slate-500">
                Default: Email used during payment. You can change it to send to a different address.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEmailVoucher}
                disabled={emailSending}
                className="flex-1"
              >
                {emailSending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={emailSending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSuccess;
