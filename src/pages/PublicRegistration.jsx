import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { uploadPassportPhoto, validateImageFile, MAX_FILE_SIZE } from '@/lib/storageService';
import { useScannerInput } from '@/hooks/useScannerInput';

/**
 * Public Registration Flow
 * Allows customers to register passport details using voucher code
 * NO AUTHENTICATION REQUIRED
 */

const PublicRegistration = () => {
  const { voucherCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    passportNumber: '',
    surname: '',
    givenName: '',
    dateOfBirth: '',
    nationality: '',
    sex: 'Male'
  });

  // Hardware scanner support with MRZ parsing
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: (data) => {
      if (data.type === 'mrz') {
        // MRZ passport scan - auto-fill all passport fields
        setFormData({
          passportNumber: data.passportNumber,
          surname: data.surname,
          givenName: data.givenName,
          nationality: data.nationality,
          dateOfBirth: data.dob,
          sex: data.sex
        });
        toast({
          title: "Passport MRZ Scanned",
          description: "Passport details have been auto-filled. Please verify and add your photo."
        });
      } else {
        // Simple passport number or voucher code scan
        if (data.value.startsWith('VCH-') || data.value.startsWith('CORP-')) {
          // Looks like voucher code - ignore (already have voucher from URL)
          toast({
            title: "Voucher Code Detected",
            description: "Voucher already loaded. Please scan passport MRZ."
          });
        } else {
          // Passport number scan
          setFormData(prev => ({ ...prev, passportNumber: data.value }));
          toast({
            title: "Passport Number Scanned",
            description: "Please enter remaining passport details."
          });
        }
      }
    },
    onScanError: (error) => {
      toast({
        title: "Scan Error",
        description: error.message || "Failed to process scan. Please try again.",
        variant: "destructive"
      });
    },
    minLength: 5,
    scanTimeout: 100,
    enableMrzParsing: true,
    debugMode: false
  });

  // Validate voucher on mount
  useEffect(() => {
    validateVoucher();
  }, [voucherCode]);

  const validateVoucher = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      // First, try individual/online vouchers
      console.log('🔍 Validating voucher:', voucherCode);
      const individualUrl = `${API_URL}/public-purchases/validate/${voucherCode}`;
      console.log('📡 Checking individual vouchers:', individualUrl);

      const individualResponse = await fetch(individualUrl);

      if (individualResponse.ok) {
        const result = await individualResponse.json();
        if (result.success && result.data) {
          // Found as individual voucher
          console.log('✅ Found as individual voucher');
          setVoucher(result.data);
          checkVoucherStatus(result.data);
          return;
        }
      }

      // Not found in individual vouchers, check corporate vouchers
      console.log('📡 Checking corporate vouchers...');
      const corporateUrl = `${API_URL}/voucher-registration/voucher/${voucherCode}`;
      const corporateResponse = await fetch(corporateUrl);

      if (corporateResponse.ok) {
        const result = await corporateResponse.json();
        if (result.voucher) {
          // Found as corporate voucher - redirect to corporate registration
          console.log('✅ Found as corporate voucher, redirecting...');
          toast({
            title: "Corporate Voucher Detected",
            description: "Redirecting to corporate voucher registration..."
          });
          setTimeout(() => {
            navigate(`/voucher-registration?code=${voucherCode}`);
          }, 1500);
          return;
        }
      }

      // Not found in either table
      console.log('❌ Voucher not found in any table');
      setError('Invalid voucher code. Please check and try again.');

    } catch (err) {
      console.error('Error validating voucher:', err);
      setError('Unable to validate voucher. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkVoucherStatus = (voucherData) => {
    console.log('🔍 Checking voucher status:', voucherData);

    // Check if already used
    if (voucherData.used_at) {
      console.log('❌ Voucher already used');
      setError(`This voucher was already used on ${new Date(voucherData.used_at).toLocaleDateString()}`);
      return;
    }
    console.log('✅ Voucher not used');

    // Check if expired
    const today = new Date().toISOString().split('T')[0];
    const validUntil = voucherData.valid_until.split('T')[0];
    const validFrom = voucherData.valid_from.split('T')[0];

    console.log('📅 Today:', today);
    console.log('📅 Valid until:', validUntil);
    console.log('📅 Valid from:', validFrom);

    if (today > validUntil) {
      console.log('❌ Voucher expired');
      setError(`This voucher expired on ${new Date(voucherData.valid_until).toLocaleDateString()}`);
      return;
    }
    console.log('✅ Voucher not expired');

    // Check if not yet valid
    if (today < validFrom) {
      console.log('❌ Voucher not yet valid');
      setError(`This voucher is not valid until ${new Date(voucherData.valid_from).toLocaleDateString()}`);
      return;
    }
    console.log('✅ Voucher is valid now');

    // Check if already has passport registered
    console.log('🛂 Passport number:', voucherData.passport_number);
    if (voucherData.passport_number && voucherData.passport_number !== 'PENDING') {
      console.log('❌ Passport already registered');
      setError('This voucher has already been registered with a passport.');
      return;
    }
    console.log('✅ Passport not registered yet');
    console.log('✅✅✅ All validations passed!');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateImageFile(file, MAX_FILE_SIZE.PHOTO);
        setPhotoFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Invalid Photo',
          description: err.message
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Only passport number is required
      if (!formData.passportNumber || formData.passportNumber.trim() === '') {
        throw new Error('Passport number is required');
      }

      // Update voucher with passport number via API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/public-purchases/register-passport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voucherCode: voucherCode,
          passportNumber: formData.passportNumber.toUpperCase(),
          surname: formData.surname ? formData.surname.toUpperCase() : null,
          givenName: formData.givenName ? formData.givenName.toUpperCase() : null,
          dateOfBirth: formData.dateOfBirth || null,
          nationality: formData.nationality || null,
          sex: formData.sex || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register passport');
      }

      const result = await response.json();

      toast({
        title: 'Registration Successful',
        description: `Passport ${formData.passportNumber} has been registered with your voucher.`
      });

      // Success - navigate to success page or show confirmation
      setTimeout(() => {
        navigate(`/`);
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Unable to complete registration. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 mx-auto border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Validating voucher...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              Voucher Validation Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-slate-600">
              If you believe this is an error, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            PNG Green Fees - Passport Registration
          </h1>
          <p className="text-slate-600 text-lg">
            Complete your passport registration using voucher code
          </p>
          <div className="mt-4 inline-block">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-mono font-bold text-lg">
              {voucherCode}
            </span>
          </div>
        </div>

        <Card className="border-emerald-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <CardTitle>Passport Details</CardTitle>
            <CardDescription>
              Enter your passport number to register your voucher. Additional details are optional.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {/* Scanner Status Indicator */}
            {isScannerActive && (
              <Alert className="mb-6 bg-emerald-50 border-emerald-300">
                <AlertDescription className="text-emerald-900 font-medium">
                  Scanning passport MRZ... Please scan the 2 lines at the bottom of your passport.
                </AlertDescription>
              </Alert>
            )}
            {!isScannerActive && (
              <Alert className="mb-6 bg-blue-50 border-blue-300">
                <AlertDescription className="text-blue-900">
                  <strong>Tip:</strong> Use a hardware scanner to scan your passport MRZ for automatic form filling, or enter details manually below.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Passport Number */}
              <div className="space-y-2">
                <Label htmlFor="passportNumber">Passport Number *</Label>
                <Input
                  id="passportNumber"
                  data-testid="public-reg-passport-number"
                  value={formData.passportNumber}
                  onChange={(e) => setFormData({...formData, passportNumber: e.target.value})}
                  placeholder="e.g., P1234567"
                  required
                  className="text-lg"
                />
              </div>

              {/* Name Fields - Optional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname (Family Name) <span className="text-slate-400 text-sm">(Optional)</span></Label>
                  <Input
                    id="surname"
                    data-testid="public-reg-surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    placeholder="SURNAME"
                    className="text-lg uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="givenName">Given Name(s) <span className="text-slate-400 text-sm">(Optional)</span></Label>
                  <Input
                    id="givenName"
                    data-testid="public-reg-given-name"
                    value={formData.givenName}
                    onChange={(e) => setFormData({...formData, givenName: e.target.value})}
                    placeholder="GIVEN NAME"
                    className="text-lg uppercase"
                  />
                </div>
              </div>

              {/* Date of Birth and Nationality - Optional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth <span className="text-slate-400 text-sm">(Optional)</span></Label>
                  <Input
                    id="dob"
                    data-testid="public-reg-dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality <span className="text-slate-400 text-sm">(Optional)</span></Label>
                  <Input
                    id="nationality"
                    data-testid="public-reg-nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    placeholder="e.g., Australian"
                  />
                </div>
              </div>

              {/* Sex - Optional */}
              <div className="space-y-2">
                <Label htmlFor="sex">Sex <span className="text-slate-400 text-sm">(Optional)</span></Label>
                <select
                  id="sex"
                  data-testid="public-reg-sex"
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Voucher Info Display */}
              <Alert className="bg-emerald-50 border-emerald-200">
                <AlertDescription className="text-emerald-800">
                  <strong>Voucher Details:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Code: {voucherCode}</li>
                    <li>• Value: PGK {voucher?.amount || 50}.00</li>
                    <li>• Valid until: {new Date(voucher?.valid_until).toLocaleDateString()}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                data-testid="public-reg-submit"
                disabled={submitting || !formData.passportNumber}
                className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Registering...
                  </>
                ) : (
                  'Register Passport'
                )}
              </Button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By submitting, you confirm that all information provided is accurate and matches your passport.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>© 2025 PNG Green Fees System. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default PublicRegistration;

