import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

const VoucherPrint = ({ voucher, isOpen, onClose, voucherType }) => {
  const [qrError, setQrError] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');
  const barcodeCanvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && voucher && voucher.voucher_code) {
      console.log('Generating QR code and barcode for:', voucher.voucher_code);
      setQrError(false);
      setQrDataUrl('');
      setBarcodeDataUrl('');

      // Generate QR Code
      QRCode.toDataURL(
        voucher.voucher_code,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        },
        (error, url) => {
          if (error) {
            console.error('QR Code generation error:', error);
            setQrError(true);
          } else {
            console.log('QR Code generated successfully');
            setQrDataUrl(url);
          }
        }
      );

      // Generate Barcode (CODE-128)
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, voucher.voucher_code, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
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
    } else {
      console.log('QR Code and barcode generation skipped:', { isOpen, hasVoucher: !!voucher, hasCode: !!voucher?.voucher_code });
    }
  }, [isOpen, voucher]);

  if (!voucher) return null;

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const voucherHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Voucher - ${voucher.voucher_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .voucher { max-width: 800px; margin: 0 auto; border: 2px solid #ccc; padding: 40px; }
          .header { text-align: center; border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 32px; color: #10b981; margin-bottom: 5px; }
          .header p { font-size: 16px; color: #666; }
          .content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-section { display: flex; flex-direction: column; gap: 15px; }
          .info-box { background: #f9fafb; padding: 12px; border-radius: 5px; }
          .info-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 18px; font-weight: bold; color: #111; }
          .qr-section { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; }
          .qr-section img { border: 2px solid #ddd; border-radius: 5px; }
          .voucher-code { font-size: 24px; font-weight: bold; color: #10b981; font-family: 'Courier New', monospace; letter-spacing: 2px; word-break: break-all; text-align: center; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 20px; font-size: 14px; font-weight: bold; margin-top: 10px; }
          .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
          .footer p { margin-bottom: 8px; }
          @media print {
            body { padding: 0; }
            .voucher { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          <div class="header">
            <h1>🌿 PNG Green Fees</h1>
            <p>Environmental Exit Voucher</p>
          </div>

          <div class="content">
            <div class="info-section">
              <div class="info-box">
                <div class="info-label">Voucher Type</div>
                <div class="info-value">${voucherType}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Passport Number</div>
                <div class="info-value">${voucher.passport_number}</div>
              </div>
              ${voucher.company_name ? `
              <div class="info-box">
                <div class="info-label">Company Name</div>
                <div class="info-value">${voucher.company_name}</div>
              </div>
              ` : ''}
              <div class="info-box">
                <div class="info-label">Valid Until</div>
                <div class="info-value">${new Date(voucher.valid_until).toLocaleDateString()}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Amount</div>
                <div class="info-value">PGK ${voucher.amount}</div>
              </div>
            </div>

            <div class="qr-section">
              <img src="${qrDataUrl}" alt="QR Code" width="200" height="200" />
              ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode" style="margin-top: 10px;" />` : ''}
              <div class="voucher-code">${voucher.voucher_code}</div>
              <span class="status-badge">✓ VALID</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Instructions:</strong> Present this voucher at the airport exit. Scan the QR code or enter the code manually for validation.</p>
            <p>Issued by Papua New Guinea Department of Environment</p>
            <p>Payment Method: ${voucher.payment_method} | Issued: ${new Date(voucher.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(voucherHTML);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>Print Voucher</DialogTitle>
        </DialogHeader>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .voucher-printable,
            .voucher-printable * {
              visibility: visible;
            }
            .voucher-printable {
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

        <div className="print-area">

          <div className="voucher-printable bg-white p-8 rounded-lg border-2 border-gray-200">
            {/* Header */}
            <div className="text-center border-b-4 border-green-600 pb-6 mb-6">
              <h1 className="text-4xl font-bold text-green-600 mb-2">🌿 PNG Green Fees</h1>
              <p className="text-lg text-gray-600">Environmental Exit Voucher</p>
            </div>

            {/* Body - Two columns */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              {/* Left column - Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 uppercase mb-1">Voucher Type</div>
                  <div className="text-lg font-bold text-gray-900">{voucherType}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 uppercase mb-1">Passport Number</div>
                  <div className="text-lg font-bold text-gray-900">{voucher.passport_number}</div>
                </div>

                {voucher.company_name && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-500 uppercase mb-1">Company Name</div>
                    <div className="text-lg font-bold text-gray-900">{voucher.company_name}</div>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 uppercase mb-1">Valid Until</div>
                  <div className="text-lg font-bold text-gray-900">
                    {new Date(voucher.valid_until).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 uppercase mb-1">Amount</div>
                  <div className="text-lg font-bold text-gray-900">PGK {voucher.amount}</div>
                </div>
              </div>

              {/* Right column - QR Code and Barcode */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {qrError ? (
                  <div className="w-[200px] h-[200px] border-2 border-red-300 rounded flex items-center justify-center bg-red-50">
                    <p className="text-red-600 text-sm text-center px-4">QR Code generation failed</p>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-[200px] h-[200px] border-2 border-gray-200 rounded" />
                ) : (
                  <div className="w-[200px] h-[200px] border-2 border-gray-300 rounded flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500 text-sm">Generating QR Code...</p>
                  </div>
                )}

                {/* Barcode */}
                {barcodeDataUrl && (
                  <div className="mt-2">
                    <img src={barcodeDataUrl} alt="Barcode" className="border border-gray-200 rounded" />
                  </div>
                )}

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 font-mono tracking-wider break-all">
                    {voucher.voucher_code}
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold">
                      ✓ VALID
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-4 text-center text-sm text-gray-600">
              <p className="mb-2">
                <strong>Instructions:</strong> Present this voucher at the airport exit.
                Scan the QR code or enter the code manually for validation.
              </p>
              <p className="mb-1">Issued by Papua New Guinea Department of Environment</p>
              <p className="text-xs">Payment Method: {voucher.payment_method} |
                Issued: {new Date(voucher.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="flex justify-end gap-2 mt-4 no-print">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Voucher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherPrint;
