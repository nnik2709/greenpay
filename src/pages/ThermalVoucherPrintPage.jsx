import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import JsBarcode from 'jsbarcode';
import { getRegistrationUrl } from '@/config/urls';

/**
 * Thermal Voucher Print Page - Optimized for 80mm thermal printers
 * Prints multiple vouchers sequentially
 */
const ThermalVoucherPrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barcodes, setBarcodes] = useState({});

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const codes = searchParams.get('codes');
        if (!codes) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No voucher codes provided'
          });
          navigate('/app/passports/create');
          return;
        }

        const voucherCodes = codes.split(',');
        const voucherPromises = voucherCodes.map(code =>
          api.get(`/vouchers/code/${code.trim()}`)
        );

        const results = await Promise.all(voucherPromises);
        setVouchers(results.map(r => r.voucher));

        // Generate barcodes
        const newBarcodes = {};
        results.forEach(r => {
          const voucherCode = r.voucher.voucher_code;
          try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, voucherCode, {
              format: 'CODE128',
              width: 3,
              height: 80,
              displayValue: false,
              margin: 5,
              background: '#ffffff',
              lineColor: '#000000'
            });
            newBarcodes[voucherCode] = canvas.toDataURL('image/png');
          } catch (error) {
            console.error('Barcode generation error for', voucherCode, error);
          }
        });
        setBarcodes(newBarcodes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load vouchers'
        });
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [searchParams, navigate, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleViewRegularVouchers = () => {
    // Navigate to regular voucher print page (A4/Letter format)
    const codes = vouchers.map(v => v.voucher_code).join(',');
    window.open(`/app/voucher-print?codes=${codes}`, '_blank');
  };

  const handleBack = () => {
    // Check if we came from Individual Purchase by checking session storage
    const hasIndividualPurchaseState = sessionStorage.getItem('individualPurchaseStep');

    if (hasIndividualPurchaseState === 'completion') {
      // Set flag so IndividualPurchase knows we're coming from print page
      sessionStorage.setItem('fromPrintPage', 'true');
      // Navigate back to Individual Purchase completion page
      navigate(-1);
    } else {
      // Otherwise go to vouchers list or passports create
      navigate('/app/vouchers-list');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading vouchers...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .thermal-voucher {
            page-break-after: always;
            width: 80mm;
            margin: 0;
            padding: 8px;
            font-family: Arial, sans-serif;
          }

          .thermal-voucher:last-child {
            page-break-after: auto;
          }
        }

        @media screen {
          .thermal-voucher {
            width: 80mm;
            margin: 0 auto 20px auto;
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-family: Arial, sans-serif;
          }
        }
      `}</style>

      <div className="container mx-auto p-6 no-print">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-2">
            <Printer className="inline w-5 h-5 mr-2" />
            Print {vouchers.length} Thermal Receipt{vouchers.length > 1 ? 's' : ''}
          </h2>
          <p className="text-sm text-blue-800">
            {vouchers.length} voucher{vouchers.length > 1 ? 's' : ''} loaded and ready to print
          </p>
          <p className="text-sm text-blue-600">Optimized for 80mm thermal POS printers</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            <Printer className="w-4 h-4 mr-2" />
            Print Thermal
          </Button>
          <Button variant="outline" onClick={handleViewRegularVouchers}>
            <FileText className="w-4 h-4 mr-2" />
            View Regular Vouchers (A4)
          </Button>
        </div>

        <div className="text-sm text-gray-600 mb-4">Preview:</div>
      </div>

      {/* Thermal Receipts */}
      <div className="print-container">
        {vouchers.map((voucher, index) => {
          const registrationUrl = getRegistrationUrl(voucher.voucher_code);
          const passportNumber = voucher.passport_number || null;
          const hasPassport = passportNumber &&
                             passportNumber !== 'PENDING' &&
                             passportNumber !== 'pending' &&
                             String(passportNumber).trim() !== '';
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
            <div key={voucher.voucher_code} className="thermal-voucher">
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
                {barcodes[voucher.voucher_code] ? (
                  <img
                    src={barcodes[voucher.voucher_code]}
                    alt="Barcode"
                    style={{ width: '95%', maxWidth: '100%' }}
                  />
                ) : (
                  <div style={{
                    padding: '20px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f5f5f5',
                    fontSize: '10px'
                  }}>
                    Barcode
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
          );
        })}
      </div>
    </>
  );
};

export default ThermalVoucherPrintPage;
