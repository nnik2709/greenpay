import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NationalityCombobox } from '@/components/NationalityCombobox';
import api from '@/lib/api/client';
import { useScannerInput } from '@/hooks/useScannerInput';
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
import { Camera } from 'lucide-react';

/**
 * Public Buy Online Page - Phase 2 Enhanced
 *
 * Flow:
 * 1. Collect passport data
 * 2. Call /api/buy-online/prepare-payment (stores passport in DB session)
 * 3. Redirect to payment gateway
 * 4. Payment webhook creates passport + voucher atomically
 * 5. User returns to success page with voucher details
 *
 * NO AUTHENTICATION REQUIRED
 */

const BuyOnline = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    passportNumber: '',
    surname: '',
    givenName: '',
    dateOfBirth: '',
    nationality: 'Papua New Guinea',
    sex: 'Male',
    email: ''
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'tablet'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const hasSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || hasSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Anti-bot verification
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [startTime] = useState(Date.now());
  const [verificationQuestion] = useState(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { question: `${num1} + ${num2}`, answer: num1 + num2 };
  });

  // Hardware scanner support with MRZ parsing (for desktop with USB scanners)
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: (data) => {
      if (data.type === 'mrz') {
        // MRZ passport scan - auto-fill all passport fields
        setFormData(prev => ({
          ...prev,
          passportNumber: data.passportNumber,
          surname: data.surname,
          givenName: data.givenName,
          nationality: data.nationality,
          dateOfBirth: data.dob,
          sex: data.sex
        }));

        toast({
          title: 'Passport Scanned!',
          description: 'Passport details filled automatically.',
        });
      }
    },
    enableMrzParsing: true,
    autoFocus: false
  });

  // Camera scan handler (for mobile devices)
  const handleCameraScan = (passportData) => {
    setFormData(prev => ({
      ...prev,
      passportNumber: passportData.passportNumber,
      surname: passportData.surname,
      givenName: passportData.givenName,
      nationality: passportData.nationality,
      dateOfBirth: passportData.dateOfBirth,
      sex: passportData.sex
    }));

    setShowCameraScanner(false);

    toast({
      title: 'Passport Scanned!',
      description: 'Passport details filled automatically from camera.',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinueToPayment = async () => {
    // Validate required fields
    if (!formData.passportNumber || !formData.surname || !formData.givenName || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in passport number, surname, given name, and email.',
      });
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    // Anti-bot verification checks
    // 1. Honeypot check (hidden field should be empty)
    if (honeypot) {
      console.warn('Bot detected: honeypot filled');
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Please try again.',
      });
      return;
    }

    // 2. Time check (must spend at least 3 seconds on page)
    const timeSpent = (Date.now() - startTime) / 1000;
    if (timeSpent < 3) {
      toast({
        variant: 'destructive',
        title: 'Please Slow Down',
        description: 'Please review your information before continuing.',
      });
      return;
    }

    // 3. Math verification
    if (parseInt(verificationAnswer) !== verificationQuestion.answer) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Please answer the math question correctly.',
      });
      return;
    }

    setLoading(true);

    try {
      // Call backend to prepare payment session
      const frontendUrl = window.location.origin;

      const response = await api.post('/buy-online/prepare-payment', {
        passportData: {
          passportNumber: formData.passportNumber,
          surname: formData.surname,
          givenName: formData.givenName,
          dateOfBirth: formData.dateOfBirth,
          nationality: formData.nationality,
          sex: formData.sex
        },
        email: formData.email,
        amount: 50.00, // Green fee voucher: PGK 50.00 per passport
        returnUrl: `${frontendUrl}/payment/success?payment_session={SESSION_ID}`,
        cancelUrl: `${frontendUrl}/payment/cancelled`,
        // Verification data for backend validation
        verification: {
          answer: parseInt(verificationAnswer),
          expected: verificationQuestion.answer,
          timeSpent: (Date.now() - startTime) / 1000
        }
      });

      if (response.success) {
        // Store session ID and passport data in sessionStorage
        sessionStorage.setItem('paymentSessionId', response.data.sessionId);
        sessionStorage.setItem('passportData', JSON.stringify(formData));

        toast({
          title: 'Redirecting to Payment',
          description: 'Please complete your payment securely.',
        });

        // Redirect to payment gateway
        setTimeout(() => {
          window.location.href = response.data.paymentUrl;
        }, 1000);
      } else {
        throw new Error(response.error || 'Failed to prepare payment');
      }

    } catch (error) {
      console.error('Payment preparation error:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Unable to prepare payment. Please try again.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg-png.jpg)',
          filter: 'brightness(1.1) blur(3px)',
        }}
      />
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-white/75" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-cyan-50/60" />

      <div className="max-w-3xl mx-auto relative z-10 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            Buy Green Fee Online
          </h1>
          <p className="text-slate-600 text-lg">
            Secure credit card payment - Your passport will be registered automatically
          </p>
        </motion.div>

        {/* Back to Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Button
            onClick={() => navigate('/login')}
            variant="ghost"
            className="text-slate-600 hover:text-emerald-600"
          >
            ← Back to Login
          </Button>
        </motion.div>

        {/* Passport Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass-effect border-emerald-100 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-700">Passport Details</CardTitle>
              <CardDescription>
                Enter your passport information - it will be registered after payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mobile Camera Scanner Button */}
              {isMobile && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-blue-700 font-medium text-center">
                      Use your phone camera to scan passport MRZ
                    </p>
                    <Button
                      onClick={() => setShowCameraScanner(true)}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                      disabled={loading}
                    >
                      <Camera className="h-5 w-5" />
                      Scan Passport with Camera
                    </Button>
                    <p className="text-xs text-blue-600 text-center">
                      Point camera at the MRZ (machine-readable zone) at the bottom of your passport
                    </p>
                  </div>
                </div>
              )}

              {/* Hardware Scanner (Desktop) */}
              {!isMobile && isScannerActive && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 mb-4">
                  <p className="text-emerald-700 font-medium text-center">
                    Hardware Scanner Active - Ready to scan passport MRZ
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number *</Label>
                  <Input
                    id="passportNumber"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., AB123456"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <NationalityCombobox
                    value={formData.nationality}
                    onChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                    disabled={loading}
                    placeholder="Select nationality..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="givenName">Given Name *</Label>
                  <Input
                    id="givenName"
                    name="givenName"
                    value={formData.givenName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  Your voucher will be sent to this email. You can add another email address later.
                </p>
              </div>

              {/* Human Verification */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-3 text-slate-700">Verification</h3>
                <div className="space-y-4">
                  {/* Honeypot field (hidden from users, visible to bots) */}
                  <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                    <Input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex="-1"
                      autoComplete="off"
                    />
                  </div>

                  {/* Math question */}
                  <div className="space-y-2">
                    <Label htmlFor="verification">
                      Please solve: What is {verificationQuestion.question}?
                    </Label>
                    <Input
                      id="verification"
                      type="number"
                      value={verificationAnswer}
                      onChange={(e) => setVerificationAnswer(e.target.value)}
                      placeholder="Enter answer"
                      required
                      disabled={loading}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Secure Payment Process</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>Passport registered after payment confirmation</li>
                    <li>Voucher displayed with QR code immediately</li>
                    <li>Optional: Email or SMS voucher to yourself</li>
                    <li>If payment fails, no data is saved</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleContinueToPayment}
                  size="lg"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Preparing Payment...
                    </div>
                  ) : (
                    'Continue to Payment →'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-slate-500"
        >
          <p>Secure payment processing • Your data is encrypted and protected</p>
          <p className="mt-2">
            Amount: <span className="font-bold text-emerald-600">K 50.00</span> (Green Fee per Passport)
          </p>
        </motion.div>
      </div>

      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-white z-[9999]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 9999,
            overflow: 'auto'
          }}
        >
          <div className="p-4">
            <SimpleCameraScanner
              onScanSuccess={handleCameraScan}
              onClose={() => setShowCameraScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyOnline;
