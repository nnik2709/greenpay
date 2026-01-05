import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/client';

const SettingsRPC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    voucher_validity_days: 30,
    default_amount: 50.00,
    terms_content: '',
    privacy_content: '',
    refunds_content: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.settings.get();

      if (data) {
        setSettings({
          voucher_validity_days: data.voucherValidityDays || 30,
          default_amount: data.defaultAmount || 50.00,
          terms_content: data.termsContent || '',
          privacy_content: data.privacyContent || '',
          refunds_content: data.refundsContent || '',
          created_at: data.createdAt,
          updated_at: data.updatedAt
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.settings.update({
        voucher_validity_days: settings.voucher_validity_days,
        default_amount: settings.default_amount,
        terms_content: settings.terms_content,
        privacy_content: settings.privacy_content,
        refunds_content: settings.refunds_content
      });

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });

      // Refresh to get updated timestamps
      await fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-500">Configure system-wide settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="voucher_validity_days">Voucher Validity (Days)</Label>
              <Input
                id="voucher_validity_days"
                type="number"
                min="1"
                max="365"
                value={settings.voucher_validity_days}
                onChange={(e) => handleInputChange('voucher_validity_days', parseInt(e.target.value))}
                placeholder="Enter number of days"
              />
              <p className="text-sm text-gray-500">
                Number of days vouchers remain valid after creation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_amount">Default Amount (PGK)</Label>
              <Input
                id="default_amount"
                type="number"
                step="0.01"
                min="0"
                value={settings.default_amount}
                onChange={(e) => handleInputChange('default_amount', parseFloat(e.target.value))}
                placeholder="Enter default amount"
              />
              <p className="text-sm text-gray-500">
                Default amount for green fee vouchers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="terms_content">Terms &amp; Conditions (public page)</Label>
              <Textarea
                id="terms_content"
                rows={6}
                value={settings.terms_content}
                onChange={(e) => handleInputChange('terms_content', e.target.value)}
                placeholder="Enter Terms & Conditions content"
              />
              <p className="text-sm text-gray-500">Visible at /terms and in email links.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacy_content">Privacy Policy (public page)</Label>
              <Textarea
                id="privacy_content"
                rows={6}
                value={settings.privacy_content}
                onChange={(e) => handleInputChange('privacy_content', e.target.value)}
                placeholder="Enter Privacy Policy content"
              />
              <p className="text-sm text-gray-500">Visible at /privacy and in email links.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refunds_content">Refund / Return Policy (public page)</Label>
            <Textarea
              id="refunds_content"
              rows={6}
              value={settings.refunds_content}
              onChange={(e) => handleInputChange('refunds_content', e.target.value)}
              placeholder="Enter Refund / Return Policy content"
            />
            <p className="text-sm text-gray-500">Visible at /refunds and in email links.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={fetchSettings}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-600">
                {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2 text-gray-600">
                {settings.created_at ? new Date(settings.created_at).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SettingsRPC;

