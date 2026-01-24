import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api/client';
import { COUNTRY_CODE_TO_NATIONALITY } from '@/lib/countryCodeMapper';

/**
 * Payment Success Page - Enhanced Flow
 *
 * After successful payment:
 * 1. Display voucher immediately with barcode
 * 2. Show Print and Download PDF buttons
 * 3. Show "Email Voucher" button that opens dialog for email input
 */

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]); // Changed from single voucher to array
  const [error, setError] = useState(null);

  // Email dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  const sessionId = searchParams.get('session_id');
  // Try to get payment session ID from URL first, then fallback to sessionStorage
  // Extract clean session ID without query parameters
  // Support both ?payment_session= (old) and ?session= (BSP DOKU redirect)
  const rawPaymentSessionId = searchParams.get('payment_session') || searchParams.get('session') || sessionStorage.getItem('paymentSessionId');
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

            if (response.success && response.vouchers && response.vouchers.length > 0) {
              setVouchers(response.vouchers); // Set array of all vouchers
              // Pre-fill email dialog with email from first voucher
              if (response.vouchers[0].customerEmail) {
                setEmailInput(response.vouchers[0].customerEmail);
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
          <Card className="border-emerald-200 shadow-xl">
            <CardHeader className="bg-emerald-50">
              <CardTitle className="text-emerald-800">
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium mb-2">
                  Your payment was processed successfully!
                </p>
                <p className="text-sm text-blue-700">
                  {error}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-slate-700">
                  Your voucher is being generated. This usually takes just a few seconds.
                </p>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-800 mb-2">What's happening?</p>
                  <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Payment confirmed by BSP bank</li>
                    <li>Generating your unique voucher code</li>
                    <li>Creating QR code and receipt</li>
                  </ol>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    🔄 Check Voucher Status
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full"
                  >
                    Return to Home
                  </Button>
                </div>

                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> If your voucher doesn't appear after refreshing, please contact support with your payment session ID: <code className="bg-yellow-100 px-1 rounded">{paymentSessionId}</code>
                  </p>
                </div>
              </div>
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
          <p className="text-slate-600 text-lg">
            {vouchers.length === 1 ? 'Your green fee voucher is ready' : `Your ${vouchers.length} green fee vouchers are ready`}
          </p>
        </motion.div>

        <Card className="glass-effect border-emerald-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-2xl text-emerald-800">
              {vouchers.length === 1 ? 'Voucher Details' : `${vouchers.length} Vouchers`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Display ALL Vouchers */}
            {vouchers.map((voucher, index) => {
              // Check if passport is already registered (voucher.passport.id will be non-null if registered)
              const isRegistered = voucher.passport && voucher.passport.id;

              return (
              <div key={voucher.code} className="bg-white rounded-lg p-6 border-2 border-emerald-200 space-y-4">
                {vouchers.length > 1 && (
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <span className="text-lg font-bold text-emerald-700">
                      Voucher {index + 1} of {vouchers.length}
                    </span>
                  </div>
                )}

                {/* Voucher Code + Barcode */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Voucher Code</p>
                    <p className="text-3xl font-bold text-emerald-700 tracking-wider font-mono mb-4">
                      {voucher.voucherCode || voucher.code}
                    </p>
                    {isRegistered ? (
                      <div className="mt-3 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded">
                        <p className="text-sm font-semibold text-emerald-800 mb-1">✓ Passport Registered</p>
                        <p className="text-xs text-emerald-700">
                          This voucher is ready to use. Present at the airport gate.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Registration Required</p>
                        <p className="text-xs text-red-700">
                          This voucher is NOT valid until you register your passport details.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {(voucher.qrCode || voucher.barcode) && (
                      <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                        <img
                          src={voucher.qrCode || voucher.barcode}
                          alt="Barcode"
                          className="w-full max-w-[300px] h-auto"
                        />
                        <p className="text-xs text-center text-slate-500 mt-2">
                          Present at gate after registration
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Passport Number</p>
                    <p className="font-semibold text-slate-800">
                      {voucher.passportNumber}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Amount</p>
                    <p className="font-semibold text-slate-800">K {voucher.amount || '50.00'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Valid From</p>
                    <p className="font-semibold text-slate-800">
                      {voucher.validFrom ? new Date(voucher.validFrom).toLocaleDateString() : 'Today'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Valid Until</p>
                    <p className="font-semibold text-slate-800">
                      {voucher.validUntil ? new Date(voucher.validUntil).toLocaleDateString() : '1 year'}
                    </p>
                  </div>
                </div>

                {/* Register Passport Button - ONLY show if NOT registered */}
                {!isRegistered && (
                  <div className="mt-4 pt-4 border-t-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-4 rounded-lg">
                    <div className="mb-4 text-center">
                      <p className="text-sm font-bold text-amber-900 mb-1">🔔 Important: Register Your Passport</p>
                      <p className="text-xs text-amber-800">
                        Choose to register now or save voucher for later registration
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          const registrationUrl = `${window.location.origin}/register/${voucher.voucherCode || voucher.code}`;
                          window.location.href = registrationUrl; // Navigate to registration (same tab)
                        }}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold px-3 sm:px-4"
                        size="lg"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">Register Passport Now ✓</span>
                      </Button>

                      <p className="text-xs text-center text-slate-600 italic">
                        Or save/email voucher and register later
                      </p>
                    </div>
                  </div>
                )}

                {/* Show passport details if registered */}
                {isRegistered && voucher.passport && (
                  <div className="mt-4 pt-4 border-t-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white p-4 rounded-lg">
                    <div className="mb-3 text-center">
                      <p className="text-sm font-bold text-emerald-900">✓ Passport Registered</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded p-2 border border-emerald-200">
                        <p className="text-xs text-slate-600">Passport Number</p>
                        <p className="font-semibold text-emerald-900">{voucher.passport.passportNumber}</p>
                      </div>
                      {voucher.passport.fullName && (
                        <div className="bg-white rounded p-2 border border-emerald-200">
                          <p className="text-xs text-slate-600">Full Name</p>
                          <p className="font-semibold text-emerald-900">{voucher.passport.fullName}</p>
                        </div>
                      )}
                      {voucher.passport.nationality && (
                        <div className="bg-white rounded p-2 border border-emerald-200 col-span-2">
                          <p className="text-xs text-slate-600">Nationality</p>
                          <p className="font-semibold text-emerald-900">
                            {COUNTRY_CODE_TO_NATIONALITY[voucher.passport.nationality] || voucher.passport.nationality}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })}

            {/* Instructions - Only show if ANY voucher is unregistered */}
            {vouchers.some(v => !v.passport || !v.passport.id) ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 text-lg">📋 How to Use Your Voucher:</h3>

                <div className="bg-white rounded-lg p-4 mb-3">
                  <p className="text-sm font-bold text-blue-900 mb-2">Option 1: Register Passport Now (Recommended)</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
                    <li>Click "Register Passport Now" button above</li>
                    <li>Use camera to scan passport OR enter details manually</li>
                    <li>Voucher becomes valid immediately after registration</li>
                  </ol>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-bold text-blue-900 mb-2">Option 2: Register Later</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
                    <li>Save or email this voucher for your records</li>
                    <li>Register passport details before your trip</li>
                    <li>Visit: greenpay.eywademo.cloud/register/YOUR_VOUCHER_CODE</li>
                  </ol>
                </div>

                <div className="mt-3 pt-3 border-t-2 border-red-300 bg-red-50 rounded p-3">
                  <p className="text-sm font-bold text-red-900 mb-1">⚠️ Important Warning:</p>
                  <p className="text-xs text-red-800">
                    <strong>Unregistered vouchers are NOT VALID.</strong> You must register your passport details before presenting this voucher at the gate. Registration takes 2-3 minutes and can be done now or later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 mb-3 text-lg">✓ Voucher Ready to Use</h3>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-emerald-800 mb-2">
                    Your {vouchers.length === 1 ? 'voucher is' : 'vouchers are'} fully registered and ready to use:
                  </p>
                  <ol className="text-sm text-emerald-800 space-y-1 list-decimal list-inside ml-2">
                    <li>Save or print this voucher for your records</li>
                    <li>Present the barcode at the airport departure gate</li>
                    <li>Gate staff will scan and validate your voucher</li>
                    <li>No further action required</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-4">
              <Button
                onClick={async () => {
                  try {
                    // Download PDF with ALL vouchers
                    const response = await fetch(`/api/buy-online/voucher/${paymentSessionId}/pdf`);

                    if (!response.ok) {
                      throw new Error('Failed to fetch PDF');
                    }

                    const blob = await response.blob();
                    const filename = vouchers.length === 1
                      ? `voucher-${vouchers[0].code}.pdf`
                      : `vouchers-${paymentSessionId}.pdf`;

                    // Direct download (skip share API to avoid delays)
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = filename;
                    link.style.display = 'none';

                    // For iOS: add target="_blank" as fallback
                    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                      link.target = '_blank';
                    }

                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    setTimeout(() => {
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(blobUrl);
                    }, 100);
                  } catch (err) {
                    console.error('Download failed:', err);
                    alert('Unable to download PDF automatically. Please use the "Email Voucher" option to receive your vouchers via email.');
                  }
                }}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate">
                  {vouchers.length === 1 ? 'Download PDF' : `Download All (${vouchers.length})`}
                </span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // Fetch PDF with ALL vouchers and open in print dialog
                    const response = await fetch(`/api/buy-online/voucher/${paymentSessionId}/pdf`);

                    if (!response.ok) {
                      throw new Error('Failed to fetch PDF');
                    }

                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);

                    // Open PDF in new window for printing
                    const printWindow = window.open(blobUrl, '_blank');
                    if (printWindow) {
                      printWindow.onload = () => {
                        printWindow.print();
                        // Clean up blob URL after printing
                        setTimeout(() => {
                          window.URL.revokeObjectURL(blobUrl);
                        }, 1000);
                      };
                    } else {
                      // Popup blocked - fallback to direct print using iframe
                      const iframe = document.createElement('iframe');
                      iframe.style.display = 'none';
                      iframe.src = blobUrl;
                      document.body.appendChild(iframe);

                      iframe.onload = () => {
                        iframe.contentWindow.print();
                        // Cleanup
                        setTimeout(() => {
                          document.body.removeChild(iframe);
                          window.URL.revokeObjectURL(blobUrl);
                        }, 1000);
                      };
                    }
                  } catch (err) {
                    console.error('Print failed:', err);
                    alert('Unable to print PDF. Please download the vouchers and print from your device.');
                  }
                }}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate">
                  {vouchers.length === 1 ? 'Print' : `Print All (${vouchers.length})`}
                </span>
              </Button>
              <Button
                onClick={() => setShowEmailDialog(true)}
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate">
                  {vouchers.length === 1 ? 'Email Voucher' : `Email All (${vouchers.length})`}
                </span>
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate">Return to Home</span>
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
            <DialogTitle>
              {vouchers.length === 1 ? 'Email Voucher' : `Email ${vouchers.length} Vouchers`}
            </DialogTitle>
            <DialogDescription>
              {vouchers.length === 1
                ? 'Send voucher to the email used during payment, or change to a different email'
                : `Send all ${vouchers.length} vouchers to the email used during payment, or change to a different email`
              }
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
