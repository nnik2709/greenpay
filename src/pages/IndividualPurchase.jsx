import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Printer } from 'lucide-react';
import api from '@/lib/api/client';
import { useWebSerial } from '@/hooks/useWebSerial';
import { ScannerStatusFull } from '@/components/ScannerStatus';

const VOUCHER_AMOUNT = 50;

export default function IndividualPurchase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Restore state from sessionStorage on mount
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem('individualPurchaseStep');
    return saved || 'create';
  });
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [customerEmail, setCustomerEmail] = useState('');
  const [posTransactionRef, setPosTransactionRef] = useState('');
  const [posApprovalCode, setPosApprovalCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batchId, setBatchId] = useState(() => {
    const saved = sessionStorage.getItem('individualPurchaseBatchId');
    return saved || null;
  });
  const [vouchers, setVouchers] = useState(() => {
    const saved = sessionStorage.getItem('individualPurchaseVouchers');
    return saved ? JSON.parse(saved) : [];
  });

  // Registration wizard state
  const [wizardProgress, setWizardProgress] = useState(() => {
    const saved = sessionStorage.getItem('individualPurchaseWizardProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        registeredVouchers: new Set(parsed.registeredVouchersArray || [])
      };
    }
    return {
      currentIndex: 0,
      registeredVouchers: new Set(),
      registeredData: {}
    };
  });

  // Controlled inputs for passport fields in wizard
  const [passportNumber, setPassportNumber] = useState('');
  const [surname, setSurname] = useState('');
  const [givenName, setGivenName] = useState('');

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('individualPurchaseStep', step);
  }, [step]);

  useEffect(() => {
    if (batchId) {
      sessionStorage.setItem('individualPurchaseBatchId', batchId);
    }
  }, [batchId]);

  useEffect(() => {
    if (vouchers.length > 0) {
      sessionStorage.setItem('individualPurchaseVouchers', JSON.stringify(vouchers));
    }
  }, [vouchers]);

  useEffect(() => {
    const toSave = {
      ...wizardProgress,
      registeredVouchersArray: Array.from(wizardProgress.registeredVouchers)
    };
    sessionStorage.setItem('individualPurchaseWizardProgress', JSON.stringify(toSave));
  }, [wizardProgress]);

  // MRZ Scanner integration - WebSerial (real USB connection)
  const scanner = useWebSerial({
    autoConnect: true,
    autoReconnect: true,
    onScan: (scannedData) => {
      if (scannedData.passport_no && step === 'wizard' && vouchers.length > 0) {
        // MRZ data scanned successfully - populate fields
        setPassportNumber(scannedData.passport_no);
        setSurname(scannedData.surname);
        setGivenName(scannedData.given_name);

        // Auto-register and move to next voucher after a short delay
        setTimeout(async () => {
          const currentVoucher = vouchers[wizardProgress.currentIndex];
          if (!currentVoucher) return;

          // Check if already registered - prevent duplicate registration
          if (wizardProgress.registeredVouchers.has(currentVoucher.id)) {
            console.log('[Auto-scan] Voucher already registered, skipping:', currentVoucher.voucherCode);
            return;
          }

          try {
            // Call API to register passport with voucher
            await api.post('/public-purchases/register-passport', {
              voucherCode: currentVoucher.voucherCode,
              passportNumber: scannedData.passport_no.toUpperCase(),
              surname: scannedData.surname.toUpperCase(),
              givenName: scannedData.given_name.toUpperCase(),
              nationality: scannedData.nationalityCode || scannedData.nationality, // Prefer 3-letter code
              dateOfBirth: scannedData.dob,
              sex: scannedData.sex
            });

            setWizardProgress(prev => {
              // Add to registered set
              const newRegistered = new Set(prev.registeredVouchers);
              newRegistered.add(currentVoucher.id);

              // Save registration data
              const newData = {
                ...prev.registeredData,
                [currentVoucher.id]: {
                  passportNumber: scannedData.passport_no,
                  surname: scannedData.surname,
                  givenName: scannedData.given_name
                }
              };

              // Find next unregistered voucher
              const nextUnregisteredIndex = vouchers.findIndex(
                (v, idx) => idx > prev.currentIndex && !newRegistered.has(v.id)
              );

              toast({
                title: 'Voucher Registered',
                description: `${currentVoucher.voucherCode} → Auto-advancing to next voucher`
              });

              if (nextUnregisteredIndex !== -1) {
                // Move to next unregistered
                return {
                  currentIndex: nextUnregisteredIndex,
                  registeredVouchers: newRegistered,
                  registeredData: newData
                };
              } else {
                // All done - move past the last voucher to trigger completion screen
                return {
                  currentIndex: vouchers.length, // This will trigger completion on next render
                  registeredVouchers: newRegistered,
                  registeredData: newData
                };
              }
            });
          } catch (error) {
            console.error('Error auto-registering passport:', error);
            toast({
              variant: 'destructive',
              title: 'Auto-Registration Failed',
              description: 'Failed to save passport data. Please try again manually.'
            });
          }
        }, 500); // Short delay to show the populated data
      }
    }
  });

  // Clear passport fields when currentIndex changes
  useEffect(() => {
    if (step === 'wizard' && vouchers.length > 0 && wizardProgress.currentIndex < vouchers.length) {
      const currentVoucher = vouchers[wizardProgress.currentIndex];
      if (currentVoucher) {
        const existingData = wizardProgress.registeredData[currentVoucher.id];

        if (existingData) {
          // Load existing data if voucher was already registered
          setPassportNumber(existingData.passportNumber || '');
          setSurname(existingData.surname || '');
          setGivenName(existingData.givenName || '');
        } else {
          // Clear fields for new voucher
          setPassportNumber('');
          setSurname('');
          setGivenName('');
        }
      }
    }
  }, [wizardProgress.currentIndex, step]);

  const totalAmount = quantity * VOUCHER_AMOUNT;

  const handleQuantityChange = (newQty) => {
    setQuantity(newQty);
    setCollectedAmount(newQty * VOUCHER_AMOUNT);
  };

  const handleCreateVouchers = async () => {
    // For card/POS payments, require transaction reference
    if ((paymentMethod === 'POS' || paymentMethod === 'CARD') && !posTransactionRef.trim()) {
      toast({
        variant: 'destructive',
        title: 'Transaction Reference Required',
        description: 'Please enter the POS transaction reference number from the receipt.'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.post('/individual-purchases/batch-simple', {
        quantity,
        paymentMethod,
        collectedAmount,
        customerEmail: customerEmail || null,
        posTransactionRef: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posTransactionRef : null,
        posApprovalCode: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posApprovalCode : null
      });

      if (response.success) {
        setBatchId(response.batchId);
        setVouchers(response.vouchers);

        // Auto-start wizard for passport registration
        setStep('wizard');

        toast({
          title: 'Vouchers Created!',
          description: `${quantity} voucher(s) created. Starting passport registration...`
        });
      }

    } catch (error) {
      console.error('Error creating vouchers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create vouchers'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // COMPLETION STEP
  if (step === 'completion') {
    const registeredIds = Array.from(wizardProgress.registeredVouchers);
    const registeredVouchers = vouchers.filter(v => registeredIds.includes(v.id));
    const unregisteredVouchers = vouchers.filter(v => !registeredIds.includes(v.id));

    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Registration Wizard Complete</CardTitle>
            <CardDescription>
              {registeredIds.length} of {vouchers.length} vouchers have been registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions for All Registered Vouchers */}
            {registeredVouchers.length > 1 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Bulk Actions ({registeredVouchers.length} vouchers)</h3>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={async () => {
                      try {
                        const email = customerEmail || prompt('Enter email address for all vouchers:');
                        if (!email) return;

                        const voucherIds = registeredVouchers.map(v => v.id);
                        await api.post('/vouchers/bulk-email', { voucherIds, email });
                        toast({
                          title: 'Emails Sent',
                          description: `${registeredVouchers.length} vouchers sent to ${email}`
                        });
                      } catch (error) {
                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: 'Failed to send bulk emails'
                        });
                      }
                    }}
                  >
                    Email All ({registeredVouchers.length})
                  </Button>

                  {/* Thermal Printer - Only for Counter_Agent and Flex_Admin at airport kiosk */}
                  {(user?.role === 'Flex_Admin' || user?.role === 'Counter_Agent') && (
                    <Button
                      onClick={() => {
                        const voucherCodes = registeredVouchers.map(v => v.voucherCode).join(',');
                        // Navigate to VoucherPrint page with multiple voucher codes
                        navigate(`/app/voucher-print?codes=${voucherCodes}`);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      Print All ({registeredVouchers.length})
                    </Button>
                  )}

                  <Button
                    onClick={async () => {
                      try {
                        const voucherIds = registeredVouchers.map(v => v.id);
                        const response = await api.post('/vouchers/bulk-download', { voucherIds }, {
                          responseType: 'blob'
                        });
                        const blob = new Blob([response], { type: 'application/zip' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `vouchers-batch-${batchId}.zip`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        toast({
                          title: 'Download Started',
                          description: `Downloading ${registeredVouchers.length} vouchers as ZIP`
                        });
                      } catch (error) {
                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: 'Failed to download bulk vouchers'
                        });
                      }
                    }}
                  >
                    Download All as ZIP ({registeredVouchers.length})
                  </Button>
                </div>
              </div>
            )}

            {/* Registered Vouchers */}
            {registeredVouchers.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4 text-green-900">Registered Vouchers</h3>
                <div className="space-y-3">
                  {registeredVouchers.map(v => {
                    const data = wizardProgress.registeredData[v.id];
                    return (
                      <Card key={v.id} className="p-4 border-green-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono font-bold text-lg">{v.voucherCode}</p>
                            <p className="text-sm text-gray-600">
                              {data?.passportNumber} | {data?.surname}, {data?.givenName}
                            </p>
                          </div>
                          <div className="text-green-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Print All Button */}
                <div className="mt-6">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const voucherCodes = registeredVouchers.map(v => v.voucherCode).join(',');
                      navigate(`/app/voucher-print?codes=${voucherCodes}`);
                    }}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print All ({registeredVouchers.length})
                  </Button>
                </div>
              </div>
            )}

            {/* Unregistered Vouchers */}
            {unregisteredVouchers.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4 text-yellow-900">⏳ Unregistered Vouchers</h3>
                <div className="space-y-3">
                  {unregisteredVouchers.map(v => (
                    <Card key={v.id} className="p-4 border-yellow-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold">{v.voucherCode}</p>
                          <p className="text-sm text-yellow-600">Not registered yet</p>
                        </div>
                        <Button
                          onClick={() => {
                            const index = vouchers.findIndex(vv => vv.id === v.id);
                            setWizardProgress({ ...wizardProgress, currentIndex: index });
                            setStep('wizard');
                          }}
                        >
                          Register Now →
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset everything
                  sessionStorage.removeItem('individualPurchaseStep');
                  sessionStorage.removeItem('individualPurchaseBatchId');
                  sessionStorage.removeItem('individualPurchaseVouchers');
                  sessionStorage.removeItem('individualPurchaseWizardProgress');
                  setStep('create');
                  setVouchers([]);
                  setBatchId(null);
                  setQuantity(1);
                  setCollectedAmount(50);
                  setCustomerEmail('');
                  setWizardProgress({
                    currentIndex: 0,
                    registeredVouchers: new Set(),
                    registeredData: {}
                  });
                }}
              >
                Create More Vouchers
              </Button>
              <Button onClick={() => navigate('/app/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // WIZARD STEP - MVP Version
  if (step === 'wizard') {
    // Check if we're done (current index is past last voucher)
    if (wizardProgress.currentIndex >= vouchers.length) {
      // Move to completion
      setStep('completion');
      return null;
    }

    const currentVoucher = vouchers[wizardProgress.currentIndex];

    // Safety check - if currentVoucher is undefined, go back to list
    if (!currentVoucher) {
      setStep('list');
      return null;
    }

    const isRegistered = wizardProgress.registeredVouchers.has(currentVoucher.id);
    const registeredCount = wizardProgress.registeredVouchers.size;
    const totalCount = vouchers.length;

    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - Voucher Cards (3 columns, scrollable) */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h3 className="text-lg font-semibold mb-4">3 Vouchers</h3>
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {vouchers.map((v, index) => {
                  const vIsRegistered = wizardProgress.registeredVouchers.has(v.id);
                  const vIsCurrent = index === wizardProgress.currentIndex;
                  const vData = wizardProgress.registeredData[v.id];

                  return (
                    <Card
                      key={v.id}
                      className={`p-4 cursor-pointer transition-all ${
                        vIsCurrent
                          ? 'border-2 border-blue-500 shadow-md'
                          : vIsRegistered
                          ? 'border-2 border-green-500 bg-green-50'
                          : 'border-2 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setWizardProgress({ ...wizardProgress, currentIndex: index })}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-gray-600">
                            Voucher {index + 1} of {vouchers.length}
                          </span>
                          {vIsRegistered && (
                            <span className="text-green-600 text-xs font-semibold">Registered</span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Voucher Code</p>
                          <p className="font-mono text-sm font-bold text-green-700">{v.voucherCode}</p>
                        </div>

                        {vIsRegistered && vData ? (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">Passport Number</p>
                              <p className="font-semibold text-sm">{vData.passportNumber}</p>
                            </div>
                            <div className="pt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Print PDF
                                  toast({ title: 'Print feature coming soon' });
                                }}
                              >
                                Print
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Email
                                  toast({ title: 'Email feature coming soon' });
                                }}
                              >
                                Email
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">PENDING</p>
                        )}

                        <div className="text-xs text-gray-500">
                          <p>Amount: K 50</p>
                          <p>Valid: 1/20/2026 - 1/20/2027</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT MAIN AREA - Registration Form (9 columns) */}
          <div className="col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>
                  Registering Voucher {wizardProgress.currentIndex + 1} of {vouchers.length}
                </CardTitle>
                <CardDescription>
                  Voucher Code: <span className="font-mono font-bold">{currentVoucher.voucherCode}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isRegistered ? (
                  /* Already Registered - Show Summary */
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Already Registered</h3>
                        <p className="text-sm text-green-700">
                          This voucher has been registered with passport {wizardProgress.registeredData[currentVoucher.id]?.passportNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          const nextUnregisteredIndex = vouchers.findIndex(
                            (v, idx) => idx > wizardProgress.currentIndex && !wizardProgress.registeredVouchers.has(v.id)
                          );
                          if (nextUnregisteredIndex !== -1) {
                            setWizardProgress({ ...wizardProgress, currentIndex: nextUnregisteredIndex });
                          } else {
                            setStep('completion');
                          }
                        }}
                      >
                        Next Unregistered Voucher →
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Re-register (remove from registered set)
                          const newRegistered = new Set(wizardProgress.registeredVouchers);
                          newRegistered.delete(currentVoucher.id);
                          const newData = { ...wizardProgress.registeredData };
                          delete newData[currentVoucher.id];
                          setWizardProgress({
                            ...wizardProgress,
                            registeredVouchers: newRegistered,
                            registeredData: newData
                          });
                        }}
                      >
                        Re-register
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Registration Form with MRZ Scanner */
                  <div className="space-y-4">
                    {/* Scanner Status with WebSerial Connect/Disconnect */}
                    <div className={`border rounded-lg p-4 mb-4 ${
                      scanner.isReady ? 'bg-green-50 border-green-200' :
                      scanner.isConnecting ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            scanner.isReady ? 'bg-green-500' :
                            scanner.isConnecting ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-400'
                          }`}></div>
                          <span className="text-sm font-medium">
                            MRZ Scanner: {
                              scanner.isReady ? 'Ready (LED Green)' :
                              scanner.isConnecting ? 'Connecting...' :
                              scanner.isConnected ? 'Connected' :
                              'Not Connected'
                            }
                          </span>
                        </div>
                        {scanner.isConnected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={scanner.disconnect}
                            className="h-8"
                          >
                            Disconnect Scanner
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={scanner.connect}
                            disabled={scanner.isConnecting || !scanner.isSupported}
                            className="h-8"
                          >
                            {scanner.isConnecting ? 'Connecting...' : 'Connect Scanner'}
                          </Button>
                        )}
                      </div>
                      {scanner.error && (
                        <p className="text-xs text-red-700 mt-2">
                          {scanner.error}
                        </p>
                      )}
                      {scanner.isReady && scanner.scanCount > 0 && (
                        <p className="text-xs text-green-700 mt-2">
                          {scanner.scanCount} passport{scanner.scanCount > 1 ? 's' : ''} scanned this session
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="passportNumber">Passport Number *</Label>
                      <Input
                        id="passportNumber"
                        placeholder="XX123456"
                        value={passportNumber}
                        onChange={(e) => setPassportNumber(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="surname">Surname *</Label>
                      <Input
                        id="surname"
                        placeholder="SMITH"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="givenName">Given Name *</Label>
                      <Input
                        id="givenName"
                        placeholder="JOHN"
                        value={givenName}
                        onChange={(e) => setGivenName(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={async () => {
                          if (!passportNumber || !surname || !givenName) {
                            toast({
                              variant: 'destructive',
                              title: 'Missing Information',
                              description: 'Please fill in all required fields'
                            });
                            return;
                          }

                          try {
                            // Call API to register passport with voucher
                            await api.post('/public-purchases/register-passport', {
                              voucherCode: currentVoucher.voucherCode,
                              passportNumber: passportNumber.toUpperCase(),
                              surname: surname.toUpperCase(),
                              givenName: givenName.toUpperCase()
                              // nationality not available in manual entry (no scanner data)
                            });

                            // Add to registered set
                            const newRegistered = new Set(wizardProgress.registeredVouchers);
                            newRegistered.add(currentVoucher.id);

                            // Save registration data
                            const newData = {
                              ...wizardProgress.registeredData,
                              [currentVoucher.id]: { passportNumber, surname, givenName }
                            };

                            // Find next unregistered voucher
                            const nextUnregisteredIndex = vouchers.findIndex(
                              (v, idx) => idx > wizardProgress.currentIndex && !newRegistered.has(v.id)
                            );

                            if (nextUnregisteredIndex !== -1) {
                              // Move to next unregistered
                              setWizardProgress({
                                currentIndex: nextUnregisteredIndex,
                                registeredVouchers: newRegistered,
                                registeredData: newData
                              });
                            } else {
                              // All done, go to completion
                              setWizardProgress({
                                ...wizardProgress,
                                registeredVouchers: newRegistered,
                                registeredData: newData
                              });
                              setStep('completion');
                            }

                            toast({
                              title: 'Voucher Registered',
                              description: `Voucher ${currentVoucher.voucherCode} registered to passport ${passportNumber}`
                            });
                          } catch (error) {
                            console.error('Error registering passport:', error);
                            toast({
                              variant: 'destructive',
                              title: 'Registration Failed',
                              description: error.response?.data?.error || 'Failed to save passport data to database'
                            });
                          }
                        }}
                        className="flex-1"
                      >
                        Register & Continue →
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          // Skip this voucher - find next unregistered
                          const nextUnregisteredIndex = vouchers.findIndex(
                            (v, idx) => idx > wizardProgress.currentIndex && !wizardProgress.registeredVouchers.has(v.id)
                          );

                          if (nextUnregisteredIndex !== -1) {
                            setWizardProgress({ ...wizardProgress, currentIndex: nextUnregisteredIndex });
                          } else {
                            // No more unregistered, go to completion
                            setStep('completion');
                          }

                          toast({
                            title: 'Voucher Skipped',
                            description: 'You can register it later from the voucher list'
                          });
                        }}
                      >
                        Skip This One
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // NOTE: 'list' step removed - wizard now auto-starts after payment for better UX
  // Users can skip vouchers in wizard if they want to register later

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Individual Purchase</CardTitle>
          <CardDescription>
            Create vouchers for individual passport purchases. Passports will be registered using the MRZ scanner after voucher creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scanner Status Indicator */}
          <ScannerStatusFull
            connectionState={scanner.connectionState}
            scanCount={scanner.scanCount}
            error={scanner.error}
            onConnect={scanner.connect}
            onDisconnect={scanner.disconnect}
            onReconnect={scanner.reconnect}
            isSupported={scanner.isSupported}
            reconnectAttempt={scanner.reconnectAttempt}
          />
          {/* Quantity Selector */}
          <div>
            <Label className="text-base font-semibold">Number of Vouchers</Label>
            <p className="text-sm text-gray-500 mb-3">Select how many vouchers to create (1-5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={quantity === num ? 'default' : 'outline'}
                  onClick={() => handleQuantityChange(num)}
                  className="w-14 h-14 text-lg font-bold"
                  type="button"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="mt-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer flex-1 font-normal">
                  Cash Payment
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="POS" id="pos" />
                <Label htmlFor="pos" className="cursor-pointer flex-1 font-normal">
                  POS/Card Payment
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-base font-semibold">Collected Amount (PGK)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Expected: PGK {totalAmount.toFixed(2)} ({VOUCHER_AMOUNT} × {quantity} voucher{quantity > 1 ? 's' : ''})
            </p>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
              className="text-lg font-semibold"
            />
            {Math.abs(collectedAmount - totalAmount) > 0.01 && (
              <p className="text-sm text-amber-600 mt-1">
                {collectedAmount > totalAmount
                  ? `Overpayment: PGK ${(collectedAmount - totalAmount).toFixed(2)}`
                  : `Underpayment: PGK ${(totalAmount - collectedAmount).toFixed(2)}`
                }
              </p>
            )}
          </div>

          {/* Customer Email (Optional) */}
          <div>
            <Label htmlFor="email" className="text-base font-semibold">Customer Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional - used for sending voucher details later
            </p>
          </div>

          {/* POS Transaction Reference (for POS/Card payments) */}
          {paymentMethod === 'POS' && (
            <>
              <div>
                <Label htmlFor="posRef" className="text-base font-semibold">
                  POS Transaction Reference <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="posRef"
                  type="text"
                  value={posTransactionRef}
                  onChange={(e) => setPosTransactionRef(e.target.value)}
                  placeholder="Enter transaction reference from POS receipt"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Required for POS/Card payments - find this on the payment receipt
                </p>
              </div>

              <div>
                <Label htmlFor="posApproval" className="text-base font-semibold">
                  POS Approval Code (Optional)
                </Label>
                <Input
                  id="posApproval"
                  type="text"
                  value={posApprovalCode}
                  onChange={(e) => setPosApprovalCode(e.target.value)}
                  placeholder="Enter approval code (if available)"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional - approval code from POS terminal
                </p>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateVouchers}
              disabled={isSubmitting || collectedAmount <= 0}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isSubmitting
                ? 'Creating Vouchers...'
                : `Create ${quantity} Voucher${quantity > 1 ? 's' : ''} →`
              }
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps After Creation:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Click "Register Passport →" for each voucher</li>
              <li>Scan passport using KB MRZ scanner</li>
              <li>Verify details and complete registration</li>
              <li>Print or email the completed voucher</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
