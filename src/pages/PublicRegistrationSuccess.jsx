import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCode from 'qrcode';

/**
 * Public Registration Success Page
 * Shows confirmation after successful registration
 */

const PublicRegistrationSuccess = () => {
  const { voucherCode } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoucherDetails();
  }, [voucherCode]);

  const loadVoucherDetails = async () => {
    try {
      // Try individual purchases first
      let { data, error } = await supabase
        .from('individual_purchases')
        .select('*, passports(*)')
        .eq('voucher_code', voucherCode)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Try corporate vouchers
        const result = await supabase
          .from('corporate_vouchers')
          .select('*, passports(*)')
          .eq('voucher_code', voucherCode)
          .maybeSingle();

        if (result.error) throw result.error;
        data = result.data;
      }

      setVoucher(data);

      // Generate QR code
      if (data) {
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
    // Create a simple voucher document
    const printContent = document.getElementById('voucher-content');
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Voucher</title>');
      printWindow.document.write('<style>body{font-family:Arial;padding:20px;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
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
            <div className="text-8xl mb-4">✓</div>
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Registration Successful!
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
                <p className="font-semibold">{voucher?.passport_number}</p>
              </div>
              <div>
                <p className="text-slate-500">Value:</p>
                <p className="font-semibold">PGK {voucher?.amount || 50}.00</p>
              </div>
              <div>
                <p className="text-slate-500">Valid From:</p>
                <p className="font-semibold">{new Date(voucher?.valid_from).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Valid Until:</p>
                <p className="font-semibold">{new Date(voucher?.valid_until).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Passenger Details */}
            {voucher?.passports && (
              <div className="border-t border-emerald-100 pt-4">
                <h3 className="font-semibold text-emerald-800 mb-3">Passenger Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Name:</p>
                    <p className="font-semibold">
                      {voucher.passports.given_name} {voucher.passports.surname}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Nationality:</p>
                    <p className="font-semibold">{voucher.passports.nationality}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date of Birth:</p>
                    <p className="font-semibold">
                      {new Date(voucher.passports.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sex:</p>
                    <p className="font-semibold">{voucher.passports.sex}</p>
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
                  <li>This voucher is valid until {new Date(voucher?.valid_until).toLocaleDateString()}</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1"
                data-testid="public-reg-print"
              >
                🖨️ Print Voucher
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                data-testid="public-reg-download"
              >
                📥 Download
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

