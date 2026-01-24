import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
import api from '@/lib/api/client';
import { CheckCircle, Camera, Edit, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { COUNTRY_CODE_TO_NATIONALITY } from '@/lib/countryCodeMapper';

/**
 * Multi-Voucher Registration Wizard
 *
 * Step-by-step passport registration for multiple vouchers
 * Features:
 * - Camera scanning for each passport
 * - Confirmation screen before saving
 * - Progress tracking (1 of 3, 2 of 3, etc.)
 * - Error recovery and retry
 * - SessionStorage persistence
 * - Navigation guards
 *
 * Props:
 * - vouchers: Array of voucher objects [{code, amount, ...}]
 * - onComplete: (results) => void - Called when all registrations complete
 * - onCancel: () => void - Called when user cancels
 */
const MultiVoucherRegistrationWizard = ({ vouchers, onComplete, onCancel }) => {
  // Wizard state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState('scan'); // 'scan' | 'confirm' | 'saving' | 'success'
  const [scannedData, setScannedData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [registrationResults, setRegistrationResults] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const currentVoucher = vouchers[currentIndex];
  const totalVouchers = vouchers.length;
  const isLastVoucher = currentIndex === totalVouchers - 1;

  // Progress persistence
  useEffect(() => {
    // Save progress to sessionStorage
    const progressData = {
      currentIndex,
      registrationResults,
      timestamp: Date.now()
    };
    sessionStorage.setItem('multiVoucherProgress', JSON.stringify(progressData));
  }, [currentIndex, registrationResults]);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = sessionStorage.getItem('multiVoucherProgress');
    if (savedProgress) {
      try {
        const { currentIndex: savedIndex, registrationResults: savedResults } = JSON.parse(savedProgress);
        // Only restore if not too old (within 1 hour)
        const savedData = JSON.parse(savedProgress);
        if (Date.now() - savedData.timestamp < 3600000) {
          setCurrentIndex(savedIndex);
          setRegistrationResults(savedResults);
        }
      } catch (err) {
        console.error('Failed to restore progress:', err);
      }
    }
  }, []);

  // Navigation guard - warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (registrationResults.length < totalVouchers && registrationResults.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unregistered vouchers. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [registrationResults.length, totalVouchers]);

  // Handle camera scan success
  const handleScanSuccess = (passportData) => {
    setScannedData(passportData);
    setEditedData(passportData); // Initialize edited data
    setStep('confirm');
  };

  // Handle manual entry (fallback)
  const handleManualEntry = () => {
    // Initialize with empty data for manual entry
    const emptyData = {
      passportNumber: '',
      surname: '',
      givenName: '',
      nationality: '',
      dateOfBirth: '',
      sex: '',
      dateOfExpiry: ''
    };
    setScannedData(emptyData);
    setEditedData(emptyData);
    setStep('confirm');
  };

  // Handle edit field change
  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate passport data
  const validatePassportData = (data) => {
    const errors = [];

    if (!data.passportNumber || data.passportNumber.trim().length < 5) {
      errors.push('Passport number is required (minimum 5 characters)');
    }
    if (!data.surname || data.surname.trim().length < 2) {
      errors.push('Surname is required');
    }
    if (!data.givenName || data.givenName.trim().length < 2) {
      errors.push('Given name is required');
    }
    if (!data.nationality) {
      errors.push('Nationality is required');
    }
    if (!data.dateOfExpiry) {
      errors.push('Expiry date is required');
    } else {
      // Check if expiry is in the future
      const expiryDate = new Date(data.dateOfExpiry);
      if (expiryDate < new Date()) {
        errors.push('Passport has expired');
      }
    }

    return errors;
  };

  // Save passport registration
  const handleConfirmAndSave = async () => {
    setError(null);

    // Validate data
    const validationErrors = validatePassportData(editedData);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setSaving(true);
    setStep('saving');

    try {
      // Register passport to voucher
      const response = await api.post(`/buy-online/voucher/${currentVoucher.code}/register`, {
        passportNumber: editedData.passportNumber.trim().toUpperCase(),
        surname: editedData.surname.trim().toUpperCase(),
        givenName: editedData.givenName.trim(),
        nationality: editedData.nationality,
        dateOfBirth: editedData.dateOfBirth,
        sex: editedData.sex || 'Unspecified',
        expiryDate: editedData.dateOfExpiry
      });

      if (response.success) {
        // Add to results
        const newResults = [...registrationResults, {
          voucherCode: currentVoucher.code,
          passportNumber: editedData.passportNumber,
          success: true
        }];
        setRegistrationResults(newResults);

        // Move to next voucher or complete
        if (isLastVoucher) {
          setStep('success');
          // Clear progress from sessionStorage
          sessionStorage.removeItem('multiVoucherProgress');
        } else {
          // Move to next voucher
          setCurrentIndex(prev => prev + 1);
          setStep('scan');
          setScannedData(null);
          setEditedData(null);
          setError(null);
        }
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register passport. Please try again.');
      setStep('confirm'); // Go back to confirm screen for retry
    } finally {
      setSaving(false);
    }
  };

  // Retry scan
  const handleRetry = () => {
    setScannedData(null);
    setEditedData(null);
    setError(null);
    setStep('scan');
  };

  // Complete wizard
  const handleComplete = () => {
    onComplete(registrationResults);
  };

  // Cancel wizard
  const handleCancelWizard = () => {
    if (registrationResults.length > 0) {
      const confirmed = window.confirm(
        `You have registered ${registrationResults.length} of ${totalVouchers} vouchers. ` +
        'Are you sure you want to exit? Your progress has been saved.'
      );
      if (!confirmed) return;
    }
    onCancel();
  };

  // Progress bar
  const progress = ((currentIndex + 1) / totalVouchers) * 100;
  const completedCount = registrationResults.length;

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg-png.jpg)',
          filter: 'brightness(1.1) blur(3px)',
        }}
      />
      <div className="absolute inset-0 bg-white/75" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-cyan-50/60" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-6">
          <Card className="border-emerald-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Register Passports
                  </h1>
                  <p className="text-slate-600 mt-1">
                    {step === 'success'
                      ? `All ${totalVouchers} vouchers registered!`
                      : `Passport ${currentIndex + 1} of ${totalVouchers}`
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelWizard}
                  className="text-slate-600"
                >
                  Cancel
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-slate-600">
                <span>{completedCount} completed</span>
                <span>{totalVouchers - completedCount} remaining</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Scan Passport */}
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-emerald-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardTitle className="text-xl text-emerald-800">
                    Scan Passport for Voucher {currentVoucher.code}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <SimpleCameraScanner
                    onPassportData={handleScanSuccess}
                    autoStart={true}
                    showCloseButton={false}
                    buttonText="Start Scanning"
                  />

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600 mb-3">
                      Don't have a camera or scanner not working?
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleManualEntry}
                      className="border-emerald-600 text-emerald-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Enter Details Manually
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Confirm Data */}
          {step === 'confirm' && editedData && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-emerald-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <CardTitle className="text-xl text-emerald-800">
                        Confirm Passport Details
                      </CardTitle>
                      <p className="text-sm text-emerald-600 mt-1">
                        Voucher: {currentVoucher.code}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      <strong>Please verify all details are correct.</strong> You can edit any field before saving.
                    </AlertDescription>
                  </Alert>

                  {/* Editable Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="passportNumber" className="text-slate-700">
                        Passport Number *
                      </Label>
                      <Input
                        id="passportNumber"
                        value={editedData.passportNumber || ''}
                        onChange={(e) => handleFieldChange('passportNumber', e.target.value.toUpperCase())}
                        className="mt-1 font-mono"
                        placeholder="P1234567"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nationality" className="text-slate-700">
                        Nationality *
                      </Label>
                      <Input
                        id="nationality"
                        value={editedData.nationality || ''}
                        onChange={(e) => handleFieldChange('nationality', e.target.value)}
                        className="mt-1"
                        placeholder="Australian"
                      />
                    </div>

                    <div>
                      <Label htmlFor="surname" className="text-slate-700">
                        Surname *
                      </Label>
                      <Input
                        id="surname"
                        value={editedData.surname || ''}
                        onChange={(e) => handleFieldChange('surname', e.target.value.toUpperCase())}
                        className="mt-1"
                        placeholder="SMITH"
                      />
                    </div>

                    <div>
                      <Label htmlFor="givenName" className="text-slate-700">
                        Given Name *
                      </Label>
                      <Input
                        id="givenName"
                        value={editedData.givenName || ''}
                        onChange={(e) => handleFieldChange('givenName', e.target.value)}
                        className="mt-1"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth" className="text-slate-700">
                        Date of Birth
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editedData.dateOfBirth || ''}
                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sex" className="text-slate-700">
                        Sex
                      </Label>
                      <select
                        id="sex"
                        value={editedData.sex || ''}
                        onChange={(e) => handleFieldChange('sex', e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-md border border-slate-300 bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Unspecified">Unspecified</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="dateOfExpiry" className="text-slate-700">
                        Expiry Date *
                      </Label>
                      <Input
                        id="dateOfExpiry"
                        type="date"
                        value={editedData.dateOfExpiry || ''}
                        onChange={(e) => handleFieldChange('dateOfExpiry', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Scan Again
                    </Button>
                    <Button
                      onClick={handleConfirmAndSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {isLastVoucher ? 'Complete Registration' : 'Save & Continue'}
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-slate-500 pt-2">
                    {isLastVoucher
                      ? 'This is the last passport to register'
                      : `${totalVouchers - currentIndex - 1} more passport${totalVouchers - currentIndex - 1 > 1 ? 's' : ''} after this`
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Saving */}
          {step === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-emerald-200 shadow-xl">
                <CardContent className="pt-12 pb-12 text-center">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-emerald-600 animate-spin" />
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Registering Passport...
                  </h2>
                  <p className="text-slate-600">
                    Saving to voucher {currentVoucher.code}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Success/Complete */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-emerald-200 shadow-xl">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-emerald-700 mb-2">
                      All Passports Registered!
                    </h2>
                    <p className="text-slate-600 text-lg">
                      {totalVouchers} vouchers are now valid and ready to use
                    </p>
                  </div>

                  {/* Registration Summary */}
                  <div className="bg-emerald-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-emerald-900 mb-4">
                      Registration Summary:
                    </h3>
                    <div className="space-y-2">
                      {registrationResults.map((result, index) => (
                        <div key={result.voucherCode} className="flex items-center gap-3 bg-white rounded p-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">
                              Voucher {result.voucherCode}
                            </p>
                            <p className="text-sm text-slate-600">
                              Passport: {result.passportNumber}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleComplete}
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Continue to Download/Print Options
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiVoucherRegistrationWizard;
