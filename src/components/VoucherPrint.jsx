import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

const VoucherPrint = ({ voucher, isOpen, onClose, voucherType }) => {
  const qrCanvasRef = useRef(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    if (isOpen && voucher && voucher.voucher_code && qrCanvasRef.current) {
      console.log('Generating QR code for:', voucher.voucher_code);
      setQrError(false);
      QRCode.toCanvas(
        qrCanvasRef.current,
        voucher.voucher_code,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) {
            console.error('QR Code generation error:', error);
            setQrError(true);
          } else {
            console.log('QR Code generated successfully');
          }
        }
      );
    } else {
      console.log('QR Code generation skipped:', { isOpen, hasVoucher: !!voucher, hasCode: !!voucher?.voucher_code, hasRef: !!qrCanvasRef.current });
    }
  }, [isOpen, voucher]);

  if (!voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>Print Voucher</DialogTitle>
        </DialogHeader>

        <div className="print-area">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-area, .print-area * {
                visibility: visible;
              }
              .print-area {
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

              {/* Right column - QR Code */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {qrError ? (
                  <div className="w-[200px] h-[200px] border-2 border-red-300 rounded flex items-center justify-center bg-red-50">
                    <p className="text-red-600 text-sm text-center px-4">QR Code generation failed</p>
                  </div>
                ) : (
                  <canvas ref={qrCanvasRef} className="border-2 border-gray-200 rounded"></canvas>
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
