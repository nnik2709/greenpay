import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import QRCode from 'qrcode';
import api from '@/lib/api/client';

/**
 * Public Registration Success Page
 * Shows confirmation after successful registration
 */

const PublicRegistrationSuccess = () => {
  const { voucherCode } = useParams();
  const { toast } = useToast();
  const [voucher, setVoucher] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadVoucherDetails();
  }, [voucherCode]);

  const loadVoucherDetails = async () => {
    try {
      // Fetch voucher with passport data
      const response = await api.get(`/vouchers/code/${voucherCode}`);

      if (response && response.voucher) {
        setVoucher(response.voucher);

        // Generate QR code
        const qr = await QRCode.toDataURL(voucherCode, {
          width: 300,
          margin: 2,
          color: {
            dark: '#047857',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qr);
      }
    } catch (err) {
      console.error('Error loading voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      // Create voucher image from current page content
      const voucherContent = document.getElementById('voucher-content');
      if (!voucherContent) return;

      // Use html2canvas if available, otherwise fallback to print
      if (window.html2canvas) {
        const canvas = await window.html2canvas(voucherContent);
        const link = document.createElement('a');
        link.download = `voucher-${voucherCode}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else {
        // Fallback to print dialog
        handlePrint();
      }
    } catch (error) {
      console.error('Error downloading voucher:', error);
      // Fallback to print
      handlePrint();
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

      await api.post(`/vouchers/${voucherCode}/email`, {
        recipient_email: emailAddress
      });

      toast({
        title: 'Email Sent',
        description: `Voucher has been sent to ${emailAddress}`,
        className: 'bg-green-50 border-green-200'
      });

      // Clear email field after successful send
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Email Failed',
        description: error.response?.data?.error || 'Failed to send email. Please try again.'
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
            {/* QR Code */}
            <div className="text-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Voucher QR Code" className="mx-auto" />
              )}
              <p className="mt-4 font-mono text-xl font-bold text-emerald-700">
                {voucherCode}
              </p>
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

            {/* Email Section */}
            <div className="border-t border-emerald-100 pt-4">
              <Label htmlFor="email-address" className="text-sm font-semibold text-emerald-800 mb-2 block">
                Email Voucher
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email-address"
                  type="email"
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !sendingEmail) {
                      handleEmailVoucher();
                    }
                  }}
                  className="flex-1"
                  disabled={sendingEmail}
                />
                <Button
                  onClick={handleEmailVoucher}
                  disabled={sendingEmail || !emailAddress}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sendingEmail ? 'Sending...' : 'Send'}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                The voucher will be sent as a PDF attachment
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1"
                data-testid="public-reg-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
                data-testid="public-reg-download"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
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
    </div>
  );
};

export default PublicRegistrationSuccess;
