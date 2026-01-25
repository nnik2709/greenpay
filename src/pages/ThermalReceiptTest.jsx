import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import { Download, FileText } from 'lucide-react';

/**
 * Thermal Receipt Test Page
 * Test the thermal receipt PDF generation with white text on green background
 */
const ThermalReceiptTest = () => {
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownloadThermal = async () => {
    if (!voucherCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Voucher Code Required',
        description: 'Please enter a voucher code'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Requesting thermal receipt for voucher:', voucherCode.trim());

      // api.get with responseType: 'blob' returns the blob directly (not wrapped in response.data)
      const blob = await api.get(`/vouchers/${voucherCode.trim()}/thermal-receipt`, {
        responseType: 'blob'
      });

      console.log('Received blob:', blob);
      console.log('Blob type:', blob.type);
      console.log('Blob size:', blob.size);

      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF blob');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thermal-receipt-${voucherCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Thermal receipt PDF downloaded (${blob.size} bytes)`
      });
    } catch (error) {
      console.error('Error downloading thermal receipt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to download thermal receipt'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Thermal Receipt Test
          </CardTitle>
          <CardDescription>
            Test thermal receipt PDF generation (80mm width) with GREEN CARD white text on green background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="voucherCode">Voucher Code</Label>
            <Input
              id="voucherCode"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Enter voucher code (e.g., HIGPQ243)"
              className="font-mono"
            />
            <p className="text-sm text-gray-500">
              Enter any valid voucher code from Individual Purchases or Corporate Vouchers
            </p>
          </div>

          <Button
            onClick={handleDownloadThermal}
            disabled={loading || !voucherCode.trim()}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Download Thermal Receipt PDF'}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">What to Check:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>PDF should be 80mm wide (thermal printer size)</li>
              <li><strong>GREEN CARD</strong> should have <strong>WHITE text</strong> on <strong>DARK GREEN background</strong></li>
              <li>No green line under the title</li>
              <li>Compact layout suitable for thermal printers</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Note:</h3>
            <p className="text-sm text-yellow-800">
              This is the thermal receipt endpoint (<code className="bg-yellow-100 px-1 rounded">/thermal-receipt</code>).
              Regular voucher downloads and email PDFs use a different template and will NOT be affected.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Example Voucher Codes:</h3>
            <p className="text-sm text-gray-600 mb-2">
              Find valid voucher codes from:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Individual Purchase → Print All (get voucher code from there)</li>
              <li>Vouchers List page</li>
              <li>Corporate Vouchers page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThermalReceiptTest;
