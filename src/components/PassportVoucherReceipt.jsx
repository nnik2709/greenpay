import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

/**
 * PassportVoucherReceipt Component
 * Laravel template-inspired voucher receipt for passport-linked vouchers
 * Features "GREEN CARD" branding with both QR code and barcode
 */
const PassportVoucherReceipt = ({ voucher, passport, isOpen, onClose }) => {
  const [qrError, setQrError] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');

  useEffect(() => {
    if (isOpen && voucher && voucher.voucher_code) {
      console.log('Generating barcode for passport voucher:', voucher.voucher_code);
      setBarcodeDataUrl('');

      // Generate Barcode (CODE-128)
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, voucher.voucher_code, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        });
        const barcodeUrl = canvas.toDataURL('image/png');
        setBarcodeDataUrl(barcodeUrl);
        console.log('Barcode generated successfully');
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, [isOpen, voucher]);

  if (!voucher || !passport) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Green Card - ${voucher.voucher_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            background: white;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 3px solid #2c5530;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2c5530;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            color: #2c5530;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .header .subtitle {
            font-size: 14px;
            color: #136a42;
            font-weight: 600;
            text-transform: uppercase;
          }
          .content {
            text-align: center;
            margin-bottom: 20px;
          }
          .field {
            background: #f0f4f0;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #2c5530;
          }
          .field-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
            font-weight: bold;
          }
          .field-value {
            font-size: 16px;
            font-weight: bold;
            color: #111;
          }
          .codes-section {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #fafafa;
            border: 2px dashed #2c5530;
          }
          .codes-section img {
            margin: 10px auto;
            display: block;
          }
          .voucher-code {
            font-size: 18px;
            font-weight: bold;
            color: #2c5530;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            margin: 10px 0;
          }
          .qr-label {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
          }
          .footer {
            border-top: 2px solid #e5e7eb;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 20px;
          }
          .footer p { margin: 5px 0; }
          @media print {
            body { padding: 0; }
            .receipt { border: 2px solid #2c5530; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>🌿 GREEN CARD</h1>
            <div class="subtitle">Foreign Passport Holder</div>
          </div>

          <div class="content">
            <div class="field">
              <div class="field-label">Travel Document Number</div>
              <div class="field-value">${passport.passport_number || 'N/A'}</div>
            </div>

            <div class="field">
              <div class="field-label">Full Name</div>
              <div class="field-value">${passport.given_name || ''} ${passport.surname || ''}</div>
            </div>

            <div class="field">
              <div class="field-label">Nationality</div>
              <div class="field-value">${passport.nationality || 'N/A'}</div>
            </div>

            <div class="field">
              <div class="field-label">Date of Birth</div>
              <div class="field-value">${passport.dob ? new Date(passport.dob).toLocaleDateString() : 'N/A'}</div>
            </div>

            <div class="codes-section">
              ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode" style="border: 2px solid #ddd; padding: 8px; background: white; border-radius: 5px;" />` : '<p style="color: #999; font-size: 12px;">Barcode not available</p>'}

              <div class="voucher-code">Coupon: ${voucher.voucher_code}</div>
            </div>
          </div>

          <div class="footer">
            <p><strong>PNG Green Fees System</strong></p>
            <p>Climate Change & Development Authority</p>
            <p>Valid Until: ${voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString() : 'N/A'}</p>
            <p>Amount: PGK ${voucher.amount || '0.00'}</p>
            <p style="margin-top: 10px; font-size: 9px;">Issued: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>Passport Voucher Receipt</DialogTitle>
        </DialogHeader>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-printable,
            .receipt-printable * {
              visibility: visible;
            }
            .receipt-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="receipt-printable bg-white p-6 rounded-lg border-4 border-green-800 max-w-md mx-auto">
          {/* Header */}
          <div className="text-center border-b-4 border-green-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-green-800 mb-1 tracking-wider">🌿 GREEN CARD</h1>
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Foreign Passport Holder</p>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-6">
            <div className="bg-green-50 p-3 border-l-4 border-green-800">
              <div className="text-xs text-gray-600 uppercase font-bold mb-1">Travel Document Number</div>
              <div className="text-base font-bold text-gray-900">{passport.passport_number || 'N/A'}</div>
            </div>

            <div className="bg-green-50 p-3 border-l-4 border-green-800">
              <div className="text-xs text-gray-600 uppercase font-bold mb-1">Full Name</div>
              <div className="text-base font-bold text-gray-900">
                {passport.given_name || ''} {passport.surname || ''}
              </div>
            </div>

            <div className="bg-green-50 p-3 border-l-4 border-green-800">
              <div className="text-xs text-gray-600 uppercase font-bold mb-1">Nationality</div>
              <div className="text-base font-bold text-gray-900">{passport.nationality || 'N/A'}</div>
            </div>

            <div className="bg-green-50 p-3 border-l-4 border-green-800">
              <div className="text-xs text-gray-600 uppercase font-bold mb-1">Date of Birth</div>
              <div className="text-base font-bold text-gray-900">
                {passport.dob ? new Date(passport.dob).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Codes Section */}
          <div className="text-center bg-gray-50 p-4 border-2 border-dashed border-green-800 rounded-lg">
            {/* Barcode */}
            {barcodeDataUrl ? (
              <div className="mb-3">
                <img src={barcodeDataUrl} alt="Barcode" className="mx-auto border-2 border-gray-200 rounded p-2 bg-white" />
              </div>
            ) : (
              <div className="w-full h-[80px] border-2 border-gray-300 rounded flex items-center justify-center bg-white mb-3">
                <p className="text-gray-500 text-xs">Generating Barcode...</p>
              </div>
            )}

            {/* Voucher Code */}
            <div className="text-lg font-bold text-green-800 font-mono tracking-wider my-3">
              Coupon: {voucher.voucher_code}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-4 mt-6 text-center text-xs text-gray-600">
            <p className="font-bold text-sm mb-1">PNG Green Fees System</p>
            <p className="mb-1">Climate Change & Development Authority</p>
            <p className="mb-1">Valid Until: {voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString() : 'N/A'}</p>
            <p className="mb-2">Amount: PGK {voucher.amount || '0.00'}</p>
            <p className="text-[10px] text-gray-500 mt-3">Issued: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Print button */}
        <div className="flex justify-end gap-2 mt-4 no-print">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-green-800 hover:bg-green-900">
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PassportVoucherReceipt;
