import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Search, Mail, CheckCircle, AlertCircle, Download, Printer } from 'lucide-react';
import api from '@/lib/api/client';

/**
 * Voucher Retrieval Page - Phase 2
 *
 * Allows customers to retrieve lost vouchers using:
 * - Session ID (from payment confirmation)
 * - Email address (security verification)
 *
 * Backend endpoint: /api/voucher-retrieval/retrieve
 */

const RetrieveVouchers = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sessionId: '',
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState(null);
  const [recovered, setRecovered] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRetrieve = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.sessionId || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide both Session ID and Email Address.'
      });
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.'
      });
      return;
    }

    setLoading(true);
    setVouchers(null);
    setRecovered(false);

    try {
      const response = await api.post('/voucher-retrieval/retrieve', {
        sessionId: formData.sessionId.trim(),
        email: formData.email.trim().toLowerCase()
      });

      if (response.success) {
        setVouchers(response.vouchers);
        setRecovered(response.recovered || false);

        toast({
          title: 'Vouchers Retrieved',
          description: `Found ${response.vouchers.length} voucher(s) for this session.`
        });
      } else {
        throw new Error(response.error || 'Failed to retrieve vouchers');
      }

    } catch (error) {
      console.error('Voucher retrieval error:', error);

      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.error || error.message || 'Unable to retrieve vouchers';

      toast({
        variant: 'destructive',
        title: 'Retrieval Failed',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!vouchers || vouchers.length === 0) return;

    try {
      const sessionId = formData.sessionId;
      const response = await fetch(`/api/buy-online/voucher/${sessionId}/pdf`);

      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vouchers.length === 1
        ? `voucher-${vouchers[0].voucher_code}.pdf`
        : `vouchers-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: `Downloading ${vouchers.length} voucher(s)...`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Unable to download vouchers. Please try again.'
      });
    }
  };

  const handlePrintAll = async () => {
    if (!vouchers || vouchers.length === 0) return;

    try {
      const sessionId = formData.sessionId;
      const response = await fetch(`/api/buy-online/voucher/${sessionId}/pdf`);

      if (!response.ok) throw new Error('Failed to load PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);

    } catch (error) {
      console.error('Print error:', error);
      toast({
        variant: 'destructive',
        title: 'Print Failed',
        description: 'Unable to print vouchers. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
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
              Retrieve Your Vouchers
            </h1>
          </motion.div>
          <p className="text-lg text-slate-600">
            Lost your voucher email? Enter your details below to retrieve it.
          </p>
        </div>

        {/* Retrieval Form */}
        <Card className="shadow-xl border-emerald-200 mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6 text-emerald-600" />
              Find Your Vouchers
            </CardTitle>
            <CardDescription>
              Enter your payment session ID and email address to retrieve your vouchers
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleRetrieve} className="space-y-6">
              {/* Session ID */}
              <div className="space-y-2">
                <Label htmlFor="sessionId">
                  Payment Session ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sessionId"
                  name="sessionId"
                  type="text"
                  value={formData.sessionId}
                  onChange={handleInputChange}
                  placeholder="PGKO-XXXX-XXXX"
                  className="text-lg font-mono"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-slate-500">
                  Found in your payment confirmation email or payment receipt
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="text-lg"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-slate-500">
                  The email address used during payment (security verification)
                </p>
              </div>

              {/* Security Notice */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Security:</strong> Email address must match the one used during payment.
                  Rate limiting applies (5 attempts per 5 minutes).
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Retrieving...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Retrieve Vouchers
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recovery Notice */}
        {recovered && (
          <Alert className="bg-yellow-50 border-yellow-300 mb-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>Vouchers Recovered:</strong> Your vouchers were missing from our records but have now been regenerated successfully.
              A new email has been sent with your vouchers.
            </AlertDescription>
          </Alert>
        )}

        {/* Vouchers Display */}
        {vouchers && vouchers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-xl border-emerald-200">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  {vouchers.length === 1 ? 'Your Voucher' : `Your ${vouchers.length} Vouchers`}
                </CardTitle>
                <CardDescription>
                  {vouchers.length === 1
                    ? 'Voucher details retrieved successfully'
                    : `All ${vouchers.length} vouchers retrieved successfully`
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDownloadAll}
                    variant="outline"
                    className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {vouchers.length === 1 ? 'Download PDF' : `Download All (${vouchers.length})`}
                  </Button>
                  <Button
                    onClick={handlePrintAll}
                    variant="outline"
                    className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    {vouchers.length === 1 ? 'Print' : `Print All (${vouchers.length})`}
                  </Button>
                </div>

                {/* Voucher Cards */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {vouchers.map((voucher, index) => (
                    <div
                      key={voucher.voucher_code || index}
                      className="bg-white rounded-lg p-6 border-2 border-emerald-200 space-y-4"
                    >
                      {vouchers.length > 1 && (
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                          <span className="text-lg font-bold text-emerald-700">
                            Voucher {index + 1} of {vouchers.length}
                          </span>
                        </div>
                      )}

                      {/* Voucher Code */}
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Voucher Code</p>
                        <p className="text-3xl font-bold text-emerald-700 tracking-wider font-mono">
                          {voucher.voucher_code}
                        </p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Amount</p>
                          <p className="font-semibold text-slate-800">
                            K {parseFloat(voucher.amount || 50).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Status</p>
                          <p className="font-semibold text-slate-800 capitalize">
                            {voucher.status?.replace('_', ' ') || 'Active'}
                          </p>
                        </div>
                        {voucher.valid_from && (
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-xs text-slate-600 mb-1">Valid From</p>
                            <p className="font-semibold text-slate-800">
                              {new Date(voucher.valid_from).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {voucher.valid_until && (
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-xs text-slate-600 mb-1">Valid Until</p>
                            <p className="font-semibold text-slate-800">
                              {new Date(voucher.valid_until).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Passport Info (if linked) */}
                      {voucher.passport_number && (
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <p className="text-xs text-emerald-700 mb-2 font-semibold">
                            Linked to Passport
                          </p>
                          <p className="font-mono text-sm text-emerald-900">
                            {voucher.passport_number}
                            {voucher.customer_name && ` - ${voucher.customer_name}`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Email Sent Confirmation */}
                <Alert className="bg-green-50 border-green-200">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    A copy of your voucher{vouchers.length > 1 ? 's' : ''} has been sent to <strong>{formData.email}</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Help Section */}
        <Card className="mt-8 bg-white/50 border-slate-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Need Help?</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Can't find your Session ID?</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Check your payment confirmation email</li>
                <li>• Look for "Session ID" or "Payment Reference" in the email</li>
                <li>• Format: PGKO-XXXX-XXXX</li>
              </ul>

              <p className="mt-4"><strong>Email not matching?</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Use the exact email address from your payment</li>
                <li>• Check for typos in the email address</li>
                <li>• Contact support if you used a different email</li>
              </ul>

              <p className="mt-4"><strong>Still having issues?</strong></p>
              <p className="ml-4">Contact support: <span className="font-semibold">support@greenpay.gov.pg</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>© 2025 PNG Green Fees System. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default RetrieveVouchers;
