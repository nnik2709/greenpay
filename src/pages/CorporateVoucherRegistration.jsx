import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Camera, Scan } from 'lucide-react';
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
import { useToast } from '@/components/ui/use-toast';

/**
 * Corporate Voucher Registration Page
 *
 * Purpose: Allow corporate customers to register their bulk vouchers with passport data
 * Flow:
 * 1. Enter/scan voucher code
 * 2. Scan/enter passport data
 * 3. Submit registration
 * 4. Voucher status changes from 'pending_passport' to 'active'
 */

const CorporateVoucherRegistration = () => {
  const { toast } = useToast();

  // Step 1: Voucher lookup
  const [step, setStep] = useState(1); // 1: Enter code, 2: Enter passport, 3: Success
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 2: Passport data
  const [passportData, setPassportData] = useState({
    passportNumber: '',
    surname: '',
    givenName: '',
    nationality: '',
    dateOfBirth: '',
    sex: '',
    dateOfExpiry: ''
  });

  // Camera scanner
  const [showScanner, setShowScanner] = useState(false);

  // Registration result
  const [registeredVoucher, setRegisteredVoucher] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Step 1: Look up voucher by code
   */
  const handleVoucherLookup = async () => {
    if (!voucherCode || voucherCode.length !== 8) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 8-character voucher code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/corporate-voucher-registration/voucher/${voucherCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Voucher not found');
      }

      if (data.alreadyRegistered) {
        setError(`This voucher is already registered to passport ${data.voucher.passport_number}`);
        setLoading(false);
        return;
      }

      if (data.expired) {
        setError('This voucher has expired and cannot be registered');
        setLoading(false);
        return;
      }

      setVoucher(data.voucher);
      setStep(2);
      toast({
        title: "Voucher Found",
        description: `Voucher for ${data.voucher.company_name} - PGK ${data.voucher.amount}`,
      });

    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Register passport to voucher
   */
  const handleRegisterPassport = async (e) => {
    e.preventDefault();

    if (!passportData.passportNumber || !passportData.surname || !passportData.givenName) {
      toast({
        title: "Missing Information",
        description: "Passport number, surname, and given name are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/corporate-voucher-registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherCode: voucher.voucher_code,
          ...passportData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRegisteredVoucher(data.voucher);
      setStep(3);
      toast({
        title: "✅ Registration Successful",
        description: "Voucher is now active and ready to use",
      });

    } catch (err) {
      setError(err.message);
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle camera scan success
   */
  const handleScanSuccess = (scannedData) => {
    setPassportData({
      passportNumber: scannedData.passportNumber || '',
      surname: scannedData.surname || '',
      givenName: scannedData.givenName || '',
      nationality: scannedData.nationality || '',
      dateOfBirth: scannedData.dateOfBirth || '',
      sex: scannedData.sex || '',
      dateOfExpiry: scannedData.dateOfExpiry || ''
    });
    setShowScanner(false);
    toast({
      title: "✅ Passport Scanned",
      description: "Passport data captured successfully",
    });
  };

  /**
   * Reset and start over
   */
  const handleReset = () => {
    setStep(1);
    setVoucherCode('');
    setVoucher(null);
    setPassportData({
      passportNumber: '',
      surname: '',
      givenName: '',
      nationality: '',
      dateOfBirth: '',
      sex: '',
      dateOfExpiry: ''
    });
    setRegisteredVoucher(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Corporate Voucher Registration
        </h1>
        <p className="text-gray-600">
          Register your corporate vouchers with passport information to activate them
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
          </div>
          <span className="ml-2 font-medium">Enter Code</span>
        </div>
        <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
          </div>
          <span className="ml-2 font-medium">Scan Passport</span>
        </div>
        <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step >= 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
          </div>
          <span className="ml-2 font-medium">Complete</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Enter Voucher Code */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Voucher Code</CardTitle>
            <CardDescription>
              Enter the 8-character voucher code from your corporate voucher
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voucherCode">Voucher Code</Label>
              <Input
                id="voucherCode"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="e.g., 3IEW5268"
                maxLength={8}
                className="text-lg font-mono tracking-wider"
              />
              <p className="text-sm text-gray-500 mt-1">
                Example: 3IEW5268 (8 characters)
              </p>
            </div>

            <Button
              onClick={handleVoucherLookup}
              disabled={loading || voucherCode.length !== 8}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up voucher...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Find Voucher
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter Passport Data */}
      {step === 2 && voucher && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Register Passport</CardTitle>
            <CardDescription>
              Scan or enter passport information for voucher {voucher.voucher_code}
            </CardDescription>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-600">Company:</span> <span className="font-medium">{voucher.company_name}</span></div>
                <div><span className="text-gray-600">Amount:</span> <span className="font-medium">PGK {voucher.amount}</span></div>
                <div><span className="text-gray-600">Valid Until:</span> <span className="font-medium">{new Date(voucher.valid_until).toLocaleDateString()}</span></div>
                <div><span className="text-gray-600">Status:</span> <span className="font-medium text-amber-600">Pending Passport</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {/* Camera Scanner Button */}
            <div className="mb-6">
              <Button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full"
                variant="outline"
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Scan Passport with Camera
              </Button>
            </div>

            {/* Camera Scanner Modal */}
            {showScanner && (
              <SimpleCameraScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setShowScanner(false)}
              />
            )}

            {/* Manual Entry Form */}
            <form onSubmit={handleRegisterPassport} className="space-y-4">
              <div className="text-center text-sm text-gray-500 mb-4">
                or enter manually below
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passportNumber">Passport Number *</Label>
                  <Input
                    id="passportNumber"
                    value={passportData.passportNumber}
                    onChange={(e) => setPassportData({...passportData, passportNumber: e.target.value.toUpperCase()})}
                    required
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={passportData.nationality}
                    onChange={(e) => setPassportData({...passportData, nationality: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    value={passportData.surname}
                    onChange={(e) => setPassportData({...passportData, surname: e.target.value.toUpperCase()})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="givenName">Given Name *</Label>
                  <Input
                    id="givenName"
                    value={passportData.givenName}
                    onChange={(e) => setPassportData({...passportData, givenName: e.target.value.toUpperCase()})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={passportData.dateOfBirth}
                    onChange={(e) => setPassportData({...passportData, dateOfBirth: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <select
                    id="sex"
                    value={passportData.sex}
                    onChange={(e) => setPassportData({...passportData, sex: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="X">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="dateOfExpiry">Passport Expiry</Label>
                  <Input
                    id="dateOfExpiry"
                    type="date"
                    value={passportData.dateOfExpiry}
                    onChange={(e) => setPassportData({...passportData, dateOfExpiry: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Voucher'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && registeredVoucher && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle2 className="mr-2 h-6 w-6" />
              Registration Successful!
            </CardTitle>
            <CardDescription>
              Your voucher is now active and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-green-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Voucher Code</p>
                  <p className="text-lg font-bold font-mono text-green-700">{registeredVoucher.voucher_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-bold text-green-700">✓ ACTIVE</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Passport</p>
                  <p className="text-lg font-medium font-mono">{registeredVoucher.passport_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valid Until</p>
                  <p className="text-lg font-medium">{new Date(registeredVoucher.valid_until).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Save or print this confirmation</li>
                <li>Present your voucher code at the entry checkpoint</li>
                <li>Keep your passport with you for verification</li>
                <li>The voucher is now valid for single-use entry</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Register Another Voucher
              </Button>
              <Button
                onClick={() => window.print()}
                className="flex-1"
              >
                Print Confirmation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default CorporateVoucherRegistration;
