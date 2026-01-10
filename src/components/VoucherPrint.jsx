import React, { useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

const VoucherPrint = ({ voucher, isOpen, onClose, voucherType }) => {
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');

  useEffect(() => {
    if (isOpen && voucher && voucher.voucher_code) {
      console.log('Generating barcode for:', voucher.voucher_code);
      setBarcodeDataUrl('');

      // Generate Barcode (CODE-128) - LARGER for easier scanning
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, voucher.voucher_code, {
          format: 'CODE128',
          width: 5,        // Increased from 3 to 5
          height: 120,     // Increased from 80 to 120
          displayValue: false, // We'll show the code separately
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

  if (!voucher) return null;

  // Registration URL
  const registrationUrl = `https://pnggreenfees.gov.pg/voucher/register/${voucher.voucher_code}`;

  // Show authorized officer only if voucher was issued at desk/corporate (has created_by_name)
  const showAuthorizingOfficer = voucher.created_by_name && voucher.created_by_name !== 'AUTHORIZED OFFICER';
  const authorizingOfficer = voucher.created_by_name;

  // Get passport info (from registration or individual purchase)
  const passportNumber = voucher.passport_number || null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const now = new Date();
    const generatedOn = `${now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}, ${now.toLocaleTimeString()}`;

    const voucherHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Green Card - ${voucher.voucher_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            background: #ffffff;
            padding: 30px 20px;
          }
          .page {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            padding: 36px 48px 56px 48px;
          }
          .header-logos {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 12px;
          }
          .logo-image {
            width: 110px;
            height: 110px;
            object-fit: contain;
          }
          h1.title {
            text-align: center;
            color: #2d8a34;
            font-size: 28px;
            margin: 12px 0 6px 0;
            letter-spacing: 1px;
          }
          .divider {
            height: 3px;
            background: #2d8a34;
            width: 100%;
            margin: 12px 0 20px 0;
          }
          .subtitle {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 26px;
          }
          .row {
            display: flex;
            justify-content: center;
            gap: 8px;
            font-size: 18px;
            margin-bottom: 32px;
          }
          .label {
            font-weight: bold;
          }
          .barcode-block {
            text-align: center;
            margin: 6px 0 18px 0;
          }
          .barcode-img {
            display: block;
            margin: 0 auto 10px auto;
          }
          .barcode-code {
            font-size: 16px;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
          }
          .register {
            text-align: center;
            font-size: 18px;
            margin-top: 12px;
            font-weight: bold;
          }
          .link {
            text-align: center;
            font-size: 10px;
            margin-top: 8px;
            color: #444;
            word-break: break-all;
          }
          .footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #444;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header-logos">
            <img src="/assets/logos/ccda-logo.png" alt="CCDA Logo" class="logo-image" />
          </div>
          <h1 class="title">GREEN CARD</h1>
          <div class="divider"></div>
          <div class="subtitle">Foreign Passport Holder</div>
          <div class="row">
            <span class="label">Coupon Number:</span>
            <span>${voucher.voucher_code}</span>
          </div>
          ${passportNumber ? `
            <div class="row" style="margin-bottom: 16px;">
              <span class="label">Registered Passport:</span>
              <span>${passportNumber}</span>
            </div>
          ` : ''}
          <div class="barcode-block">
            ${barcodeDataUrl ? `<img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode" />` : ''}
          </div>
          ${!passportNumber ? `
            <div class="register">Scan to Register</div>
            <div class="link">${registrationUrl}</div>
          ` : ''}
          <div class="footer">
            <div></div>
            <div>Generated on ${generatedOn}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(voucherHTML);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>Print Green Card Voucher</DialogTitle>
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
          <div className="voucher-printable bg-white p-12 rounded-lg border-2 border-gray-300">

            {/* Logo - Centered CCDA only */}
            <div className="flex justify-center items-center mb-10">
              <img
                src="/assets/logos/ccda-logo.png"
                alt="CCDA Logo"
                className="w-28 h-28 object-contain"
              />
            </div>

            {/* Title */}
            <div className="text-center mb-3">
              <h1 className="text-5xl font-bold text-green-600 tracking-widest">GREEN CARD</h1>
            </div>
            <div className="w-full h-1 bg-green-600 mb-8"></div>

            {/* Subtitle */}
            <div className="text-center mb-10">
              <p className="text-2xl font-bold text-black">Foreign Passport Holder</p>
            </div>

            {/* Coupon Number */}
            <div className="flex justify-between items-baseline px-4 mb-12">
              <span className="text-xl font-bold text-black">Coupon Number:</span>
              <span className="text-2xl font-bold text-black tracking-wider">{voucher.voucher_code}</span>
            </div>

            {/* Passport Info (if registered) */}
            {passportNumber && (
              <div className="text-center mb-8 p-5 bg-gray-50 border-2 border-green-600 rounded-lg">
                <p className="text-sm font-bold text-gray-600 mb-2">REGISTERED PASSPORT</p>
                <p className="text-2xl font-bold text-black tracking-widest font-mono">{passportNumber}</p>
              </div>
            )}

            {/* Barcode - BIGGER for easier scanning */}
            <div className="text-center my-12">
              {barcodeDataUrl ? (
                <img src={barcodeDataUrl} alt="Barcode" className="mx-auto max-w-2xl w-full" />
              ) : (
                <div className="w-full h-32 border-2 border-gray-300 rounded flex items-center justify-center bg-gray-50">
                  <p className="text-gray-500 text-sm">Generating Barcode...</p>
                </div>
              )}

              {/* Show registration link if passport not yet registered */}
              {!passportNumber && (
                <>
                  <p className="text-xl font-medium text-black mt-6 mb-4">Scan to Register</p>
                  <p className="text-sm text-gray-600">{registrationUrl}</p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-16">
              <div className="w-full h-px bg-gray-400 mb-6"></div>
              <div className="flex justify-between items-end">
                {showAuthorizingOfficer ? (
                  <div className="text-left">
                    <p className="text-sm font-bold text-black uppercase">{authorizingOfficer}</p>
                    <p className="text-xs text-gray-600 mt-1">Authorizing Officer</p>
                  </div>
                ) : (
                  <div></div>
                )}
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    Generated on {new Date(voucher.created_at || voucher.issued_date || new Date()).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="flex justify-end gap-2 mt-4 no-print">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            <Printer className="mr-2 h-4 w-4" />
            Print Voucher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherPrint;
