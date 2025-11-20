import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, AlertCircle, CheckCircle, Database, Mail, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getSettings, updateSettings } from '@/lib/settingsService';
import { supabase } from '@/lib/supabaseClient';

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    voucher_validity_days: 30,
    default_amount: 50,
    company_name: 'PNG Green Fees System',
    company_email: '',
    support_email: '',
    max_bulk_upload: 1000,
    auto_approve_threshold: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [systemStatus, setSystemStatus] = useState({});

  useEffect(() => {
    loadSettings();
    checkSystemStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check database connection
      const { data: dbTest } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      // Check storage buckets
      const { data: storageTest } = await supabase.storage.listBuckets();

      // Check edge functions
      const { data: functionsTest } = await supabase.functions.list();

      setSystemStatus({
        database: dbTest ? 'connected' : 'error',
        storage: storageTest ? 'available' : 'error',
        functions: functionsTest ? 'available' : 'error',
        lastChecked: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('System status check failed:', error);
      setSystemStatus({
        database: 'error',
        storage: 'error',
        functions: 'error',
        lastChecked: new Date().toLocaleTimeString()
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      toast({
        title: "Settings Saved! ✨",
        description: "Your system settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      voucher_validity_days: 30,
      default_amount: 50,
      company_name: 'PNG Green Fees System',
      company_email: '',
      support_email: '',
      max_bulk_upload: 1000,
      auto_approve_threshold: 100
    });
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-slate-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-emerald-600" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="PNG Green Fees System"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings(prev => ({ ...prev, support_email: e.target.value }))}
                placeholder="support@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Voucher Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Voucher Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voucher_validity_days">Voucher Validity (Days)</Label>
              <Input
                id="voucher_validity_days"
                type="number"
                min="1"
                max="365"
                value={settings.voucher_validity_days}
                onChange={(e) => setSettings(prev => ({ ...prev, voucher_validity_days: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_amount">Default Amount (PGK)</Label>
              <Input
                id="default_amount"
                type="number"
                min="0"
                step="0.01"
                value={settings.default_amount}
                onChange={(e) => setSettings(prev => ({ ...prev, default_amount: parseFloat(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Upload Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_bulk_upload">Max Bulk Upload Records</Label>
              <Input
                id="max_bulk_upload"
                type="number"
                min="1"
                max="10000"
                value={settings.max_bulk_upload}
                onChange={(e) => setSettings(prev => ({ ...prev, max_bulk_upload: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auto_approve_threshold">Auto-approve Threshold (PGK)</Label>
              <Input
                id="auto_approve_threshold"
                type="number"
                min="0"
                step="0.01"
                value={settings.auto_approve_threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, auto_approve_threshold: parseFloat(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              System Status
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={checkSystemStatus}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <div className="flex items-center gap-2">
                {systemStatus.database === 'connected' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${systemStatus.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus.database === 'connected' ? 'Connected' : 'Error'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage</span>
              <div className="flex items-center gap-2">
                {systemStatus.storage === 'available' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${systemStatus.storage === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus.storage === 'available' ? 'Available' : 'Error'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Edge Functions</span>
              <div className="flex items-center gap-2">
                {systemStatus.functions === 'available' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${systemStatus.functions === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus.functions === 'available' ? 'Available' : 'Error'}
                </span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <span className="text-xs text-slate-500">
                Last checked: {systemStatus.lastChecked || 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
