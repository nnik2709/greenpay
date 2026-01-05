import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Download, Mail, FileText } from 'lucide-react';
import api from '@/lib/api/client';
import { downloadQuotationPDF, emailQuotationPDF } from '@/lib/quotationPdfService';

const ViewQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quotations/${id}`);
      setQuotation(response.data);
    } catch (error) {
      console.error('Error loading quotation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load quotation details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      await downloadQuotationPDF(quotation.id, quotation.quotation_number);
      toast({
        title: 'Success',
        description: 'Quotation PDF downloaded successfully'
      });
    } catch (error) {
      console.error('Error downloading quotation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to download quotation PDF'
      });
    }
  };

  const handleSendEmail = async () => {
    try {
      // Prompt for email address
      const email = prompt('Enter email address to send quotation:');
      if (!email) return;

      await emailQuotationPDF(quotation.quotation_number, email);
      toast({
        title: 'Success',
        description: `Quotation sent to ${email}`
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send quotation email'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Quotation Not Found</h2>
        <Button onClick={() => navigate('/app/quotations')} className="bg-emerald-600 hover:bg-emerald-700">
          Back to Quotations
        </Button>
      </div>
    );
  }

  const numberOfVouchers = quotation.number_of_vouchers || 1;
  const unitPrice = parseFloat(quotation.unit_price || 50);
  const lineTotal = parseFloat(quotation.line_total || 0);
  const discountPercentage = parseFloat(quotation.discount_percentage || 0);
  const discountAmount = parseFloat(quotation.discount_amount || 0);
  const subtotal = parseFloat(quotation.subtotal || 0);
  const gstAmount = parseFloat(quotation.gst_amount || 0);
  const totalAmount = parseFloat(quotation.total_amount || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Button
          variant="outline"
          onClick={() => navigate('/app/quotations')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quotations
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSendEmail} className="gap-2">
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <FileText className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Quotation Document */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-12 print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-bold text-emerald-600 mb-2">QUOTATION</h1>
            <p className="text-slate-600">Papua New Guinea Green Fees System</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-800">{quotation.quotation_number}</div>
            <div className="text-sm text-slate-600 mt-1">
              Date: {new Date(quotation.created_at).toLocaleDateString('en-GB')}
            </div>
            <div className="text-sm text-slate-600">
              Valid Until: {new Date(quotation.valid_until).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-2">Bill To:</h3>
            <div className="text-slate-800">
              <div className="font-semibold text-lg">{quotation.customer_name}</div>
              {quotation.customer_email && (
                <div className="text-sm mt-1">{quotation.customer_email}</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-2">Status:</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              quotation.status === 'draft' ? 'bg-gray-100 text-gray-700' :
              quotation.status === 'sent' ? 'bg-purple-100 text-purple-700' :
              quotation.status === 'approved' ? 'bg-green-100 text-green-700' :
              quotation.status === 'converted' ? 'bg-yellow-100 text-yellow-700' :
              quotation.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {quotation.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Description */}
        {quotation.description && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-2">Description:</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{quotation.description}</p>
          </div>
        )}

        {/* Line Items Table */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Price</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-4 px-4 text-slate-800">
                    <div className="font-medium">Green Pass Vouchers</div>
                    <div className="text-sm text-slate-600">Papua New Guinea Exit Pass / Passport Processing</div>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-800">
                    PGK {unitPrice.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-center text-slate-800 font-medium">
                    {numberOfVouchers}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-900">
                    PGK {lineTotal.toFixed(2)}
                  </td>
                </tr>
                {discountAmount > 0 && (
                  <tr className="border-b border-slate-200 bg-amber-50">
                    <td className="py-3 px-4 text-slate-800" colSpan="3">
                      <div className="font-medium text-amber-800">Discount ({discountPercentage}%)</div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-800">
                      - PGK {discountAmount.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="mb-8">
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Amount Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Subtotal:</span>
                <span className="text-lg font-semibold text-slate-900">PGK {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">GST ({quotation.gst_rate || 10}%):</span>
                <span className="text-lg font-semibold text-slate-900">PGK {gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">Total Amount:</span>
                  <span className="text-2xl font-bold text-emerald-600">PGK {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        {quotation.payment_terms && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-2">Payment Terms:</h3>
            <p className="text-slate-700">{quotation.payment_terms}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <div className="text-center text-sm text-slate-600">
            <p className="font-semibold">Papua New Guinea Green Fees System</p>
            <p className="mt-1">This quotation is valid until {new Date(quotation.valid_until).toLocaleDateString('en-GB')}</p>
            {quotation.created_by_name && (
              <p className="mt-2 text-xs">Prepared by: {quotation.created_by_name}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewQuotation;
