import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api/client';
import { Users, ShoppingCart, AlertCircle } from 'lucide-react';

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

  const [formData, setFormData] = useState({
    quantity: 1,
    email: '',
    emailConfirm: '' // Phase 2: Email confirmation
  });

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

  const totalAmount = formData.quantity * 50.00;

  const handleContinueToPayment = async () => {
    // Validate email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    // Phase 2: Validate email confirmation matches
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
    if (!mathAnswer || parseInt(mathAnswer) !== mathQuestion.answer) {
      toast({
        variant: 'destructive',
        title: 'Incorrect Answer',
        description: `Please solve the math problem: ${mathQuestion.num1} + ${mathQuestion.num2} = ?`,
      });
      return;
    }

    setLoading(true);

    try {
      // Call backend to prepare payment session
      const frontendUrl = window.location.origin;

      const response = await api.post('/buy-online/prepare-payment', {
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
      });

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
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Purchase Details
              </CardTitle>
              <CardDescription>
                Select quantity and provide email to receive your voucher codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  Perfect for families or groups. Each voucher requires passport registration after purchase.
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

              {/* Important Notice */}
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-900">Registration Required</p>
                    <p className="text-sm text-blue-800">
                      After payment, you'll receive {formData.quantity} voucher code{formData.quantity > 1 ? 's' : ''}.
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
                  onClick={handleContinueToPayment}
                  size="lg"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-6 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Preparing Payment...
                    </div>
                  ) : (
                    <>Continue to Payment ({formData.quantity} × K 50.00 = K {totalAmount.toFixed(2)}) →</>
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
