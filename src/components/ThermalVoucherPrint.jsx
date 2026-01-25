import React, { useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { getRegistrationUrl } from '@/config/urls';

const ThermalVoucherPrint = ({ voucher, isOpen, onClose }) => {
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');

  useEffect(() => {
    if (isOpen && voucher && voucher.voucher_code) {
      console.log('Generating barcode for thermal receipt:', voucher.voucher_code);
      setBarcodeDataUrl('');

      // Generate Barcode (CODE-128)
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, voucher.voucher_code, {
          format: 'CODE128',
          width: 3,
          height: 80,
          displayValue: false,
          margin: 5,
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
  const registrationUrl = getRegistrationUrl(voucher.voucher_code);

  // Get passport info
  const passportNumber = voucher.passport_number || null;
  const hasPassport = passportNumber &&
                     passportNumber !== 'PENDING' &&
                     passportNumber !== 'pending' &&
                     String(passportNumber).trim() !== '';

  const handlePrint = () => {
    window.print();
  };

  const amount = parseFloat(voucher.amount) || 50.00;
  const paymentMode = voucher.payment_mode || voucher.payment_method || 'CARD';
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  const timeStr = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const agentName = voucher.created_by_name || 'Agent';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader className="no-print">
          <DialogTitle>Print Thermal Receipt</DialogTitle>
        </DialogHeader>

        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }

            body * {
              visibility: hidden;
            }

            .thermal-printable,
            .thermal-printable * {
              visibility: visible;
            }

            .thermal-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              margin: 0;
              padding: 8px;
            }

            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="thermal-printable" style={{ width: '80mm', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <img
              src="/assets/logos/ccda-logo.png"
              alt="CCDA Logo"
              style={{ width: '90%', maxHeight: '35px', objectFit: 'contain' }}
            />
          </div>

          {/* GREEN CARD Title */}
          <div style={{
            backgroundColor: '#2d5016',
            padding: '6px 0',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: 0,
              letterSpacing: '1px'
            }}>GREEN CARD</h1>
          </div>

          {/* Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', margin: 0 }}>Foreign Passport Holder</p>
          </div>

          {/* Travel Document */}
          {hasPassport && (
            <div style={{ marginBottom: '10px', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold' }}>Travel Document</div>
              <div>Number              {passportNumber}</div>
            </div>
          )}

          {/* Voucher Details */}
          <div style={{ fontSize: '11px', marginBottom: '10px' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>Coupon Number  </span>
              <span>{voucher.voucher_code}</span>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>Bill Amount              </span>
              <span>K{amount.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Payment Mode      </span>
              <span>{paymentMode}</span>
            </div>
          </div>

          {/* Barcode */}
          <div style={{ textAlign: 'center', margin: '12px 0' }}>
            {barcodeDataUrl ? (
              <img src={barcodeDataUrl} alt="Barcode" style={{ width: '95%', maxWidth: '100%' }} />
            ) : (
              <div style={{
                padding: '20px',
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                fontSize: '10px'
              }}>
                Generating Barcode...
              </div>
            )}
          </div>

          {/* Registration info (if not registered) */}
          {!hasPassport && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                REGISTER YOUR PASSPORT
              </div>
              <div style={{ fontSize: '9px', marginBottom: '4px' }}>
                Scan barcode or visit:
              </div>
              <div style={{ fontSize: '8px', wordBreak: 'break-all' }}>
                {registrationUrl}
              </div>
            </div>
          )}

          {/* Separator */}
          <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

          {/* Footer */}
          <div style={{ fontSize: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>GENERAL</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>COUNTER</div>
            <div style={{ marginBottom: '4px' }}>Agent:</div>
            <div style={{ marginBottom: '10px' }}>{agentName}</div>
          </div>

          {/* Organization info */}
          <div style={{ fontSize: '7px', textAlign: 'center', color: '#444' }}>
            <div style={{ marginBottom: '4px' }}>Climate Change & Development Authority</div>
            <div>png.greenfees@ccda.gov.pg</div>
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
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThermalVoucherPrint;
