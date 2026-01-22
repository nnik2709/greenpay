/**
 * Voucher Print Page - Thermal Printer Optimized
 *
 * Handles bulk printing of vouchers for 80mm thermal POS printers
 * URL params: ?codes=CODE1,CODE2,CODE3
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import JsBarcode from 'jsbarcode';

export default function VoucherPrintPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barcodes, setBarcodes] = useState({});

  useEffect(() => {
    const codes = searchParams.get('codes');
    if (!codes) {
      toast({
        variant: 'destructive',
        title: 'No Vouchers',
        description: 'No voucher codes provided'
      });
      navigate('/app/passports/create');
      return;
    }

    const codeArray = codes.split(',').map(c => c.trim()).filter(Boolean);
    loadVouchers(codeArray);
  }, [searchParams]);

  const loadVouchers = async (codes) => {
    try {
      setLoading(true);

      console.log('Loading vouchers:', codes);

      // Fetch all vouchers
      const promises = codes.map(code =>
        api.get(`/vouchers/code/${code}`)
      );

      const results = await Promise.all(promises);
      console.log('Voucher results:', results);

      const loadedVouchers = results.filter(r => r.voucher).map(r => r.voucher);
      console.log('Loaded vouchers:', loadedVouchers);

      setVouchers(loadedVouchers);

      // Generate barcodes
      const barcodeData = {};
      loadedVouchers.forEach(voucher => {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, voucher.voucher_code, {
            format: 'CODE128',
            width: 3,
            height: 60,
            displayValue: false,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000'
          });
          barcodeData[voucher.voucher_code] = canvas.toDataURL('image/png');
        } catch (error) {
          console.error('Barcode generation failed for', voucher.voucher_code, error);
        }
      });
      setBarcodes(barcodeData);

    } catch (error) {
      console.error('Error loading vouchers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load vouchers for printing'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Screen UI - hide when printing */}
      <div className="print:hidden container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-6 h-6" />
              Print {vouchers.length} Voucher{vouchers.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-900">
                  {vouchers.length} voucher{vouchers.length > 1 ? 's' : ''} loaded and ready to print
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Optimized for 80mm thermal POS printers
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Set flag so IndividualPurchase knows we're coming from Back button
                    sessionStorage.setItem('fromPrintPage', 'true');
                    window.history.back();
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print All
                </Button>
                <Button
                  onClick={() => navigate('/app/passports/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  New Transaction
                </Button>
              </div>

              {/* Preview */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Preview:</h3>
                <div className="space-y-2">
                  {vouchers.map((voucher, idx) => (
                    <div key={voucher.id} className="flex items-center gap-3 p-3 border rounded">
                      <span className="font-mono text-lg">{idx + 1}.</span>
                      <div>
                        <p className="font-bold">{voucher.voucher_code}</p>
                        <p className="text-sm text-gray-600">
                          {voucher.passport_number || 'Not registered'} |
                          Valid until: {new Date(voucher.valid_until).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Layout - optimized for 80mm thermal printer */}
      <div className="hidden print:block">
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
            .page-break {
              page-break-after: always;
            }
          }
        `}</style>

        {vouchers.map((voucher, idx) => (
          <div
            key={voucher.id}
            className={`${idx < vouchers.length - 1 ? 'page-break' : ''}`}
            style={{
              width: '80mm',
              padding: '5mm',
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px'
            }}
          >
            {/* CCDA Logo - centered at top */}
            <div style={{
              textAlign: 'center',
              marginBottom: '3mm',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img
                src="/ccda-logo.png"
                alt="CCDA"
                style={{
                  height: '15mm',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>

            {/* GREEN CARD Header */}
            <div style={{
              textAlign: 'center',
              fontWeight: 'normal',
              fontSize: '12px',
              letterSpacing: '3px',
              marginBottom: '2mm',
              color: '#000000'
            }}>
              G R E E N &nbsp; C A R D
            </div>

            {/* Subtitle */}
            <div style={{
              textAlign: 'left',
              fontSize: '11px',
              marginBottom: '4mm',
              fontWeight: 'normal'
            }}>
              Foreign Passport Holder
            </div>

            {/* Voucher Details - Matches PDF exactly */}
            <div style={{ marginBottom: '4mm', lineHeight: '1.6', fontSize: '11px', color: '#000000' }}>
              <div style={{ marginBottom: '1mm' }}>
                <span>Travel Document </span>
                <span style={{ fontWeight: 'bold', color: '#000000' }}>{voucher.passport_number || 'N/A'}</span>
              </div>
              <div style={{ marginBottom: '2mm' }}>
                <span>Number</span>
              </div>
              <div style={{ marginBottom: '1mm' }}>
                <span>Coupon Number: </span>
                <span style={{ fontWeight: 'bold', color: '#000000' }}>{voucher.voucher_code}</span>
              </div>
              <div style={{ marginBottom: '1mm' }}>
                <span>Bill Amount: </span>
                <span style={{ fontWeight: 'bold', color: '#000000' }}>K50.00</span>
              </div>
              <div style={{ marginBottom: '1mm' }}>
                <span>Payment Mode: </span>
                <span style={{ fontWeight: 'bold', color: '#000000' }}>{voucher.payment_method || 'CASH'}</span>
              </div>
            </div>

            {/* Barcode - Large and centered */}
            {barcodes[voucher.voucher_code] && (
              <div style={{
                textAlign: 'center',
                margin: '5mm 0'
              }}>
                <img
                  src={barcodes[voucher.voucher_code]}
                  alt={voucher.voucher_code}
                  style={{
                    width: '100%',
                    maxWidth: '65mm',
                    height: 'auto'
                  }}
                />
              </div>
            )}

            {/* Footer - Matches PDF exactly */}
            <div style={{
              marginTop: '5mm',
              paddingTop: '3mm',
              borderTop: '1px dashed #999',
              fontSize: '10px',
              lineHeight: '1.5',
              color: '#000000'
            }}>
              <div>GENERAL</div>
              <div>COUNTER: {voucher.created_by_name || 'Agent'}</div>
              <div>
                {new Date(voucher.created_at || new Date()).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })} {new Date(voucher.created_at || new Date()).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </div>
            </div>

            {/* Slogan */}
            <div style={{
              textAlign: 'center',
              marginTop: '4mm',
              fontSize: '9px',
              fontStyle: 'italic',
              color: '#000000'
            }}>
              GO GREEN PNG
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
