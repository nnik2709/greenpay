import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
import api from '@/lib/api/client';
import { Users, ShoppingCart, AlertCircle, ArrowLeft, Camera } from 'lucide-react';

/**
 * Public Buy Online Page - Pure Approach B (Multi-Voucher Support)
 *
 * Flow:
 * 1. User selects quantity (1-5 vouchers)
 * 2. User enters email address
 * 3. Redirects to payment gateway
 * 4. Payment webhook creates N PENDING vouchers
 * 5. User returns to success page with all voucher codes
 * 6. User can register each voucher at /voucher-registration (scan passport)
 *
 * Security: ALL vouchers require passport registration before use
 * NO AUTHENTICATION REQUIRED for purchase
 */

const BuyOnline = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Step management: 1=Order, 2=Passport (if qty=1), 3=Payment redirect
  const [currentStep, setCurrentStep] = useState(1);
  const [editSessionId, setEditSessionId] = useState(null);

  const [formData, setFormData] = useState({
    quantity: 1,
    email: '',
    emailConfirm: '', // Phase 2: Email confirmation
    // Passport data (collected in step 2 for single voucher only)
    passportNumber: '',
    nationality: '',
    surname: '',
    givenName: '',
    expiryDate: ''
  });

  // Check for edit mode (coming from payment cancelled page)
  useEffect(() => {
    const isEditMode = searchParams.get('edit') === 'true';

    if (isEditMode) {
      const editData = sessionStorage.getItem('editPassportSession');

      if (editData) {
        try {
          const parsed = JSON.parse(editData);

          // Pre-fill form with saved data
          setFormData(prev => ({
            ...prev,
            quantity: parsed.quantity || 1,
            email: parsed.email || '',
            emailConfirm: parsed.email || '',
            passportNumber: parsed.passportData?.passportNumber || '',
            nationality: parsed.passportData?.nationality || '',
            surname: parsed.passportData?.surname || '',
            givenName: parsed.passportData?.givenName || '',
            expiryDate: parsed.passportData?.expiryDate || ''
          }));

          setEditSessionId(parsed.sessionId);

          // If has passport data, go directly to step 2 for editing
          if (parsed.passportData && parsed.quantity === 1) {
            setCurrentStep(2);
          }

          // Clear from sessionStorage
          sessionStorage.removeItem('editPassportSession');

          toast({
            title: 'Editing Payment Details',
            description: 'Review and update your information below.',
            className: 'bg-blue-50 border-blue-200',
          });
        } catch (error) {
          console.error('Failed to parse edit session data:', error);
        }
      }
    }
  }, [searchParams, toast]);

  // Math verification for bot protection
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [mathAnswer, setMathAnswer] = useState('');

  // Anti-bot measures
  const [honeypot, setHoneypot] = useState('');
  const [startTime] = useState(Date.now());

  // Generate math question on component mount
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setMathQuestion({ num1, num2, answer: num1 + num2 });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle passport data from camera scanner
  const handlePassportScanned = (passportData) => {
    console.log('Passport scanned:', passportData);

    setFormData(prev => ({
      ...prev,
      passportNumber: passportData.passportNumber || '',
      nationality: passportData.nationality || '',
      surname: passportData.surname || '',
      givenName: passportData.givenName || '',
      expiryDate: passportData.dateOfExpiry || ''
    }));

    toast({
      title: '✅ Passport Scanned',
      description: `${passportData.givenName} ${passportData.surname}`,
      className: 'bg-green-50 border-green-200',
    });
  };

  const totalAmount = formData.quantity * 50.00;

  // Handle Step 1: Order details → Next (passport collection if qty=1, or payment if qty>1)
  const handleContinueFromOrder = () => {
    // Validate email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    // Validate email confirmation matches
    if (formData.email !== formData.emailConfirm) {
      toast({
        variant: 'destructive',
        title: 'Email Mismatch',
        description: 'Email addresses do not match. Please check and try again.',
      });
      return;
    }

    // Validate quantity
    if (formData.quantity < 1 || formData.quantity > 5) {
      toast({
        variant: 'destructive',
        title: 'Invalid Quantity',
        description: 'Please select between 1 and 5 vouchers.',
      });
      return;
    }

    // Anti-bot verification checks
    if (honeypot) {
      console.warn('Bot detected: honeypot filled');
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Please try again.',
      });
      return;
    }

    const timeSpent = (Date.now() - startTime) / 1000;
    if (timeSpent < 3) {
      toast({
        variant: 'destructive',
        title: 'Please Slow Down',
        description: 'Please review your information before continuing.',
      });
      return;
    }

    if (!mathAnswer || parseInt(mathAnswer) !== mathQuestion.answer) {
      toast({
        variant: 'destructive',
        title: 'Incorrect Answer',
        description: `Please solve the math problem: ${mathQuestion.num1} + ${mathQuestion.num2} = ?`,
      });
      return;
    }

    // If single voucher, go to passport collection step
    if (formData.quantity === 1) {
      setCurrentStep(2);
    } else {
      // Multi-voucher: proceed directly to payment
      handleContinueToPayment();
    }
  };

  // Handle Step 2: Passport collection → Payment
  const handleContinueFromPassport = () => {
    // Validate passport data
    if (!formData.passportNumber || formData.passportNumber.trim().length < 5) {
      toast({
        variant: 'destructive',
        title: 'Invalid Passport Number',
        description: 'Please enter a valid passport number (minimum 5 characters).',
      });
      return;
    }

    if (!formData.surname || formData.surname.trim().length < 1) {
      toast({
        variant: 'destructive',
        title: 'Missing Surname',
        description: 'Please enter the surname as shown on passport.',
      });
      return;
    }

    if (!formData.givenName || formData.givenName.trim().length < 1) {
      toast({
        variant: 'destructive',
        title: 'Missing Given Name',
        description: 'Please enter the given name(s) as shown on passport.',
      });
      return;
    }

    if (!formData.nationality || formData.nationality.trim().length < 2) {
      toast({
        variant: 'destructive',
        title: 'Missing Nationality',
        description: 'Please enter nationality (e.g., USA, AUS, PNG).',
      });
      return;
    }

    if (!formData.expiryDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Expiry Date',
        description: 'Please enter passport expiry date.',
      });
      return;
    }

    // Validate expiry date is in the future
    const expiry = new Date(formData.expiryDate);
    const today = new Date();
    if (expiry < today) {
      toast({
        variant: 'destructive',
        title: 'Expired Passport',
        description: 'Passport has expired. Please use a valid passport.',
      });
      return;
    }

    // Proceed to payment
    handleContinueToPayment();
  };

  const handleContinueToPayment = async () => {
    // Note: All validation done in handleContinueFromOrder or handleContinueFromPassport
    setLoading(true);

    try {
      // Call backend to prepare payment session
      const frontendUrl = window.location.origin;

      const paymentData = {
        email: formData.email,
        quantity: formData.quantity,
        amount: totalAmount,
        returnUrl: `${frontendUrl}/payment/success?payment_session={SESSION_ID}`,
        cancelUrl: `${frontendUrl}/payment/cancelled`,
        // Math verification for bot protection
        verification: {
          mathAnswer: parseInt(mathAnswer),
          honeypot,
          startTime
        }
      };

      // Include passport data for single voucher purchases (Path 1)
      if (formData.quantity === 1 && formData.passportNumber) {
        paymentData.passportData = {
          passportNumber: formData.passportNumber.trim(),
          surname: formData.surname.trim(),
          givenName: formData.givenName.trim(),
          nationality: formData.nationality.trim().toUpperCase(),
          expiryDate: formData.expiryDate,
          // Backend will combine surname + givenName into full_name for database
          // Note: date_of_birth NOT collected per user requirements
        };
      }

      const response = await api.post('/buy-online/prepare-payment', paymentData);

      if (response.success) {
        // Store session ID in sessionStorage
        sessionStorage.setItem('paymentSessionId', response.data.sessionId);
        sessionStorage.setItem('voucherQuantity', formData.quantity);

        toast({
          title: 'Redirecting to Payment',
          description: `Processing payment for ${formData.quantity} voucher${formData.quantity > 1 ? 's' : ''}`,
        });

        // Check if this is a hosted payment page (requires form submission)
        const isHostedPayment = response.data.metadata?.isHostedPayment || false;
        const formParams = response.data.metadata?.formParams || {};

        if (isHostedPayment && Object.keys(formParams).length > 0) {
          // BSP DOKU or other hosted payment pages - submit form with parameters
          setTimeout(() => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = response.data.paymentUrl;

            // Add all form parameters as hidden inputs
            Object.entries(formParams).forEach(([key, value]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value;
              form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
          }, 1000);
        } else {
          // Stripe or other redirect-based gateways
          setTimeout(() => {
            window.location.href = response.data.paymentUrl;
          }, 1000);
        }
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
            Buy Green Fee Vouchers
          </h1>
          <p className="text-slate-600 text-lg">
            Purchase vouchers now, register passports later
          </p>
        </motion.div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass-effect border-emerald-100 shadow-xl">
            {/* Step Indicator */}
            {formData.quantity === 1 && (
              <div className="px-6 pt-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>1</div>
                    <span className="text-sm">Order</span>
                  </div>
                  <div className="w-12 h-0.5 bg-slate-200" />
                  <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>2</div>
                    <span className="text-sm">Passport</span>
                  </div>
                  <div className="w-12 h-0.5 bg-slate-200" />
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200">3</div>
                    <span className="text-sm">Payment</span>
                  </div>
                </div>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
                {currentStep === 1 && (
                  <>
                    <ShoppingCart className="h-6 w-6" />
                    Purchase Details
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <Camera className="h-6 w-6" />
                    Passport Details
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Select quantity and provide email to receive your voucher codes'}
                {currentStep === 2 && 'Scan passport or enter details manually'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* STEP 1: Order Details */}
              {currentStep === 1 && (
                <>
              {/* Quantity Selector */}
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-lg font-semibold">
                  How many vouchers? *
                </Label>
                <Select
                  value={formData.quantity.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) }))}
                  disabled={loading}
                >
                  <SelectTrigger className="text-lg h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-emerald-600" />
                          <span>{num} Voucher{num > 1 ? 's' : ''}</span>
                          <span className="text-slate-500">- K {(num * 50).toFixed(2)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-600">
                  {formData.quantity === 1
                    ? 'Passport details collected in next step for instant activation'
                    : 'Perfect for families or groups. Register each passport after payment.'}
                </p>
              </div>

              {/* Total Amount Display */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                    <p className="text-4xl font-bold text-emerald-700">
                      K {totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 mb-1">Price per voucher</p>
                    <p className="text-lg font-semibold text-slate-700">K 50.00</p>
                  </div>
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
                  className="h-12"
                />
                <p className="text-xs text-slate-500">
                  Your voucher codes will be sent to this email after payment
                </p>
              </div>

              {/* Email Confirmation Field - Phase 2 */}
              {formData.email && (
                <div className="space-y-2">
                  <Label htmlFor="emailConfirm">Confirm Email Address *</Label>
                  <Input
                    id="emailConfirm"
                    name="emailConfirm"
                    type="email"
                    value={formData.emailConfirm}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com (re-enter to confirm)"
                    required
                    disabled={loading}
                    className="h-12"
                  />
                  {formData.emailConfirm && formData.email !== formData.emailConfirm && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠ Emails do not match
                    </p>
                  )}
                  {formData.emailConfirm && formData.email === formData.emailConfirm && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Emails match
                    </p>
                  )}
                </div>
              )}

              {/* Important Notice - Different for single vs multi-voucher */}
              {formData.quantity === 1 ? (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-emerald-900">Instant Registration</p>
                      <p className="text-sm text-emerald-800">
                        For single voucher purchases, we'll collect your passport details on the next step.
                        Your voucher will be ready to use immediately after payment!
                      </p>
                      <ul className="text-xs text-emerald-700 list-disc list-inside space-y-1">
                        <li>Passport details collected upfront</li>
                        <li>No additional registration needed</li>
                        <li>Ready to use at the gate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-blue-900">Registration Required</p>
                      <p className="text-sm text-blue-800">
                        After payment, you'll receive {formData.quantity} voucher codes.
                        Each voucher must be registered with a passport at <strong>/voucher-registration</strong> before use.
                      </p>
                      <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                        <li>Pay once for multiple vouchers</li>
                        <li>Register passports at your convenience</li>
                        <li>Use camera scanner for fast registration</li>
                        <li>Each voucher linked to one passport</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Honeypot field - Hidden from users, catches bots */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Security Verification - Math Question */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-3 text-slate-700">Security Verification</h3>
                <div className="space-y-2">
                  <Label htmlFor="mathAnswer">
                    What is {mathQuestion.num1} + {mathQuestion.num2}? *
                  </Label>
                  <Input
                    id="mathAnswer"
                    type="number"
                    value={mathAnswer}
                    onChange={(e) => setMathAnswer(e.target.value)}
                    placeholder="Enter answer"
                    required
                    className="max-w-xs"
                  />
                  <p className="text-xs text-slate-500">This helps us prevent automated abuse</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleContinueFromOrder}
                  size="lg"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg"
                >
                  <span className="truncate">
                    {formData.quantity === 1 ? 'Continue to Passport Details →' : `Continue to Payment (K ${totalAmount.toFixed(2)}) →`}
                  </span>
                </Button>
              </div>
                </>
              )}

              {/* STEP 2: Passport Collection (single voucher only) */}
              {currentStep === 2 && formData.quantity === 1 && (
                <>
                  <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-900">Why collect passport now?</p>
                          <p className="text-sm text-emerald-800 mt-1">
                            For single voucher purchases, we collect passport details upfront so your voucher is ready to use immediately after payment. No additional registration needed!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Camera Scanner */}
                    <div className="border-2 border-dashed border-emerald-200 rounded-lg p-6 bg-emerald-50/30">
                      <div className="flex items-start gap-3 mb-4">
                        <Camera className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-lg text-emerald-900">Scan Passport</h3>
                          <p className="text-sm text-emerald-700 mt-1">
                            Point camera at passport photo page for automatic data extraction
                          </p>
                        </div>
                      </div>

                      <SimpleCameraScanner
                        onPassportData={handlePassportScanned}
                        buttonText="Scan Passport"
                        buttonClassName="w-full"
                      />

                      <p className="text-xs text-center text-slate-500 mt-3">
                        Or fill in the details manually below
                      </p>
                    </div>

                    {/* Manual Entry Fields */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-slate-700 border-b pb-2">
                        Passport Information
                      </h3>

                      {/* Passport Number */}
                      <div className="space-y-2">
                        <Label htmlFor="passportNumber">Passport Number *</Label>
                        <Input
                          id="passportNumber"
                          name="passportNumber"
                          type="text"
                          value={formData.passportNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., N1234567"
                          required
                          disabled={loading}
                          className="h-12 font-mono uppercase"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      {/* Surname */}
                      <div className="space-y-2">
                        <Label htmlFor="surname">Surname (Last Name) *</Label>
                        <Input
                          id="surname"
                          name="surname"
                          type="text"
                          value={formData.surname}
                          onChange={handleInputChange}
                          placeholder="As shown on passport"
                          required
                          disabled={loading}
                          className="h-12 uppercase"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      {/* Given Name */}
                      <div className="space-y-2">
                        <Label htmlFor="givenName">Given Name(s) *</Label>
                        <Input
                          id="givenName"
                          name="givenName"
                          type="text"
                          value={formData.givenName}
                          onChange={handleInputChange}
                          placeholder="First and middle names"
                          required
                          disabled={loading}
                          className="h-12 uppercase"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality *</Label>
                        <Input
                          id="nationality"
                          name="nationality"
                          type="text"
                          value={formData.nationality}
                          onChange={handleInputChange}
                          placeholder="e.g., USA, AUS, PNG"
                          required
                          disabled={loading}
                          className="h-12 uppercase"
                          style={{ textTransform: 'uppercase' }}
                          maxLength={3}
                        />
                        <p className="text-xs text-slate-500">3-letter country code</p>
                      </div>

                      {/* Expiry Date */}
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Passport Expiry Date *</Label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="h-12"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-slate-500">Must be valid (not expired)</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between gap-3 pt-6 border-t">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      size="lg"
                      disabled={loading}
                      className="px-4 sm:px-8 text-sm sm:text-base"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Back</span>
                    </Button>
                    <Button
                      onClick={handleContinueFromPassport}
                      size="lg"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                          <span className="truncate">Preparing...</span>
                        </div>
                      ) : (
                        <span className="truncate">Payment →</span>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-slate-500 space-y-2"
        >
          <p>Secure payment processing • Your data is encrypted and protected</p>
          <p className="text-emerald-600 font-semibold">
            After payment, register each voucher at /voucher-registration
          </p>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold">1</span>
                  <span><strong>Purchase:</strong> Select quantity and complete payment</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold">2</span>
                  <span><strong>Receive Codes:</strong> Get {formData.quantity} voucher code{formData.quantity > 1 ? 's' : ''} via email</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold">3</span>
                  <span><strong>Register:</strong> Visit /voucher-registration and scan passport for each voucher</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold">4</span>
                  <span><strong>Use:</strong> Present registered voucher at gate</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyOnline;
