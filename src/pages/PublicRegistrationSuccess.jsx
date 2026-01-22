import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import JsBarcode from 'jsbarcode';
import api from '@/lib/api/client';

/**
 * Public Registration Success Page
 * Shows confirmation after successful registration
 */

const PublicRegistrationSuccess = () => {
  const { voucherCode } = useParams();
  const { toast } = useToast();
  const [voucher, setVoucher] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadVoucherDetails();
  }, [voucherCode]);

  const loadVoucherDetails = async () => {
    try {
      // Fetch voucher with passport data using PUBLIC endpoint (no auth required)
      const response = await fetch(`/api/public-purchases/voucher/${voucherCode}`);
      const data = await response.json();

      if (response.ok && data.voucher) {
        setVoucher(data.voucher);

        // Generate barcode (like PDF)
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, voucherCode, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: false,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        });
        setBarcodeUrl(canvas.toDataURL('image/png'));
      } else {
        console.error('Failed to load voucher:', data.error);
      }
    } catch (err) {
      console.error('Error loading voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      // Fetch PDF from backend and open in new window for printing
      const response = await fetch(`/api/public-purchases/voucher/${voucherCode}/pdf`);

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
    } catch (error) {
      console.error('Print failed:', error);
      toast({
        variant: 'destructive',
        title: 'Print Failed',
        description: 'Unable to print PDF. Please try downloading instead.'
      });
    }
  };

  const handleDownload = async () => {
    try {
      // Download PDF from backend
      const response = await fetch(`/api/public-purchases/voucher/${voucherCode}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const filename = `voucher-${voucherCode}.pdf`;

      // Direct download
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
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Unable to download PDF. Please try the email option.'
      });
    }
  };

  const handleEmailVoucher = async () => {
    // Validate email
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address'
      });
      return;
    }

    try {
      setSendingEmail(true);

      // Use PUBLIC endpoint (no auth required)
      const response = await fetch(`/api/public-purchases/voucher/${voucherCode}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_email: emailAddress
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: `Voucher has been sent to ${emailAddress}`,
        className: 'bg-green-50 border-green-200'
      });

      // Close dialog and clear email field
      setShowEmailDialog(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Email Failed',
        description: error.message || 'Failed to send email. Please try again.'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Registration Successful
          </h1>
          <p className="text-slate-600 text-lg">
            Your passport has been successfully registered with your exit pass voucher.
          </p>
        </div>

        <Card id="voucher-content" className="border-emerald-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 text-center">
            <CardTitle className="text-2xl">Exit Pass Voucher</CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Barcode - matches PDF layout */}
            <div className="text-center">
              <p className="mb-4 font-mono text-2xl font-bold text-emerald-700">
                {voucherCode}
              </p>
              {barcodeUrl && (
                <img src={barcodeUrl} alt="Voucher Barcode" className="mx-auto max-w-md" />
              )}
            </div>

            {/* Voucher Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Passport Number:</p>
                <p className="font-semibold">{voucher?.passport_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500">Value:</p>
                <p className="font-semibold">PGK {voucher?.amount || 50}.00</p>
              </div>
              <div>
                <p className="text-slate-500">Valid From:</p>
                <p className="font-semibold">
                  {voucher?.valid_from ? new Date(voucher.valid_from).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Valid Until:</p>
                <p className="font-semibold">
                  {voucher?.valid_until ? new Date(voucher.valid_until).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Passenger Details */}
            {voucher?.passport && (
              <div className="border-t border-emerald-100 pt-4">
                <h3 className="font-semibold text-emerald-800 mb-3">Passenger Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Name:</p>
                    <p className="font-semibold">{voucher.passport.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Nationality:</p>
                    <p className="font-semibold">{voucher.passport.nationality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date of Birth:</p>
                    <p className="font-semibold">
                      {voucher.passport.date_of_birth
                        ? new Date(voucher.passport.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Passport Expiry:</p>
                    <p className="font-semibold">
                      {voucher.passport.expiry_date
                        ? new Date(voucher.passport.expiry_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Important Instructions:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Keep this voucher safe until your departure</li>
                  <li>Present this voucher (printed or on mobile) at the airport</li>
                  <li>Have your passport ready for verification</li>
                  <li>This voucher is valid until {voucher?.valid_until ? new Date(voucher.valid_until).toLocaleDateString() : 'the expiry date'}</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons - 2x2 Grid like PaymentSuccess */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                data-testid="public-reg-download"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                data-testid="public-reg-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={() => setShowEmailDialog(true)}
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Voucher
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            If you have any questions, please contact PNG Green Fees support.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            © 2025 PNG Green Fees System. All rights reserved.
          </p>
        </div>
      </motion.div>

      {/* Email Dialog - Matches PaymentSuccess pattern */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Voucher</DialogTitle>
            <DialogDescription>
              Send your voucher as a PDF attachment to any email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !sendingEmail) {
                    handleEmailVoucher();
                  }
                }}
                disabled={sendingEmail}
              />
              <p className="text-xs text-slate-500">
                The voucher will be sent as a PDF attachment
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowEmailDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEmailVoucher}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={sendingEmail || !emailAddress}
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicRegistrationSuccess;
