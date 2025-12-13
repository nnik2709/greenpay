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
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const voucherHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Green Card - ${voucher.voucher_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            background: #f5f5f5;
            padding: 40px 20px;
          }
          .page {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            padding: 60px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }

          /* Header with logos */
          .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 100px;
            margin-bottom: 40px;
          }
          .logo-image {
            width: 120px;
            height: 120px;
            object-fit: contain;
          }
          .logo-placeholder {
            width: 120px;
            height: 120px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #999;
            text-align: center;
            border-radius: 50%;
          }

          /* Title */
          .title {
            text-align: center;
            margin-bottom: 10px;
          }
          .title h1 {
            font-size: 42px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 3px;
            margin-bottom: 5px;
          }
          .title-underline {
            width: 100%;
            height: 3px;
            background: #4CAF50;
            margin: 15px 0 25px 0;
          }

          /* Subtitle */
          .subtitle {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            color: #000;
            margin-bottom: 40px;
          }

          /* Coupon number */
          .coupon-number {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 40px;
            padding: 0 20px;
          }
          .coupon-label {
            font-size: 18px;
            font-weight: bold;
            color: #000;
          }
          .coupon-value {
            font-size: 22px;
            font-weight: bold;
            color: #000;
            letter-spacing: 2px;
          }

          /* Passport Info */
          .passport-info {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border: 2px solid #4CAF50;
            border-radius: 8px;
          }
          .passport-label {
            font-size: 14px;
            color: #666;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .passport-value {
            font-size: 20px;
            color: #000;
            font-weight: bold;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
          }

          /* Barcode section */
          .barcode-section {
            text-align: center;
            margin: 50px 0;
          }
          .barcode-section img {
            max-width: 600px;
            height: auto;
            margin: 0 auto 20px auto;
          }
          .scan-instruction {
            font-size: 18px;
            font-weight: 500;
            color: #000;
            margin-top: 20px;
            margin-bottom: 15px;
          }
          .registration-url {
            font-size: 13px;
            color: #666;
            margin-top: 10px;
          }

          /* Footer */
          .footer-line {
            width: 100%;
            height: 1px;
            background: #ccc;
            margin: 60px 0 25px 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .officer-info {
            text-align: left;
          }
          .officer-name {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
          }
          .officer-title {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
          }
          .generation-info {
            text-align: right;
            font-size: 11px;
            color: #666;
          }

          @media print {
            body {
              padding: 0;
              background: white;
            }
            .page {
              box-shadow: none;
              padding: 40px;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Logos -->
          <div class="logos">
            <img src="https://ccda.gov.pg/wp-content/uploads/2025/01/ccda-logo.jpeg" alt="CCDA Logo" class="logo-image" />
            <div class="logo-placeholder">National Emblem</div>
          </div>

          <!-- Title -->
          <div class="title">
            <h1>GREEN CARD</h1>
          </div>
          <div class="title-underline"></div>

          <!-- Subtitle -->
          <div class="subtitle">Foreign Passport Holder</div>

          <!-- Coupon Number -->
          <div class="coupon-number">
            <span class="coupon-label">Coupon Number:</span>
            <span class="coupon-value">${voucher.voucher_code}</span>
          </div>

          <!-- Passport Info (if registered) -->
          ${passportNumber ? `
          <div class="passport-info">
            <div class="passport-label">REGISTERED PASSPORT</div>
            <div class="passport-value">${passportNumber}</div>
          </div>
          ` : ''}

          <!-- Barcode -->
          <div class="barcode-section">
            ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode" />` : '<p style="color: #999;">Barcode not available</p>'}
            <div class="scan-instruction">Scan to Register</div>
            <div class="registration-url">${registrationUrl}</div>
          </div>

          <!-- Footer -->
          <div class="footer-line"></div>
          <div class="footer">
            ${showAuthorizingOfficer ? `
            <div class="officer-info">
              <div class="officer-name">${authorizingOfficer}</div>
              <div class="officer-title">Authorizing Officer</div>
            </div>
            ` : '<div></div>'}
            <div class="generation-info">
              Generated on ${new Date(voucher.created_at || voucher.issued_date || new Date()).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
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

            {/* Logos */}
            <div className="flex justify-center items-center gap-24 mb-10">
              <img
                src="https://ccda.gov.pg/wp-content/uploads/2025/01/ccda-logo.jpeg"
                alt="CCDA Logo"
                className="w-28 h-28 object-contain"
              />
              <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-xs text-gray-400 text-center">
                National<br/>Emblem
              </div>
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
              <p className="text-xl font-medium text-black mt-6 mb-4">Scan to Register</p>
              <p className="text-sm text-gray-600">{registrationUrl}</p>
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
