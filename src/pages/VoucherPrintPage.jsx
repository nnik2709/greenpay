/**
 * Voucher Print Page - Regular A4/Letter Printer
 *
 * Handles printing of vouchers for regular printers (A4/Letter format)
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
import { getRegistrationUrl } from '@/config/urls';

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

      // Fetch all vouchers
      const promises = codes.map(code =>
        api.get(`/vouchers/code/${code}`)
      );

      const results = await Promise.all(promises);
      const loadedVouchers = results.filter(r => r.voucher).map(r => r.voucher);

      setVouchers(loadedVouchers);

      // Generate barcodes for all vouchers
      const newBarcodes = {};
      loadedVouchers.forEach(voucher => {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, voucher.voucher_code, {
            format: 'CODE128',
            width: 5,
            height: 120,
            displayValue: false,
            margin: 10,
            background: '#ffffff',
            lineColor: '#000000'
          });
          newBarcodes[voucher.voucher_code] = canvas.toDataURL('image/png');
        } catch (error) {
          console.error('Barcode generation error for', voucher.voucher_code, error);
        }
      });
      setBarcodes(newBarcodes);

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

  const handlePrintAll = () => {
    window.print();
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
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-900 font-semibold">
                  {vouchers.length} voucher{vouchers.length > 1 ? 's' : ''} loaded and ready to print
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Regular printer format (A4/Letter) - Full GREEN CARD layout
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePrintAll}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  size="lg"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print All ({vouchers.length})
                </Button>
              </div>

              {/* Preview */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Vouchers to Print:</h3>
                <div className="space-y-2">
                  {vouchers.map((voucher, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border rounded bg-white">
                      <span className="font-mono text-lg font-bold text-green-600">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-bold font-mono text-lg">{voucher.voucher_code}</p>
                        <p className="text-sm text-gray-600">
                          {voucher.passport_number || 'Not registered'}
                          {voucher.valid_until && ` | Valid until: ${new Date(voucher.valid_until).toLocaleDateString()}`}
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

      {/* Print Layout - A4/Letter format */}
      <div className="hidden print:block">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
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

        {vouchers.map((voucher, idx) => {
          const registrationUrl = getRegistrationUrl(voucher.voucher_code);
          const passportNumber = voucher.passport_number || null;
          const hasPassport = passportNumber &&
                             passportNumber !== 'PENDING' &&
                             passportNumber !== 'pending' &&
                             String(passportNumber).trim() !== '';

          return (
            <div
              key={voucher.id}
              className={`${idx < vouchers.length - 1 ? 'page-break' : ''}`}
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                background: '#ffffff',
                padding: '36px 48px 56px 48px',
                maxWidth: '900px',
                margin: '0 auto'
              }}
            >
              {/* Logo - Centered CCDA */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <img
                  src="/assets/logos/ccda-logo.png"
                  alt="CCDA Logo"
                  style={{
                    width: '110px',
                    height: '110px',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Title */}
              <h1 style={{
                textAlign: 'center',
                color: '#2d8a34',
                fontSize: '28px',
                margin: '12px 0 6px 0',
                letterSpacing: '1px'
              }}>
                GREEN CARD
              </h1>

              <div style={{
                height: '3px',
                background: '#2d8a34',
                width: '100%',
                margin: '12px 0 20px 0'
              }}></div>

              {/* Subtitle */}
              <div style={{
                textAlign: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '26px'
              }}>
                Foreign Passport Holder
              </div>

              {/* Coupon Number */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '18px',
                marginBottom: '32px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Coupon Number:</span>
                <span>{voucher.voucher_code}</span>
              </div>

              {/* Passport Info (if registered) */}
              {hasPassport && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '32px',
                  padding: '20px',
                  background: '#f9fafb',
                  border: '2px solid #2d8a34',
                  borderRadius: '8px'
                }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    REGISTERED PASSPORT
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#000000',
                    letterSpacing: '2px',
                    fontFamily: 'monospace'
                  }}>
                    {passportNumber}
                  </p>
                </div>
              )}

              {/* Barcode */}
              <div style={{
                textAlign: 'center',
                margin: '24px 0'
              }}>
                {barcodes[voucher.voucher_code] ? (
                  <img
                    src={barcodes[voucher.voucher_code]}
                    alt="Barcode"
                    style={{
                      maxWidth: '100%',
                      width: '600px',
                      margin: '0 auto',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '128px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f9fafb'
                  }}>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Generating Barcode...</p>
                  </div>
                )}
              </div>

              {/* Registration link if not registered */}
              {!hasPassport && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <p style={{
                    fontSize: '20px',
                    fontWeight: '500',
                    color: '#000000',
                    marginBottom: '16px'
                  }}>
                    Scan to Register
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {registrationUrl}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: '80px' }}>
                <div style={{
                  width: '100%',
                  height: '1px',
                  background: '#9ca3af',
                  marginBottom: '24px'
                }}></div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  {voucher.created_by_name && voucher.created_by_name !== 'AUTHORIZED OFFICER' ? (
                    <div style={{ textAlign: 'left' }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#000000',
                        textTransform: 'uppercase'
                      }}>
                        {voucher.created_by_name}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '4px'
                      }}>
                        Authorizing Officer
                      </p>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
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
          );
        })}
      </div>
    </>
  );
}
