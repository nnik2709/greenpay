import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { initiateBSPPayment } from '@/lib/bspPaymentService';
import api from '@/lib/api/client';

/**
 * Public Voucher Purchase Page
 * NO AUTHENTICATION REQUIRED
 * Optimized for PNG low-bandwidth/unreliable networks
 */

const PublicVoucherPurchase = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState(() => {
    // Load from localStorage if available (resume after connection drop)
    const saved = localStorage.getItem('pending-purchase');
    return saved ? JSON.parse(saved) : {
      email: '',
      emailConfirm: '', // Phase 2: Email confirmation
      phone: '',
      quantity: 1,
      preferSMS: true, // SMS-first for PNG
      // Optional passport fields
      includePassport: false,
      passportNumber: '',
      surname: '',
      givenName: '',
      dateOfBirth: '',
      nationality: 'Papua New Guinea',
      sex: 'Male'
    };
  });

  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'online' : 'offline');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      toast({
        title: "Connection Restored",
        description: "You can now proceed with payment."
      });
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      toast({
        variant: "destructive",
        title: "Connection Lost",
        description: "Your progress is saved. We'll resume when connection is restored."
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Auto-save to localStorage (survive page reloads)
  useEffect(() => {
    localStorage.setItem('pending-purchase', JSON.stringify(formData));
    setLastSaved(new Date().toLocaleTimeString());
  }, [formData]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPNGPhone = (phone) => {
    // Auto-format PNG phone numbers
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('675')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    return cleaned;
  };

  const validateForm = () => {
    // Must have at least email OR phone
    if (!formData.email && !formData.phone) {
      toast({
        variant: "destructive",
        title: "Missing Contact Info",
        description: "Please provide either email or mobile number (or both)"
      });
      return false;
    }

    // Validate PNG phone number format if provided
    if (formData.phone) {
      const cleaned = formatPNGPhone(formData.phone);
      if (cleaned.length < 7 || cleaned.length > 8) {
        toast({
          variant: "destructive",
          title: "Invalid Phone Number",
          description: "PNG mobile numbers should be 7-8 digits (e.g., 7XXX XXXX)"
        });
        return false;
      }
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address"
      });
      return false;
    }

    // Phase 2: Validate email confirmation matches
    if (formData.email && formData.email !== formData.emailConfirm) {
      toast({
        variant: "destructive",
        title: "Email Mismatch",
        description: "Email addresses do not match. Please check and try again."
      });
      return false;
    }

    // Validate passport fields if includePassport is checked
    if (formData.includePassport) {
      if (!formData.passportNumber || !formData.surname || !formData.givenName) {
        toast({
          variant: "destructive",
          title: "Incomplete Passport Details",
          description: "Please provide passport number, surname, and given name"
        });
        return false;
      }

      // Validate passport number format (basic check)
      if (formData.passportNumber.length < 6) {
        toast({
          variant: "destructive",
          title: "Invalid Passport Number",
          description: "Passport number seems too short"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check network status
    if (networkStatus === 'offline') {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your connection and try again. Your form data is saved."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number for PNG
      const formattedPhone = formData.phone ? `+675${formatPNGPhone(formData.phone)}` : null;

      // Prepare passport data if included
      let passportData = null;
      if (formData.includePassport) {
        passportData = {
          passportNumber: formData.passportNumber.toUpperCase().trim(),
          surname: formData.surname.toUpperCase().trim(),
          givenName: formData.givenName.toUpperCase().trim(),
          dateOfBirth: formData.dateOfBirth || null,
          nationality: formData.nationality,
          sex: formData.sex
        };
      }

      // Create purchase session (lightweight - just contact info)
      const sessionData = {
        customerEmail: formData.email || null,
        customerPhone: formattedPhone,
        quantity: formData.quantity,
        amount: 50 * formData.quantity,
        deliveryMethod: formData.preferSMS ? 'SMS+Email' : 'Email',
        currency: 'PGK',
        passportData: passportData // Include passport data if provided
      };

      console.log('Creating payment session:', sessionData);

      // Call new unified payment endpoint
      const response = await api.post('/public-purchases/create-payment-session', {
        ...sessionData,
        returnUrl: `${window.location.origin}/purchase/callback`,
        cancelUrl: `${window.location.origin}/buy-voucher`
      });

      console.log('Payment API response:', response.data);

      // Handle both response formats (with/without success wrapper)
      const responseData = response.data.success ? response.data.data : response.data;

      if (!responseData || !responseData.paymentUrl) {
        const errorMsg = response.data?.error || response.data?.message || 'Failed to create payment session';
        console.error('Payment session creation failed:', response.data);
        throw new Error(errorMsg);
      }

      const { sessionId, paymentUrl, gateway } = responseData;

      // Store session ID for recovery
      localStorage.setItem('purchase-session-id', sessionId);
      localStorage.setItem('purchase-session-data', JSON.stringify(responseData));

      toast({
        title: "Session Created",
        description: `Redirecting to ${gateway === 'stripe' ? 'Stripe' : 'payment'} secure gateway...`
      });

      console.log('Payment session created:', { sessionId, gateway, paymentUrl });

      // Redirect to payment gateway (Stripe, BSP, or Kina)
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1000);

    } catch (error) {
      console.error('Purchase session creation error:', error);

      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message || "Unable to initiate payment. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = 50 * formData.quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              PNG Green Fees
            </h1>
          </motion.div>
          <p className="text-lg text-slate-600">
            Purchase Your Exit Pass Voucher Online
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Pay now, register your passport details later
          </p>
        </div>

        {/* Network Status Banner */}
        {networkStatus === 'offline' && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-300 animate-pulse">
            <AlertDescription className="text-yellow-900">
              <div className="flex items-center gap-2">
                <div>
                  <p className="font-semibold">No Internet Connection</p>
                  <p className="text-sm">Your form data is saved. Payment will be available when connection is restored.</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="text-center mb-4">
            <p className="text-xs text-slate-400">
              Form auto-saved at {lastSaved}
            </p>
          </div>
        )}

        {/* Purchase Form */}
        <Card className="shadow-xl border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle>Purchase Voucher</CardTitle>
            <CardDescription>
              Complete payment and receive your voucher code via SMS and email
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address {!formData.phone && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="text-lg"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500">
                  Voucher code and receipt will be sent to this email
                </p>
              </div>

              {/* Email Confirmation Field - Phase 2 */}
              {formData.email && (
                <div className="space-y-2">
                  <Label htmlFor="emailConfirm">
                    Confirm Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emailConfirm"
                    type="email"
                    value={formData.emailConfirm}
                    onChange={(e) => handleFieldChange('emailConfirm', e.target.value)}
                    placeholder="your@email.com (re-enter to confirm)"
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                  {formData.emailConfirm && formData.email !== formData.emailConfirm && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠ Emails do not match
                    </p>
                  )}
                  {formData.emailConfirm && formData.email === formData.emailConfirm && (
                    <p className="text-xs text-emerald-600 font-medium">
                      ✓ Emails match
                    </p>
                  )}
                </div>
              )}

              {/* Phone Field - CRITICAL for PNG */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Mobile Number (PNG) <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-slate-100 px-3 rounded-md border">
                    <span className="text-slate-600">+675</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="7XXX XXXX"
                    className="text-lg flex-1"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-emerald-600 font-medium">
                  Voucher code will be sent via SMS (works on all phones)
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Number of Vouchers</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 1)}
                  className="text-lg"
                  disabled={isSubmitting || formData.includePassport}
                />
                <p className="text-xs text-slate-500">
                  {formData.includePassport ? 'One voucher per passport' : 'Each voucher is for one traveler (PGK 50.00 per voucher)'}
                </p>
              </div>

              {/* Option to include passport details */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePassport"
                    checked={formData.includePassport}
                    onCheckedChange={(checked) => {
                      handleFieldChange('includePassport', checked);
                      if (checked) {
                        handleFieldChange('quantity', 1); // Force quantity to 1 when passport included
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="includePassport" className="cursor-pointer">
                    <span className="font-semibold text-emerald-700">Include passport details now</span>
                    <span className="block text-xs text-slate-500 mt-1">
                      Skip the registration step - your voucher will be ready to scan immediately!
                    </span>
                  </Label>
                </div>

                {/* Passport Fields (conditionally shown) */}
                {formData.includePassport && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4"
                  >
                    <p className="text-sm font-semibold text-emerald-900">
                      Passport Details
                    </p>

                    {/* Passport Number */}
                    <div className="space-y-2">
                      <Label htmlFor="passportNumber">
                        Passport Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="passportNumber"
                        type="text"
                        value={formData.passportNumber}
                        onChange={(e) => handleFieldChange('passportNumber', e.target.value.toUpperCase())}
                        placeholder="AB123456"
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Surname */}
                    <div className="space-y-2">
                      <Label htmlFor="surname">
                        Surname (Family Name) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="surname"
                        type="text"
                        value={formData.surname}
                        onChange={(e) => handleFieldChange('surname', e.target.value.toUpperCase())}
                        placeholder="DOE"
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Given Name */}
                    <div className="space-y-2">
                      <Label htmlFor="givenName">
                        Given Name(s) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="givenName"
                        type="text"
                        value={formData.givenName}
                        onChange={(e) => handleFieldChange('givenName', e.target.value.toUpperCase())}
                        placeholder="JOHN MICHAEL"
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Nationality */}
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => handleFieldChange('nationality', e.target.value)}
                        placeholder="Papua New Guinea"
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Sex */}
                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <Select
                        value={formData.sex}
                        onValueChange={(value) => handleFieldChange('sex', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Alert className="bg-white border-emerald-300">
                      <AlertDescription className="text-sm text-emerald-900">
                        <strong>Benefits:</strong>
                        <ul className="mt-2 space-y-1 ml-4 list-disc">
                          <li>No registration step required</li>
                          <li>Voucher ready to scan immediately</li>
                          <li>Faster airport processing</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </div>

              {/* Total Amount Display */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700">Vouchers:</span>
                  <span className="font-semibold">{formData.quantity} × PGK 50.00</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-800">Total Amount:</span>
                    <span className="text-3xl font-bold text-emerald-600">
                      PGK {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <p className="font-semibold text-blue-900 mb-2">Accepted Payment Methods:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Visa / Mastercard (Debit or Credit)</li>
                    <li>• BSP Pay (Smartphone App)</li>
                    <li>• Mobile Money (*131# USSD)</li>
                    <li>• EFTPOS Online</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-3">
                    Secure payment powered by BSP Bank PNG
                  </p>
                </AlertDescription>
              </Alert>

              {/* What Happens Next */}
              <Alert className="bg-slate-50 border-slate-200">
                <AlertDescription>
                  <p className="font-semibold text-slate-800 mb-2">What Happens Next:</p>
                  {formData.includePassport ? (
                    <ol className="text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                      <li>Click "Proceed to Payment" below</li>
                      <li>You'll be redirected to secure payment page</li>
                      <li>Complete payment using your preferred method</li>
                      <li>Receive voucher code via SMS + Email instantly</li>
                      <li><strong className="text-emerald-700">Voucher ready to scan at airport - no registration needed!</strong></li>
                    </ol>
                  ) : (
                    <ol className="text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                      <li>Click "Proceed to Payment" below</li>
                      <li>You'll be redirected to secure payment page</li>
                      <li>Complete payment using your preferred method</li>
                      <li>Receive voucher code(s) via SMS + Email instantly</li>
                      <li>Register passport details using voucher code (valid 30 days)</li>
                    </ol>
                  )}
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold"
                disabled={isSubmitting || networkStatus === 'offline'}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Processing...
                  </>
                ) : networkStatus === 'offline' ? (
                  'Waiting for Connection...'
                ) : (
                  <>
                    Proceed to Secure Payment
                    <span className="ml-2">→</span>
                  </>
                )}
              </Button>

              {/* Security Notice */}
              <p className="text-xs text-center text-slate-500">
                Your payment is secured by BSP Bank PNG. We never store your card details.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 space-y-4">
          <Card className="bg-white/50 border-slate-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Important Information</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Vouchers are valid for 30 days from purchase date</li>
                <li>• You can register passport details anytime within the validity period</li>
                <li>• Each voucher is for one traveler only</li>
                <li>• Keep your voucher code safe - you'll need it for passport registration</li>
                <li>• For bulk purchases (corporate), contact support@greenpay.gov.pg</li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-slate-500">
            <p>Need help? Contact: <span className="font-semibold">+675 XXX XXXX</span></p>
            <p className="mt-2">© 2025 PNG Green Fees System. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PublicVoucherPurchase;
