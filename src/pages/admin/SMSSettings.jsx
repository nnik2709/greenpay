import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Settings, TestTube, Save, Phone, Globe, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const SMSSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enabled: false,
    provider: 'twilio',
    apiKey: '',
    apiSecret: '',
    fromNumber: '',
    webhookUrl: '',
    testPhoneNumber: '',
    templates: {
      voucherGenerated: 'Your PNG Green Fee voucher {{VOUCHER_CODE}} is ready. Amount: PGK {{AMOUNT}}. Valid until {{EXPIRY_DATE}}.',
      paymentConfirmation: 'Payment confirmed for PGK {{AMOUNT}}. Voucher {{VOUCHER_CODE}} generated successfully.',
      passwordReset: 'Your password reset code is {{RESET_CODE}}. Valid for 10 minutes.',
      systemAlert: 'System Alert: {{MESSAGE}}'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          enabled: data.enabled || false,
          provider: data.provider || 'twilio',
          apiKey: data.api_key || '',
          apiSecret: data.api_secret || '',
          fromNumber: data.from_number || '',
          webhookUrl: data.webhook_url || '',
          testPhoneNumber: data.test_phone_number || '',
          templates: data.templates || settings.templates
        });
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('sms_settings')
        .upsert({
          id: 1, // Single settings record
          enabled: settings.enabled,
          provider: settings.provider,
          api_key: settings.apiKey,
          api_secret: settings.apiSecret,
          from_number: settings.fromNumber,
          webhook_url: settings.webhookUrl,
          test_phone_number: settings.testPhoneNumber,
          templates: settings.templates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "SMS settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SMS settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testSMS = async () => {
    if (!settings.testPhoneNumber) {
      toast({
        title: "Test Phone Required",
        description: "Please enter a test phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: settings.testPhoneNumber,
          message: testMessage || 'Test SMS from PNG Green Fees System',
          provider: settings.provider,
          apiKey: settings.apiKey,
          apiSecret: settings.apiSecret,
          fromNumber: settings.fromNumber
        }
      });

      if (error) throw error;

      toast({
        title: "Test SMS Sent",
        description: `Test message sent to ${settings.testPhoneNumber}`,
      });
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test SMS",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateChange = (templateKey, value) => {
    setSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [templateKey]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            SMS Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure SMS notifications and messaging</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={testSMS} 
            variant="outline" 
            disabled={testing || !settings.enabled}
            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'Testing...' : 'Test SMS'}
          </Button>
          <Button onClick={saveSettings} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Enable SMS Notifications</Label>
              <p className="text-sm text-slate-500">Allow the system to send SMS messages</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleInputChange('enabled', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">SMS Provider</Label>
              <select
                id="provider"
                value={settings.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="twilio">Twilio</option>
                <option value="aws-sns">AWS SNS</option>
                <option value="local">Local Provider</option>
              </select>
            </div>
            <div>
              <Label htmlFor="fromNumber">From Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="fromNumber"
                  placeholder="+1234567890"
                  className="pl-10"
                  value={settings.fromNumber}
                  onChange={(e) => handleInputChange('fromNumber', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={settings.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Enter your API secret"
                value={settings.apiSecret}
                onChange={(e) => handleInputChange('apiSecret', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="webhookUrl"
                placeholder="https://your-webhook-url.com/sms"
                className="pl-10"
                value={settings.webhookUrl}
                onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testPhone">Test Phone Number</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                id="testPhone"
                placeholder="+1234567890"
                className="pl-10"
                value={settings.testPhoneNumber}
                onChange={(e) => handleInputChange('testPhoneNumber', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="testMessage">Test Message</Label>
            <Textarea
              id="testMessage"
              placeholder="Enter a test message to send..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Voucher Generated</Label>
            <p className="text-sm text-slate-500 mb-2">Sent when a voucher is created</p>
            <Textarea
              value={settings.templates.voucherGenerated}
              onChange={(e) => handleTemplateChange('voucherGenerated', e.target.value)}
              rows={2}
              placeholder="Your voucher message..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Available variables: {{VOUCHER_CODE}}, {{AMOUNT}}, {{EXPIRY_DATE}}
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold">Payment Confirmation</Label>
            <p className="text-sm text-slate-500 mb-2">Sent when payment is confirmed</p>
            <Textarea
              value={settings.templates.paymentConfirmation}
              onChange={(e) => handleTemplateChange('paymentConfirmation', e.target.value)}
              rows={2}
              placeholder="Your payment confirmation message..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Available variables: {{AMOUNT}}, {{VOUCHER_CODE}}
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold">Password Reset</Label>
            <p className="text-sm text-slate-500 mb-2">Sent for password reset codes</p>
            <Textarea
              value={settings.templates.passwordReset}
              onChange={(e) => handleTemplateChange('passwordReset', e.target.value)}
              rows={2}
              placeholder="Your password reset message..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Available variables: {{RESET_CODE}}
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold">System Alert</Label>
            <p className="text-sm text-slate-500 mb-2">Sent for system notifications</p>
            <Textarea
              value={settings.templates.systemAlert}
              onChange={(e) => handleTemplateChange('systemAlert', e.target.value)}
              rows={2}
              placeholder="Your system alert message..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Available variables: {{MESSAGE}}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">0</div>
              <div className="text-sm text-slate-500">SMS Sent Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-slate-500">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-slate-500">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-slate-500">Total Sent</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSSettings;





