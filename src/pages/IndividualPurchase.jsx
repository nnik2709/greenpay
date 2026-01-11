import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
// Legacy import removed - using Supabase passportsService instead
import { getPassportByNumber, getPassportByNumberAndNationality, createPassport, searchPassports, updatePassport } from '@/lib/passportsService';
import { createIndividualPurchase, emailVoucher } from '@/lib/individualPurchasesService';
import { getPaymentModes } from '@/lib/paymentModesStorage';
import { useAuth } from '@/contexts/AuthContext';
import VoucherPrint from '@/components/VoucherPrint';
import { processOnlinePayment, isGatewayActive, GATEWAY_NAMES } from '@/lib/paymentGatewayService';
import { useScannerInput } from '@/hooks/useScannerInput';
import { useWebSerial, ConnectionState } from '@/hooks/useWebSerial';
import { ScannerStatusFull } from '@/components/ScannerStatus';

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { name: 'Passport Details' },
    { name: 'Payment' },
    { name: 'Voucher' },
  ];

  return (
    <div className="flex justify-center items-center mb-12">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: currentStep === index ? 1.1 : 1,
                backgroundColor: currentStep >= index ? '#10b981' : '#e2e8f0',
                color: currentStep >= index ? '#ffffff' : '#64748b',
              }}
              transition={{ duration: 0.3 }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
            >
              {currentStep > index ? '✓' : index + 1}
            </motion.div>
            <p className={`mt-2 text-sm font-medium ${currentStep >= index ? 'text-emerald-600' : 'text-slate-500'}`}>
              {step.name}
            </p>
          </div>
          {index < steps.length - 1 && (
            <motion.div
              className="flex-1 h-1 mx-4 bg-slate-200"
              initial={false}
              animate={{
                background: `linear-gradient(to right, #10b981 ${currentStep > index ? 100 : 0}%, #e2e8f0 ${currentStep > index ? 100 : 0}%)`
              }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const PassportDetailsStep = ({ onNext, setPassportInfo, passportInfo }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [passportFound, setPassportFound] = useState(null); // null = not searched, true = found, false = not found
  const [missingFields, setMissingFields] = useState([]); // Track which fields are missing from DB

  // Process scanned passport data (from any scanner source)
  const processScannedPassport = useCallback(async (data) => {
    console.log('[IndividualPurchase] Processing scanned passport:', data);

    // Map Web Serial format (snake_case) to form format (camelCase)
    const scannedData = {
      passportNumber: data.passport_no || data.passportNumber,
      surname: data.surname,
      givenName: data.given_name || data.givenName,
      nationality: data.nationality,
      dob: data.dob,
      sex: data.sex,
      dateOfExpiry: data.date_of_expiry || data.dateOfExpiry,
    };

    // Check if passport exists in database
    // Use passport_number + nationality for accurate lookup (passport numbers are NOT globally unique)
    try {
      const existingPassport = await getPassportByNumberAndNationality(
        scannedData.passportNumber,
        scannedData.nationality
      );
      if (existingPassport) {
        // Passport exists - load full record
        const existingData = {
          id: existingPassport.id,
          passportNumber: existingPassport.passport_number || existingPassport.passportNumber || existingPassport.passportNo,
          nationality: existingPassport.nationality,
          surname: existingPassport.surname,
          givenName: existingPassport.given_name || existingPassport.givenName,
          dob: existingPassport.dob || existingPassport.date_of_birth,
          sex: existingPassport.sex,
          dateOfExpiry: existingPassport.date_of_expiry || existingPassport.dateOfExpiry,
          passportPhoto: existingPassport.passport_photo,
          signatureImage: existingPassport.signature_image,
        };

        // Check which fields are missing in existing record but available in scanned data
        const fieldsToUpdate = {};
        const updatedFields = [];

        // Compare and fill missing fields from scanned data
        if (!existingData.surname && scannedData.surname) {
          fieldsToUpdate.surname = scannedData.surname;
          updatedFields.push('Surname');
        }
        if (!existingData.givenName && scannedData.givenName) {
          fieldsToUpdate.given_name = scannedData.givenName;
          updatedFields.push('Given Name');
        }
        if (!existingData.nationality && scannedData.nationality) {
          fieldsToUpdate.nationality = scannedData.nationality;
          updatedFields.push('Nationality');
        }
        if (!existingData.dob && scannedData.dob) {
          fieldsToUpdate.dob = scannedData.dob;
          updatedFields.push('Date of Birth');
        }
        if (!existingData.sex && scannedData.sex) {
          fieldsToUpdate.sex = scannedData.sex;
          updatedFields.push('Sex');
        }
        if (!existingData.dateOfExpiry && scannedData.dateOfExpiry) {
          fieldsToUpdate.date_of_expiry = scannedData.dateOfExpiry;
          updatedFields.push('Expiry Date');
        }

        // If there are fields to update, update the database record
        if (updatedFields.length > 0) {
          console.log('[IndividualPurchase] Updating passport with missing fields:', fieldsToUpdate);
          console.log('[IndividualPurchase] Scanned data:', scannedData);
          console.log('[IndividualPurchase] Existing data:', existingData);
          try {
            await updatePassport(existingData.id, fieldsToUpdate);
            console.log('[IndividualPurchase] Passport updated successfully');

            // Merge the updated fields into existing data for display
            // Use scannedData directly for fields that were updated (more reliable than fieldsToUpdate keys)
            const mergedData = {
              ...existingData,
              // Use scannedData values directly - they're already in camelCase format
              surname: scannedData.surname || existingData.surname,
              givenName: scannedData.givenName || existingData.givenName,
              nationality: scannedData.nationality || existingData.nationality,
              dob: scannedData.dob || existingData.dob,
              sex: scannedData.sex || existingData.sex,
              dateOfExpiry: scannedData.dateOfExpiry || existingData.dateOfExpiry,
            };

            console.log('[IndividualPurchase] Merged data for form:', mergedData);

            setSearchResult(mergedData);
            setPassportInfo(mergedData);
            setSearchQuery(mergedData.passportNumber);
            setPassportFound(true);
            setMissingFields([]);

            toast({
              title: "✅ Passport Updated from Scan",
              description: `Database record updated with: ${updatedFields.join(', ')}`,
            });
          } catch (updateError) {
            // Check if error is "No fields to update" - this is OK, data already exists
            const isNoFieldsError = updateError.message?.includes('No fields to update');
            if (isNoFieldsError) {
              console.log('[IndividualPurchase] Passport already has all fields - no update needed');
            } else {
              console.error('[IndividualPurchase] Failed to update passport:', updateError);
            }
            // Still use the merged data for display
            const mergedData = {
              ...existingData,
              ...scannedData,
              id: existingData.id,
            };
            setSearchResult(mergedData);
            setPassportInfo(mergedData);
            setSearchQuery(mergedData.passportNumber);
            setPassportFound(true);
            setMissingFields([]);
            toast({
              title: isNoFieldsError ? "✅ Passport Found" : "⚠️ Passport Scanned",
              description: isNoFieldsError
                ? "Passport data loaded from database."
                : "Scanned data loaded but database update failed. Will update on save.",
              variant: "default"
            });
          }
        } else {
          // No missing fields - just load the existing record
          setSearchResult(existingData);
          setPassportInfo(existingData);
          setSearchQuery(existingData.passportNumber);
          setPassportFound(true);
          setMissingFields([]);

          toast({
            title: "✅ Passport Found in Database",
            description: `${existingData.givenName} ${existingData.surname}'s complete record loaded.`
          });
        }
      } else {
        // New passport - use scanned data
        setPassportInfo(scannedData);
        setSearchQuery(scannedData.passportNumber);
        setPassportFound(false);
        toast({
          title: "📋 Passport Scanned - New Record",
          description: "Passport not in system. Details auto-filled from scan. Please verify."
        });
      }
    } catch (error) {
      // Error checking database, still use scanned data
      console.error('[IndividualPurchase] Database check error:', error);
      setPassportInfo(scannedData);
      setSearchQuery(scannedData.passportNumber);
      setPassportFound(null);
      toast({
        title: "Passport Scanned",
        description: "Passport details auto-filled. Please verify information."
      });
    }
  }, [setPassportInfo, toast]);

  // PrehKeyTec Web Serial Scanner (hardware scanner with DTR/RTS control)
  const webSerialScanner = useWebSerial({
    onScan: processScannedPassport,
    autoConnect: true,
    autoReconnect: true,
  });

  // Legacy keyboard wedge scanner support (fallback)
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: async (data) => {
      if (data.type === 'mrz') {
        // MRZ passport scan - auto-fill all fields
        const passportData = {
          passportNumber: data.passportNumber,
          surname: data.surname,
          givenName: data.givenName,
          nationality: data.nationality,
          dob: data.dob,
          sex: data.sex,
          dateOfExpiry: data.dateOfExpiry,
        };

        // Check if passport exists in database
        // Use passport_number + nationality for accurate lookup (passport numbers are NOT globally unique)
        try {
          const existingPassport = await getPassportByNumberAndNationality(
            data.passportNumber,
            data.nationality
          );
          if (existingPassport) {
            // Passport exists - load full record
            // Handle both snake_case (database) and camelCase (frontend) formats
            const fullPassportData = {
              id: existingPassport.id,
              passportNumber: existingPassport.passport_number || existingPassport.passportNumber || existingPassport.passportNo,
              nationality: existingPassport.nationality,
              surname: existingPassport.surname,
              givenName: existingPassport.given_name || existingPassport.givenName,
              dob: existingPassport.dob,
              sex: existingPassport.sex,
              dateOfExpiry: existingPassport.date_of_expiry || existingPassport.dateOfExpiry,
              passportPhoto: existingPassport.passport_photo,
              signatureImage: existingPassport.signature_image,
            };

            // Check for missing required fields
            const missing = [];
            if (!fullPassportData.passportNumber) missing.push('Passport Number');
            if (!fullPassportData.givenName) missing.push('Given Name');
            if (!fullPassportData.surname) missing.push('Surname');
            if (!fullPassportData.nationality) missing.push('Nationality');
            if (!fullPassportData.sex) missing.push('Sex');
            if (!fullPassportData.dateOfExpiry) missing.push('Expiry Date');

            setSearchResult(fullPassportData);
            setPassportInfo(fullPassportData);
            setSearchQuery(fullPassportData.passportNumber);
            setPassportFound(true);
            setMissingFields(missing);

            // Show appropriate toast based on missing fields
            if (missing.length > 0) {
              toast({
                title: "⚠️ MRZ Scanned - Incomplete Data",
                description: `Database record found but missing: ${missing.join(', ')}. Please update manually.`,
                variant: "default"
              });
            } else {
              toast({
                title: "✅ MRZ Scanned - Passport Found",
                description: `${fullPassportData.givenName} ${fullPassportData.surname}'s details loaded from database.`
              });
            }
          } else {
            // New passport - use MRZ data
            setPassportInfo(passportData);
            setSearchQuery(data.passportNumber);
            setPassportFound(false);
            toast({
              title: "📋 MRZ Scanned - New Passport",
              description: "Passport not in system. Details auto-filled from MRZ. Please verify."
            });
          }
        } catch (error) {
          // Error checking database, still use MRZ data
          setPassportInfo(passportData);
          setSearchQuery(data.passportNumber);
          setPassportFound(null);
          toast({
            title: "MRZ Scanned",
            description: "Passport details auto-filled. Please verify information."
          });
        }
      } else {
        // Simple barcode/passport number scan
        handleScan(data.value);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ variant: "destructive", title: "Search is empty", description: "Please enter a passport number." });
      return;
    }

    setIsSearching(true);
    try {
      const result = await getPassportByNumber(searchQuery.trim());
      if (result) {
        // Map database fields to component state format
        // Handle both snake_case (database) and camelCase (frontend) formats
        const passportData = {
          id: result.id,
          passportNumber: result.passport_number || result.passportNumber || result.passportNo,
          nationality: result.nationality,
          surname: result.surname,
          givenName: result.given_name || result.givenName,
          dob: result.dob,
          sex: result.sex,
          dateOfExpiry: result.date_of_expiry || result.dateOfExpiry,
        };

        // Check for missing required fields
        const missing = [];
        if (!passportData.passportNumber) missing.push('Passport Number');
        if (!passportData.givenName) missing.push('Given Name');
        if (!passportData.surname) missing.push('Surname');
        if (!passportData.nationality) missing.push('Nationality');
        if (!passportData.sex) missing.push('Sex');
        if (!passportData.dateOfExpiry) missing.push('Expiry Date');

        setSearchResult(passportData);
        setPassportInfo(passportData);
        setPassportFound(true);
        setMissingFields(missing);

        // Show appropriate toast based on missing fields
        if (missing.length > 0) {
          toast({
            title: "⚠️ Passport Found - Incomplete Data",
            description: `Missing fields: ${missing.join(', ')}. Please update these fields manually.`,
            variant: "default"
          });
        } else {
          toast({
            title: "✅ Passport Found",
            description: `${passportData.givenName} ${passportData.surname}'s details loaded from database.`
          });
        }
      } else {
        setSearchResult(null);
        setPassportInfo({ passportNumber: searchQuery.trim() }); // Pre-fill passport number for manual entry
        setPassportFound(false);
        toast({
          title: "📋 New Passport",
          description: "Passport not in system. Please enter details below to create new record.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error searching passport:', error);
      setSearchResult(null);
      setPassportFound(null);
      toast({ variant: "destructive", title: "Search Error", description: "Failed to search for passport. Please try again." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleScan = useCallback(async (value) => {
    try {
      const result = await getPassportByNumber(value.trim());
      if (result) {
        // Map database fields to component state format
        // Handle both snake_case (database) and camelCase (frontend) formats
        const passportData = {
          id: result.id,
          passportNumber: result.passport_number || result.passportNumber || result.passportNo,
          nationality: result.nationality,
          surname: result.surname,
          givenName: result.given_name || result.givenName,
          dob: result.dob,
          sex: result.sex,
          dateOfExpiry: result.date_of_expiry || result.dateOfExpiry,
        };

        // Check for missing required fields
        const missing = [];
        if (!passportData.passportNumber) missing.push('Passport Number');
        if (!passportData.givenName) missing.push('Given Name');
        if (!passportData.surname) missing.push('Surname');
        if (!passportData.nationality) missing.push('Nationality');
        if (!passportData.sex) missing.push('Sex');
        if (!passportData.dateOfExpiry) missing.push('Expiry Date');

        setSearchResult(passportData);
        setPassportInfo(passportData);
        setSearchQuery(passportData.passportNumber);
        setPassportFound(true);
        setMissingFields(missing);

        // Show appropriate toast based on missing fields
        if (missing.length > 0) {
          toast({
            title: "⚠️ Passport Scanned - Incomplete Data",
            description: `Missing fields: ${missing.join(', ')}. Please update these fields manually.`,
            variant: "default"
          });
        } else {
          toast({
            title: "✅ Passport Scanned & Found",
            description: `${passportData.givenName} ${passportData.surname}'s details loaded from database.`
          });
        }
      } else {
        // Set the scanned passport number for manual entry
        setSearchQuery(value.trim());
        setPassportInfo({ passportNumber: value.trim() });
        setPassportFound(false);
        toast({ variant: "default", title: "📋 New Passport Scanned", description: "Passport not in system. Please enter details below." });
      }
    } catch (error) {
      console.error('Error scanning passport:', error);
      setPassportFound(null);
      toast({ variant: "destructive", title: "Scan Error", description: "Failed to search for passport. Please try again." });
    }
    setScanInput('');
  }, [setPassportInfo, toast]);

  // Old paste event listener removed - now using useScannerInput hook above

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassportInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setPassportInfo(prev => ({ ...prev, sex: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setPassportInfo(prev => ({ ...prev, [name]: files[0].name }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      {/* PRIMARY SEARCH SECTION - First Field */}
      <Card className="overflow-visible border-2 border-emerald-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="text-xl">📷 Step 1: Scan Passport</CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-semibold">Use PrehKeyTec MRZ scanner</span> to auto-populate all passport details.
            <span className="text-slate-500 text-xs block mt-0.5">Manual entry available below if scanner not working</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Primary Search Input - Now positioned as fallback */}
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">Manual Search (if scanner unavailable):</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter Passport Number (e.g., P1234567)"
                  className="text-base h-11 border-2 border-slate-300 focus:border-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                size="default"
                className="bg-slate-600 hover:bg-slate-700 px-6"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Search Result Feedback */}
            {passportFound === true && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">✅</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 text-lg">Passport Found in Database!</h3>
                    <p className="text-green-700 text-sm mt-1">
                      Existing passport record loaded for <strong>{passportInfo.givenName} {passportInfo.surname}</strong>
                    </p>
                    <p className="text-green-600 text-xs mt-2">
                      All fields have been auto-populated. Review and proceed to payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {passportFound === false && (
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📋</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 text-lg">New Passport - Not in Database</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Passport number <strong>{searchQuery}</strong> not found in system.
                    </p>
                    <p className="text-blue-600 text-xs mt-2">
                      Please enter passport details below to create a new record.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-500 font-semibold">Or Use MRZ Scanner</span>
            </div>
          </div>

          {/* PrehKeyTec Hardware Scanner Status */}
          <ScannerStatusFull
            connectionState={webSerialScanner.connectionState}
            scanCount={webSerialScanner.scanCount}
            error={webSerialScanner.error}
            onConnect={webSerialScanner.connect}
            onDisconnect={webSerialScanner.disconnect}
            onReconnect={webSerialScanner.reconnect}
            isSupported={webSerialScanner.isSupported}
            reconnectAttempt={webSerialScanner.reconnectAttempt}
          />

          {/* Scanner Ready Indicator */}
          {webSerialScanner.isReady && (
            <Card className="bg-emerald-50 border-2 border-emerald-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-emerald-900">Scanner Ready</h3>
                    <p className="text-emerald-700 text-sm">
                      Scan passport MRZ to auto-fill data.
                      {webSerialScanner.scanCount > 0 && (
                        <span className="ml-2 font-semibold">({webSerialScanner.scanCount} scanned)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback keyboard wedge scanner indicator */}
          {!webSerialScanner.isSupported && isScannerActive && (
            <Card className="bg-amber-50 border-2 border-amber-400 animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📷</div>
                  <div>
                    <h3 className="font-bold text-amber-900">Keyboard Scanner Active</h3>
                    <p className="text-amber-700 text-sm">
                      Using keyboard wedge mode. Scan passport MRZ or barcode now.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* PASSPORT DETAILS FORM - Only show after search or for manual entry */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Step 2: Passport Details</CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            {passportFound === true
              ? "Review auto-populated information"
              : passportFound === false
                ? "Enter passport details to create new record"
                : "Search for passport first, or enter details manually"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="passportNumber" className="font-semibold text-slate-700">Passport Number *</label>
              <Input
                id="passportNumber"
                name="passportNumber"
                placeholder="e.g., P1234567"
                className={`mt-1 ${passportFound === true && missingFields.length === 0 ? 'bg-slate-100' : ''}`}
                value={passportInfo.passportNumber || ''}
                onChange={handleInputChange}
                readOnly={passportFound === true && missingFields.length === 0}
                required
              />
              {passportFound === true && missingFields.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">✓ Loaded from database</p>
              )}
            </div>
            <div>
              <label htmlFor="nationality" className="font-semibold text-slate-700">Nationality *</label>
              <Input
                id="nationality"
                name="nationality"
                placeholder="Type to search..."
                className="mt-1"
                value={passportInfo.nationality || ''}
                onChange={handleInputChange}
                list="nationalities-list"
                autoComplete="off"
                required
              />
              <datalist id="nationalities-list">
                <option value="Afghan" />
                <option value="Albanian" />
                <option value="Algerian" />
                <option value="American" />
                <option value="Andorran" />
                <option value="Angolan" />
                <option value="Argentinian" />
                <option value="Armenian" />
                <option value="Australian" />
                <option value="Austrian" />
                <option value="Azerbaijani" />
                <option value="Bahamian" />
                <option value="Bahraini" />
                <option value="Bangladeshi" />
                <option value="Barbadian" />
                <option value="Belarusian" />
                <option value="Belgian" />
                <option value="Belizean" />
                <option value="Beninese" />
                <option value="Bhutanese" />
                <option value="Bolivian" />
                <option value="Bosnian" />
                <option value="Brazilian" />
                <option value="British" />
                <option value="Bruneian" />
                <option value="Bulgarian" />
                <option value="Burkinabe" />
                <option value="Burmese" />
                <option value="Burundian" />
                <option value="Cambodian" />
                <option value="Cameroonian" />
                <option value="Canadian" />
                <option value="Cape Verdean" />
                <option value="Central African" />
                <option value="Chadian" />
                <option value="Chilean" />
                <option value="Chinese" />
                <option value="Colombian" />
                <option value="Comorian" />
                <option value="Congolese" />
                <option value="Costa Rican" />
                <option value="Croatian" />
                <option value="Cuban" />
                <option value="Cypriot" />
                <option value="Czech" />
                <option value="Danish" />
                <option value="Djiboutian" />
                <option value="Dominican" />
                <option value="Dutch" />
                <option value="East Timorese" />
                <option value="Ecuadorean" />
                <option value="Egyptian" />
                <option value="Emirati" />
                <option value="English" />
                <option value="Equatorial Guinean" />
                <option value="Eritrean" />
                <option value="Estonian" />
                <option value="Ethiopian" />
                <option value="Fijian" />
                <option value="Filipino" />
                <option value="Finnish" />
                <option value="French" />
                <option value="Gabonese" />
                <option value="Gambian" />
                <option value="Georgian" />
                <option value="German" />
                <option value="Ghanaian" />
                <option value="Greek" />
                <option value="Grenadian" />
                <option value="Guatemalan" />
                <option value="Guinean" />
                <option value="Guyanese" />
                <option value="Haitian" />
                <option value="Honduran" />
                <option value="Hungarian" />
                <option value="Icelandic" />
                <option value="Indian" />
                <option value="Indonesian" />
                <option value="Iranian" />
                <option value="Iraqi" />
                <option value="Irish" />
                <option value="Israeli" />
                <option value="Italian" />
                <option value="Ivorian" />
                <option value="Jamaican" />
                <option value="Japanese" />
                <option value="Jordanian" />
                <option value="Kazakhstani" />
                <option value="Kenyan" />
                <option value="Kuwaiti" />
                <option value="Kyrgyz" />
                <option value="Laotian" />
                <option value="Latvian" />
                <option value="Lebanese" />
                <option value="Liberian" />
                <option value="Libyan" />
                <option value="Liechtensteiner" />
                <option value="Lithuanian" />
                <option value="Luxembourger" />
                <option value="Macedonian" />
                <option value="Malagasy" />
                <option value="Malawian" />
                <option value="Malaysian" />
                <option value="Maldivian" />
                <option value="Malian" />
                <option value="Maltese" />
                <option value="Mauritanian" />
                <option value="Mauritian" />
                <option value="Mexican" />
                <option value="Micronesian" />
                <option value="Moldovan" />
                <option value="Monacan" />
                <option value="Mongolian" />
                <option value="Montenegrin" />
                <option value="Moroccan" />
                <option value="Mozambican" />
                <option value="Namibian" />
                <option value="Nauruan" />
                <option value="Nepalese" />
                <option value="New Zealander" />
                <option value="Nicaraguan" />
                <option value="Nigerian" />
                <option value="Nigerien" />
                <option value="North Korean" />
                <option value="Norwegian" />
                <option value="Omani" />
                <option value="Pakistani" />
                <option value="Palauan" />
                <option value="Palestinian" />
                <option value="Panamanian" />
                <option value="Papua New Guinean" />
                <option value="Paraguayan" />
                <option value="Peruvian" />
                <option value="Polish" />
                <option value="Portuguese" />
                <option value="Qatari" />
                <option value="Romanian" />
                <option value="Russian" />
                <option value="Rwandan" />
                <option value="Saint Lucian" />
                <option value="Salvadoran" />
                <option value="Samoan" />
                <option value="San Marinese" />
                <option value="Saudi" />
                <option value="Scottish" />
                <option value="Senegalese" />
                <option value="Serbian" />
                <option value="Seychellois" />
                <option value="Sierra Leonean" />
                <option value="Singaporean" />
                <option value="Slovak" />
                <option value="Slovenian" />
                <option value="Solomon Islander" />
                <option value="Somali" />
                <option value="South African" />
                <option value="South Korean" />
                <option value="South Sudanese" />
                <option value="Spanish" />
                <option value="Sri Lankan" />
                <option value="Sudanese" />
                <option value="Surinamese" />
                <option value="Swazi" />
                <option value="Swedish" />
                <option value="Swiss" />
                <option value="Syrian" />
                <option value="Taiwanese" />
                <option value="Tajik" />
                <option value="Tanzanian" />
                <option value="Thai" />
                <option value="Togolese" />
                <option value="Tongan" />
                <option value="Trinidadian" />
                <option value="Tunisian" />
                <option value="Turkish" />
                <option value="Turkmen" />
                <option value="Tuvaluan" />
                <option value="Ugandan" />
                <option value="Ukrainian" />
                <option value="Uruguayan" />
                <option value="Uzbekistani" />
                <option value="Vanuatuan" />
                <option value="Venezuelan" />
                <option value="Vietnamese" />
                <option value="Welsh" />
                <option value="Yemeni" />
                <option value="Zambian" />
                <option value="Zimbabwean" />
              </datalist>
            </div>
            <div>
              <label htmlFor="surname" className="font-semibold text-slate-700">Surname *</label>
              <Input
                id="surname"
                name="surname"
                placeholder="e.g., Smith"
                className="mt-1"
                value={passportInfo.surname || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="givenName" className="font-semibold text-slate-700">Given Name *</label>
              <Input
                id="givenName"
                name="givenName"
                placeholder="e.g., John"
                className="mt-1"
                value={passportInfo.givenName || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="dob" className="font-semibold text-slate-700">Date of Birth</label>
              <Input
                id="dob"
                name="dob"
                type="date"
                placeholder="dd/mm/yyyy"
                className="mt-1"
                value={passportInfo.dob || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="sex" className="font-semibold text-slate-700">Sex *</label>
              <Select name="sex" onValueChange={handleSelectChange} value={passportInfo.sex || ''}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="dateOfExpiry" className="font-semibold text-slate-700">Passport Expiry Date *</label>
              <Input
                id="dateOfExpiry"
                name="dateOfExpiry"
                type="date"
                placeholder="dd/mm/yyyy"
                className="mt-1"
                value={passportInfo.dateOfExpiry || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className="font-semibold text-slate-700">Email Address (Optional)</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="customer@example.com (for sending voucher via email)"
                className="mt-1"
                value={passportInfo.email || ''}
                onChange={handleInputChange}
              />
              <p className="text-xs text-slate-500 mt-1">
                Provide customer email to send voucher electronically
              </p>
            </div>
          </form>

          {passportFound === true && missingFields.length === 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ <strong>Existing Passport Record:</strong> This passport already exists in the database.
                All information has been retrieved automatically.
              </p>
            </div>
          )}

          {passportFound === true && missingFields.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    Incomplete Passport Record
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    The following fields are missing from the database record: <strong>{missingFields.join(', ')}</strong>
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    Please fill in the missing fields manually. The passport record will be updated when you complete this purchase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {passportFound === false && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📋 <strong>New Passport:</strong> This passport will be added to the database when you complete the purchase.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end mt-8">
        <Button
          onClick={onNext}
          size="lg"
          disabled={!passportInfo.passportNumber || !passportInfo.nationality || !passportInfo.surname || !passportInfo.givenName}
          className="bg-gradient-to-r from-emerald-500 to-teal-600"
        >
          Proceed to Payment →
        </Button>
      </div>
    </motion.div>
  );
};

const PaymentStep = ({ onNext, onBack, passportInfo, setPaymentData }) => {
  const { toast } = useToast();
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [amount, setAmount] = useState(50);
  const [discount, setDiscount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(50);

  // POS Terminal transaction tracking (PCI-compliant - NO card data stored)
  const [posTerminalId, setPosTerminalId] = useState('');
  const [posTransactionRef, setPosTransactionRef] = useState('');
  const [posApprovalCode, setPosApprovalCode] = useState('');
  const [cardLastFour, setCardLastFour] = useState(''); // Only last 4 digits

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadPaymentModes = async () => {
      const modes = await getPaymentModes();
      const activeModes = modes.filter(m => m.active);
      setPaymentModes(activeModes);
      if (activeModes.length > 0) {
        setSelectedMode(activeModes[0].name);
      }
    };
    loadPaymentModes();
  }, []);

  // Refresh payment modes when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const loadPaymentModes = async () => {
          const modes = await getPaymentModes();
          const activeModes = modes.filter(m => m.active);
          setPaymentModes(activeModes);
          // Don't change selected mode if user has already selected one
          if (activeModes.length > 0 && !selectedMode) {
            setSelectedMode(activeModes[0].name);
          }
        };
        loadPaymentModes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedMode]);

  const amountAfterDiscount = amount - (amount * (discount / 100));
  const returnedAmount = collectedAmount - amountAfterDiscount;
  const selectedModeObj = paymentModes.find(m => m.name === selectedMode);
  const requiresCardDetails = selectedModeObj?.collectCardDetails;

  const handleProceed = async () => {
    if (!selectedMode) {
      toast({ variant: "destructive", title: "No Payment Mode", description: "Please select a payment mode." });
      return;
    }

    if (collectedAmount < amountAfterDiscount) {
      toast({ variant: "destructive", title: "Insufficient Amount", description: "Collected amount is less than the total." });
      return;
    }

    // For card/POS payments, require transaction reference
    if (requiresCardDetails && !posTransactionRef) {
      toast({
        variant: "destructive",
        title: "Transaction Reference Required",
        description: "Please enter the POS transaction reference number from the receipt."
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Check if this is an online payment gateway
      const isOnlineGateway = selectedMode === 'KINA BANK IPG' || selectedMode === 'BSP IPG';

      if (isOnlineGateway) {
        // Handle online payment gateway
        const gatewayName = selectedMode === 'KINA BANK IPG' ? GATEWAY_NAMES.KINA_BANK : GATEWAY_NAMES.BSP;

        // Check if gateway is active
        const isActive = await isGatewayActive(gatewayName);
        if (!isActive) {
          toast({
            variant: "destructive",
            title: "Gateway Not Available",
            description: `${selectedMode} is not currently active. Please select another payment method.`
          });
          setIsProcessing(false);
          return;
        }

        // Initiate online payment
        const paymentResult = await processOnlinePayment(
          gatewayName,
          {
            amount: amountAfterDiscount,
            currency: 'PGK',
            customerEmail: passportInfo.email || '',
            customerName: `${passportInfo.givenName} ${passportInfo.surname}`,
            passportNumber: passportInfo.passportNumber,
            nationality: passportInfo.nationality,
            description: `PNG Green Fees - ${passportInfo.passportNumber}`,
            returnUrl: `${window.location.origin}/payment-callback`,
            cancelUrl: `${window.location.origin}/individual-purchase`
          },
          null // userId will be set in service from auth context
        );

        // Redirect to payment gateway
        if (paymentResult.success && paymentResult.paymentUrl) {
          toast({
            title: "Redirecting to Payment Gateway",
            description: "You will be redirected to complete your payment securely."
          });

          // Store payment intent for later retrieval
          sessionStorage.setItem('payment_merchant_ref', paymentResult.merchantReference);
          sessionStorage.setItem('payment_passport_info', JSON.stringify(passportInfo));

          // Redirect to gateway payment page
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Failed to initiate payment gateway session');
        }

      } else {
        // Traditional payment method (cash, bank transfer, etc.)
        setPaymentData({
          paymentMethod: selectedMode,
          amount: amountAfterDiscount,
          discount,
          collectedAmount,
          returnedAmount: returnedAmount > 0 ? returnedAmount : 0,
          // PCI-compliant: Only store transaction references
          cardLastFour: requiresCardDetails ? cardLastFour : null,
          posTerminalId: requiresCardDetails ? posTerminalId : null,
          posTransactionRef: requiresCardDetails ? posTransactionRef : null,
          posApprovalCode: requiresCardDetails ? posApprovalCode : null,
        });

        toast({ title: "Payment Accepted", description: `Payment of PGK ${amountAfterDiscount.toFixed(2)} processed successfully.` });

        setTimeout(() => {
          setIsProcessing(false);
          onNext();
        }, 800);
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again."
      });
      setIsProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <Card>
        <CardHeader>
          <CardTitle>
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total Amount (PGK)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Amount After Discount</Label>
              <Input value={amountAfterDiscount.toFixed(2)} readOnly className="bg-slate-100 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Collected Amount (PGK)</Label>
              <Input type="number" value={collectedAmount} onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Change/Returned Amount</Label>
              <Input value={returnedAmount > 0 ? returnedAmount.toFixed(2) : '0.00'} readOnly className="bg-slate-100" />
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentModes.map(mode => (
                <div key={mode.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value={mode.name} id={mode.name} />
                  <Label htmlFor={mode.name} className="font-normal cursor-pointer flex-1">{mode.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* POS Terminal Transaction Details (Simplified) */}
          {requiresCardDetails && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-900">
                  <strong>💳 POS Terminal Payment:</strong> Enter details from the POS terminal receipt.
                </p>
              </div>
              <h3 className="font-semibold text-slate-700">POS Terminal Transaction Details</h3>
              <div className="space-y-3">
                <div>
                  <Label>Transaction Reference Number *</Label>
                  <Input
                    placeholder="e.g., TXN123456789 (from POS receipt)"
                    value={posTransactionRef}
                    onChange={(e) => setPosTransactionRef(e.target.value)}
                    className="text-base h-12"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Required for transaction tracking and reconciliation</p>
                </div>
                <div>
                  <Label>Approval Code</Label>
                  <Input
                    placeholder="e.g., APP123 (from receipt)"
                    value={posApprovalCode}
                    onChange={(e) => setPosApprovalCode(e.target.value)}
                    className="text-base h-12"
                  />
                  <p className="text-xs text-slate-500 mt-1">Approval code from POS terminal (optional)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" size="lg" disabled={isProcessing}>
          ← Back
        </Button>
        <Button onClick={handleProceed} size="lg" disabled={isProcessing} className="bg-gradient-to-r from-emerald-500 to-teal-600">
          {isProcessing ? 'Processing...' : 'Process Payment →'}
        </Button>
      </div>
    </motion.div>
  );
};

const VoucherStep = ({ onBack, passportInfo, paymentData, voucher }) => {
  const { toast } = useToast();
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState(passportInfo.email || '');
  const [isEmailing, setIsEmailing] = useState(false);

  const handleEmailVoucher = async () => {
    // Open dialog to enter/confirm email
    setShowEmailDialog(true);
  };

  const handlePrintVoucher = () => {
    // Generate barcode
    let barcodeDataUrl = '';
    try {
      const canvas = document.createElement('canvas');
      const JsBarcode = require('jsbarcode');
      JsBarcode(canvas, voucher.voucher_code, {
        format: 'CODE128',
        width: 5,
        height: 120,
        displayValue: false,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
      barcodeDataUrl = canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Barcode generation error:', error);
    }

    const printWindow = window.open('', '_blank');
    const now = new Date();
    const generatedOn = `${now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}, ${now.toLocaleTimeString()}`;
    const passportNumber = voucher.passport_number || null;
    const registrationUrl = `https://pnggreenfees.gov.pg/voucher/register/${voucher.voucher_code}`;

    const voucherHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Green Card - ${voucher.voucher_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            background: #ffffff;
            padding: 30px 20px;
          }
          .page {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            padding: 36px 48px 56px 48px;
          }
          .header-logos {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 12px;
          }
          .logo-image {
            width: 110px;
            height: 110px;
            object-fit: contain;
          }
          h1.title {
            text-align: center;
            color: #2d8a34;
            font-size: 28px;
            margin: 12px 0 6px 0;
            letter-spacing: 1px;
          }
          .divider {
            height: 3px;
            background: #2d8a34;
            width: 100%;
            margin: 12px 0 20px 0;
          }
          .subtitle {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 26px;
          }
          .row {
            display: flex;
            justify-content: center;
            gap: 8px;
            font-size: 18px;
            margin-bottom: 32px;
          }
          .label {
            font-weight: bold;
          }
          .barcode-block {
            text-align: center;
            margin: 6px 0 18px 0;
          }
          .barcode-img {
            display: block;
            margin: 0 auto 10px auto;
          }
          .barcode-code {
            font-size: 16px;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
          }
          .register {
            text-align: center;
            font-size: 18px;
            margin-top: 12px;
            font-weight: bold;
          }
          .link {
            text-align: center;
            font-size: 10px;
            margin-top: 8px;
            color: #444;
            word-break: break-all;
          }
          .footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #444;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header-logos">
            <img src="/assets/logos/ccda-logo.png" alt="CCDA Logo" class="logo-image" />
          </div>
          <h1 class="title">GREEN CARD</h1>
          <div class="divider"></div>
          <div class="subtitle">Foreign Passport Holder</div>
          <div class="row">
            <span class="label">Coupon Number:</span>
            <span>${voucher.voucher_code}</span>
          </div>
          ${passportNumber ? `
            <div class="row" style="margin-bottom: 16px;">
              <span class="label">Registered Passport:</span>
              <span>${passportNumber}</span>
            </div>
          ` : ''}
          <div class="barcode-block">
            ${barcodeDataUrl ? `<img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode" />` : ''}
          </div>
          ${!passportNumber ? `
            <div class="register">Scan to Register</div>
            <div class="link">${registrationUrl}</div>
          ` : ''}
          <div class="footer">
            <div></div>
            <div>Generated on ${generatedOn}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(voucherHTML);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address."
      });
      return;
    }

    setIsEmailing(true);
    try {
      // Call API to send voucher email
      await emailVoucher(voucher.voucher_code, emailInput);
      toast({
        title: "Email Sent",
        description: `Voucher has been sent to ${emailInput}`
      });
      setShowEmailDialog(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again."
      });
    } finally {
      setIsEmailing(false);
    }
  };

  if (!voucher) {
    return (
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">Generating voucher...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <Card className="border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-700">
            ✓ Voucher Generated Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <p className="text-green-800 font-semibold">
              Exit pass voucher has been created for {passportInfo.givenName} {passportInfo.surname}
            </p>
          </div>

          {/* Voucher Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Passport Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Passport Number:</span>
                  <span className="font-semibold">{voucher.passport_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-semibold">{passportInfo.givenName} {passportInfo.surname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nationality:</span>
                  <span className="font-semibold">{passportInfo.nationality}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Voucher Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Voucher Code:</span>
                  <span className="font-mono font-bold text-green-600">{voucher.voucher_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold">PGK {voucher.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="font-semibold">{voucher.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valid Until:</span>
                  <span className="font-semibold">{new Date(voucher.valid_until).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              onClick={handlePrintVoucher}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              🖨️ Print Voucher
            </Button>
            <Button
              onClick={handleEmailVoucher}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={isEmailing}
            >
              {isEmailing ? 'Sending...' : 'Email Voucher'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" size="lg">
          ← Create Another
        </Button>
        <Button onClick={() => window.location.href = '/'} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600">
          Done
        </Button>
      </div>

      {/* Print Dialog - Uses same template as /buy-online (passport already registered) */}
      <VoucherPrint
        voucher={{
          ...voucher,
          customer_name: `${passportInfo.givenName} ${passportInfo.surname}`,
          nationality: passportInfo.nationality
        }}
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        voucherType="Individual"
        showRegistrationLink={false}
      />

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Voucher</DialogTitle>
            <DialogDescription>
              Enter email address to send the voucher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isEmailing}
                autoFocus
                className="bg-white"
              />
              <p className="text-xs text-slate-500">
                {passportInfo.email
                  ? `Pre-filled with: ${passportInfo.email}. You can change it if needed.`
                  : 'Enter customer email address to send voucher'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendEmail}
                disabled={isEmailing || !emailInput}
                className="flex-1"
              >
                {isEmailing ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={isEmailing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const IndividualPurchase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [passportInfo, setPassportInfo] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  // Handle pre-filled data from camera scan
  useEffect(() => {
    if (location.state?.prefillData && location.state?.fromScan) {
      setPassportInfo(location.state.prefillData);
      toast({
        title: "Passport Data Loaded",
        description: `Scanned data for ${location.state.prefillData.givenName} ${location.state.prefillData.surname} has been loaded.`,
      });
    }
  }, [location.state, toast]);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  // Generate voucher when moving to step 2
  useEffect(() => {
    if (step === 2 && paymentData && !voucher && !isCreatingVoucher) {
      createVoucherAndPassport();
    }
  }, [step, paymentData, voucher, isCreatingVoucher]);

  const createVoucherAndPassport = async () => {
    setIsCreatingVoucher(true);
    try {
      console.log('Starting voucher creation...');
      console.log('Passport info:', passportInfo);
      console.log('Payment data:', paymentData);
      console.log('User:', user);

      // First, check if passport exists or create it
      // Use passport_number + nationality for accurate lookup (passport numbers are NOT globally unique)
      let passport = await getPassportByNumberAndNationality(
        passportInfo.passportNumber,
        passportInfo.nationality
      );
      console.log('Found passport:', passport);

      if (!passport) {
        console.log('Creating new passport...');
        // Create passport if it doesn't exist
        passport = await createPassport({
          passportNumber: passportInfo.passportNumber,
          nationality: passportInfo.nationality,
          surname: passportInfo.surname,
          givenName: passportInfo.givenName,
          dob: passportInfo.dob,
          sex: passportInfo.sex,
          dateOfExpiry: passportInfo.dateOfExpiry,
        }, user?.id);
        console.log('Created passport:', passport);
      }

      // Create individual purchase voucher
      const purchaseData = {
        passportId: passport.id,
        passportNumber: passport.passportNo || passport.passport_number || passportInfo.passportNumber,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        cardLastFour: paymentData.cardLastFour,
        nationality: passport.nationality,
        discount: paymentData.discount || 0,
        collectedAmount: paymentData.collectedAmount,
        returnedAmount: paymentData.returnedAmount || 0,
      };
      console.log('Purchase data:', purchaseData);

      const createdVoucher = await createIndividualPurchase(purchaseData, user?.id);
      console.log('Created voucher:', createdVoucher);
      setVoucher(createdVoucher);

      toast({
        title: "Success!",
        description: "Voucher generated successfully.",
      });
    } catch (error) {
      console.error('Error creating voucher:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        passportInfo,
        paymentData,
        user
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate voucher: ${error.message || 'Please try again.'}`,
      });
      setStep(1); // Go back to payment step
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setPassportInfo({});
    setPaymentData(null);
    setVoucher(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Home/Back Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/app/agent')}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>
      <StepIndicator currentStep={step} />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <PassportDetailsStep
            key="step0"
            onNext={handleNext}
            setPassportInfo={setPassportInfo}
            passportInfo={passportInfo}
          />
        )}
        {step === 1 && (
          <PaymentStep
            key="step1"
            onNext={handleNext}
            onBack={handleBack}
            passportInfo={passportInfo}
            setPaymentData={setPaymentData}
          />
        )}
        {step === 2 && (
          <VoucherStep
            key="step2"
            onBack={resetFlow}
            passportInfo={passportInfo}
            paymentData={paymentData}
            voucher={voucher}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndividualPurchase;
