import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, CreditCard, Shield, Globe, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  getGatewayConfig,
  updateGatewayConfig,
  getGatewayTransactions,
  GATEWAY_NAMES,
  TRANSACTION_STATUS
} from '@/lib/paymentGatewayService';
import { useAuth } from '@/contexts/AuthContext';

const PaymentGatewaySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Kina Bank Configuration
  const [kinaBankConfig, setKinaBankConfig] = useState({
    isActive: false,
    merchantId: '',
    apiEndpoint: '',
    sandboxMode: true,
    config: {}
  });

  // BSP Configuration (for future use)
  const [bspConfig, setBspConfig] = useState({
    isActive: false,
    merchantId: '',
    apiEndpoint: '',
    sandboxMode: true,
    config: {}
  });

  // Transaction stats
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadConfigurations();
    loadTransactionStats();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);

      // Load Kina Bank config
      const kinaBankData = await getGatewayConfig(GATEWAY_NAMES.KINA_BANK);
      setKinaBankConfig({
        isActive: kinaBankData.isActive,
        merchantId: kinaBankData.merchantId || '',
        apiEndpoint: kinaBankData.apiEndpoint || '',
        sandboxMode: kinaBankData.sandboxMode,
        config: kinaBankData.config || {}
      });

      // Load BSP config (will error if not configured, that's ok)
      try {
        const bspData = await getGatewayConfig(GATEWAY_NAMES.BSP);
        setBspConfig({
          isActive: bspData.isActive,
          merchantId: bspData.merchantId || '',
          apiEndpoint: bspData.apiEndpoint || '',
          sandboxMode: bspData.sandboxMode,
          config: bspData.config || {}
        });
      } catch (error) {
        console.log('BSP config not found (expected)');
      }

    } catch (error) {
      console.error('Failed to load gateway configurations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment gateway settings.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionStats = async () => {
    try {
      const transactions = await getGatewayTransactions({ limit: 1000 });

      const stats = {
        total: transactions.length,
        success: transactions.filter(t => t.status === TRANSACTION_STATUS.SUCCESS).length,
        pending: transactions.filter(t => t.status === TRANSACTION_STATUS.PENDING || t.status === TRANSACTION_STATUS.PROCESSING).length,
        failed: transactions.filter(t => t.status === TRANSACTION_STATUS.FAILED).length,
        totalAmount: transactions
          .filter(t => t.status === TRANSACTION_STATUS.SUCCESS)
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      };

      setStats(stats);
    } catch (error) {
      console.error('Failed to load transaction stats:', error);
    }
  };

  const handleKinaBankSave = async () => {
    try {
      setSaving(true);

      await updateGatewayConfig(GATEWAY_NAMES.KINA_BANK, {
        isActive: kinaBankConfig.isActive,
        merchantId: kinaBankConfig.merchantId,
        apiEndpoint: kinaBankConfig.apiEndpoint,
        sandboxMode: kinaBankConfig.sandboxMode,
        config: kinaBankConfig.config
      });

      toast({
        title: 'Success',
        description: 'Kina Bank IPG settings saved successfully.'
      });

      // Reload stats
      await loadTransactionStats();

    } catch (error) {
      console.error('Failed to save Kina Bank config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save Kina Bank settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBSPSave = async () => {
    try {
      setSaving(true);

      await updateGatewayConfig(GATEWAY_NAMES.BSP, {
        isActive: bspConfig.isActive,
        merchantId: bspConfig.merchantId,
        apiEndpoint: bspConfig.apiEndpoint,
        sandboxMode: bspConfig.sandboxMode,
        config: bspConfig.config
      });

      toast({
        title: 'Success',
        description: 'BSP IPG settings saved successfully.'
      });

    } catch (error) {
      console.error('Failed to save BSP config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save BSP settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto p-6 space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payment Gateway Settings</h1>
          <p className="text-gray-600">Configure online payment integrations</p>
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Configuration Tabs */}
      <Tabs defaultValue="kinabank" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kinabank">Kina Bank IPG</TabsTrigger>
          <TabsTrigger value="bsp">BSP IPG (Future)</TabsTrigger>
        </TabsList>

        {/* Kina Bank Tab */}
        <TabsContent value="kinabank">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Kina Bank Internet Payment Gateway
              </CardTitle>
              <CardDescription>
                Configure your Kina Bank merchant account for online payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Important Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important Setup Instructions</AlertTitle>
                <AlertDescription>
                  Before enabling this gateway, you must:
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Apply for Kina Bank IPG service at any Kina Bank branch</li>
                    <li>Obtain your Merchant ID and API credentials</li>
                    <li>Configure your return URL and webhook URL with Kina Bank</li>
                    <li>Test in sandbox mode before going live</li>
                  </ol>
                  <p className="mt-2 text-sm">Contact: +675 308 3800 or kina@kinabank.com.pg</p>
                </AlertDescription>
              </Alert>

              {/* Enable/Disable Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Enable Kina Bank IPG</Label>
                  <p className="text-sm text-gray-600">
                    {kinaBankConfig.isActive ? 'Gateway is active and accepting payments' : 'Gateway is currently disabled'}
                  </p>
                </div>
                <Switch
                  checked={kinaBankConfig.isActive}
                  onCheckedChange={(checked) =>
                    setKinaBankConfig({ ...kinaBankConfig, isActive: checked })
                  }
                />
              </div>

              {/* Sandbox Mode */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Sandbox Mode</Label>
                  <p className="text-sm text-gray-600">
                    Use test environment for development and testing
                  </p>
                </div>
                <Switch
                  checked={kinaBankConfig.sandboxMode}
                  onCheckedChange={(checked) =>
                    setKinaBankConfig({ ...kinaBankConfig, sandboxMode: checked })
                  }
                />
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kina-merchant-id">Merchant ID</Label>
                  <Input
                    id="kina-merchant-id"
                    placeholder="Enter your Kina Bank Merchant ID"
                    value={kinaBankConfig.merchantId}
                    onChange={(e) =>
                      setKinaBankConfig({ ...kinaBankConfig, merchantId: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Provided by Kina Bank when you register for IPG service
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kina-api-endpoint">API Endpoint URL</Label>
                  <Input
                    id="kina-api-endpoint"
                    placeholder="https://api.kinabank.com.pg/payment"
                    value={kinaBankConfig.apiEndpoint}
                    onChange={(e) =>
                      setKinaBankConfig({ ...kinaBankConfig, apiEndpoint: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {kinaBankConfig.sandboxMode
                      ? 'Sandbox URL (e.g., https://sandbox.kinabank.com.pg/api/payment)'
                      : 'Production URL (e.g., https://api.kinabank.com.pg/payment)'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kina-api-key">API Key (Encrypted)</Label>
                  <div className="relative">
                    <Input
                      id="kina-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Enter your API key"
                      value={kinaBankConfig.config?.apiKey || ''}
                      onChange={(e) =>
                        setKinaBankConfig({
                          ...kinaBankConfig,
                          config: { ...kinaBankConfig.config, apiKey: e.target.value }
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Your API key will be encrypted and stored securely
                  </p>
                </div>
              </div>

              {/* Callback URLs */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <Label className="text-base font-semibold mb-3 block">Callback URLs</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Provide these URLs to Kina Bank when configuring your merchant account:
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Return URL:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded border">
                      {window.location.origin}/payment-callback
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Webhook URL:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded border">
                      {window.location.origin}/api/payment-webhook
                    </code>
                  </div>
                </div>
              </div>

              {/* Transaction Fee Info */}
              <div className="p-4 border rounded-lg">
                <Label className="text-base font-semibold mb-2 block">Transaction Fees</Label>
                <p className="text-sm text-gray-600">
                  Kina Bank charges <strong>PGK 0.50</strong> per transaction
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Total processed: <strong>PGK {stats.totalAmount.toFixed(2)}</strong>
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={loadConfigurations}
                  disabled={saving}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleKinaBankSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BSP Tab */}
        <TabsContent value="bsp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Bank South Pacific Internet Payment Gateway
              </CardTitle>
              <CardDescription>
                BSP integration coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  BSP Internet Payment Gateway integration is planned for a future release.
                  The infrastructure is in place and ready for implementation once BSP provides
                  their API documentation and merchant credentials.
                </AlertDescription>
              </Alert>

              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Preparation Steps:</h4>
                <ol className="list-decimal ml-4 space-y-1 text-sm text-gray-600">
                  <li>Contact BSP to apply for merchant services</li>
                  <li>Request API documentation and test credentials</li>
                  <li>Configure merchant account with callback URLs</li>
                  <li>Contact system administrator to enable BSP integration</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default PaymentGatewaySettings;
