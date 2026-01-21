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
      navigate('/app/individual-purchase');
      return;
    }

    const codeArray = codes.split(',').map(c => c.trim()).filter(Boolean);
    loadVouchers(codeArray);
  }, [searchParams]);

  const loadVouchers = async (codes) => {
    try {
      setLoading(true);

      // Fetch all vouchers
      const promises = codes.map(code =>
        api.get(`/vouchers/code/${code}`)
      );

      const results = await Promise.all(promises);
      const loadedVouchers = results.filter(r => r.voucher).map(r => r.voucher);

      setVouchers(loadedVouchers);

      // Generate barcodes
      const barcodeData = {};
      loadedVouchers.forEach(voucher => {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, voucher.voucher_code, {
            format: 'CODE128',
            width: 4,
            height: 80,
            displayValue: false,
            margin: 5,
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
                  ✓ {vouchers.length} voucher{vouchers.length > 1 ? 's' : ''} loaded and ready to print
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Optimized for 80mm thermal POS printers
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePrint}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print All Vouchers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
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
              padding: '8mm 5mm',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
              <h1 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 2mm 0',
                color: '#000'
              }}>
                PNG GREEN FEES SYSTEM
              </h1>
              <div style={{
                borderBottom: '2px solid #000',
                width: '100%',
                margin: '3mm 0'
              }}></div>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '2mm 0',
                color: '#000'
              }}>
                AIRPORT EXIT VOUCHER
              </h2>
            </div>

            {/* Voucher Code - Large */}
            <div style={{
              textAlign: 'center',
              margin: '6mm 0',
              padding: '4mm',
              border: '2px solid #000',
              backgroundColor: '#f5f5f5'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                fontFamily: 'Courier New, monospace',
                color: '#000'
              }}>
                {voucher.voucher_code}
              </div>
            </div>

            {/* Barcode */}
            {barcodes[voucher.voucher_code] && (
              <div style={{
                textAlign: 'center',
                margin: '4mm 0'
              }}>
                <img
                  src={barcodes[voucher.voucher_code]}
                  alt={voucher.voucher_code}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: '60mm'
                  }}
                />
              </div>
            )}

            {/* Voucher Details */}
            <div style={{
              fontSize: '11px',
              margin: '4mm 0',
              lineHeight: '1.4'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {voucher.passport_number && (
                    <tr>
                      <td style={{ padding: '1mm 0', fontWeight: 'bold' }}>Passport:</td>
                      <td style={{ padding: '1mm 0', textAlign: 'right' }}>{voucher.passport_number}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '1mm 0', fontWeight: 'bold' }}>Amount:</td>
                    <td style={{ padding: '1mm 0', textAlign: 'right' }}>PGK 50.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1mm 0', fontWeight: 'bold' }}>Valid Until:</td>
                    <td style={{ padding: '1mm 0', textAlign: 'right' }}>
                      {new Date(voucher.valid_until).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1mm 0', fontWeight: 'bold' }}>Status:</td>
                    <td style={{ padding: '1mm 0', textAlign: 'right' }}>
                      {voucher.status === 'USED' ? 'USED' : 'VALID'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{
              fontSize: '9px',
              textAlign: 'center',
              marginTop: '6mm',
              paddingTop: '3mm',
              borderTop: '1px dashed #666',
              color: '#666'
            }}>
              <p style={{ margin: '1mm 0' }}>
                Cashier Climate Change Dev. Authority
              </p>
              <p style={{ margin: '1mm 0' }}>
                For inquiries: png.greenfees@ccda.gov.pg
              </p>
              <p style={{ margin: '2mm 0 0 0', fontSize: '8px' }}>
                Printed: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
