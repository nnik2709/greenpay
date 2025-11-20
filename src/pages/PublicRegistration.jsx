import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Upload, AlertCircle, Loader2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
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

      // Check voucher validity
      const { data: voucherData, error: voucherError } = await supabase
        .from('individual_purchases')
        .select('*')
        .eq('voucher_code', voucherCode)
        .maybeSingle();

      if (voucherError) throw voucherError;

      if (!voucherData) {
        // Try corporate vouchers
        const { data: corpVoucher, error: corpError } = await supabase
          .from('corporate_vouchers')
          .select('*')
          .eq('voucher_code', voucherCode)
          .maybeSingle();

        if (corpError) throw corpError;
        if (!corpVoucher) {
          setError('Invalid voucher code. Please check and try again.');
          return;
        }
        
        setVoucher(corpVoucher);
        checkVoucherStatus(corpVoucher);
        return;
      }

      setVoucher(voucherData);
      checkVoucherStatus(voucherData);

    } catch (err) {
      console.error('Error validating voucher:', err);
      setError('Unable to validate voucher. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkVoucherStatus = (voucherData) => {
    // Check if already used
    if (voucherData.used_at) {
      setError(`This voucher was already used on ${new Date(voucherData.used_at).toLocaleDateString()}`);
      return;
    }

    // Check if expired
    const today = new Date().toISOString().split('T')[0];
    if (today > voucherData.valid_until) {
      setError(`This voucher expired on ${new Date(voucherData.valid_until).toLocaleDateString()}`);
      return;
    }

    // Check if not yet valid
    if (today < voucherData.valid_from) {
      setError(`This voucher is not valid until ${new Date(voucherData.valid_from).toLocaleDateString()}`);
      return;
    }

    // Check if already has passport registered
    if (voucherData.passport_number && voucherData.passport_number !== 'PENDING') {
      setError('This voucher has already been registered with a passport.');
      return;
    }
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
      // Validate required fields
      if (!photoFile) {
        throw new Error('Please upload your passport photo');
      }

      // Upload photo
      const photoResult = await uploadPassportPhoto(photoFile, formData.passportNumber);

      // Create or update passport
      const passportData = {
        passport_number: formData.passportNumber,
        surname: formData.surname.toUpperCase(),
        given_name: formData.givenName.toUpperCase(),
        date_of_birth: formData.dateOfBirth,
        nationality: formData.nationality,
        sex: formData.sex,
        date_of_expiry: voucher.valid_until,
        photo_path: photoResult.path
      };

      const { data: passport, error: passportError } = await supabase
        .from('passports')
        .insert(passportData)
        .select()
        .single();

      if (passportError) throw passportError;

      // Update voucher with passport info
      const { error: updateError } = await supabase
        .from(voucher.company_name ? 'corporate_vouchers' : 'individual_purchases')
        .update({
          passport_id: passport.id,
          passport_number: formData.passportNumber
        })
        .eq('voucher_code', voucherCode);

      if (updateError) throw updateError;

      // Success - navigate to success page
      navigate(`/register/success/${voucherCode}`);

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
            <Loader2 className="w-12 h-12 mx-auto text-emerald-600 animate-spin" />
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
              <AlertCircle className="w-6 h-6" />
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
              Please fill in your passport information accurately. All fields are required.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {/* Scanner Status Indicator */}
            {isScannerActive && (
              <Alert className="mb-6 bg-emerald-50 border-emerald-300">
                <ScanLine className="w-5 h-5 text-emerald-600 animate-pulse" />
                <AlertDescription className="text-emerald-900 font-medium">
                  Scanning passport MRZ... Please scan the 2 lines at the bottom of your passport.
                </AlertDescription>
              </Alert>
            )}
            {!isScannerActive && (
              <Alert className="mb-6 bg-blue-50 border-blue-300">
                <ScanLine className="w-5 h-5 text-blue-600" />
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

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname (Family Name) *</Label>
                  <Input
                    id="surname"
                    data-testid="public-reg-surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    placeholder="SURNAME"
                    required
                    className="text-lg uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="givenName">Given Name(s) *</Label>
                  <Input
                    id="givenName"
                    data-testid="public-reg-given-name"
                    value={formData.givenName}
                    onChange={(e) => setFormData({...formData, givenName: e.target.value})}
                    placeholder="GIVEN NAME"
                    required
                    className="text-lg uppercase"
                  />
                </div>
              </div>

              {/* Date of Birth and Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    data-testid="public-reg-dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    data-testid="public-reg-nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    placeholder="e.g., Australian"
                    required
                  />
                </div>
              </div>

              {/* Sex */}
              <div className="space-y-2">
                <Label htmlFor="sex">Sex *</Label>
                <select
                  id="sex"
                  data-testid="public-reg-sex"
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="photo">Passport Photo *</Label>
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <input
                    id="photo"
                    data-testid="public-reg-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="photo" className="cursor-pointer">
                    {photoPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-32 h-32 mx-auto rounded-lg object-cover border-2 border-emerald-200"
                        />
                        <p className="text-sm text-emerald-600 font-medium">
                          Click to change photo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 mx-auto text-emerald-500" />
                        <div>
                          <p className="text-slate-700 font-medium">
                            Click to upload passport photo
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            JPEG or PNG, max 2MB
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Voucher Info Display */}
              <Alert className="bg-emerald-50 border-emerald-200">
                <Check className="h-4 w-4 text-emerald-600" />
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
                disabled={submitting || !photoFile}
                className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Complete Registration
                  </>
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

