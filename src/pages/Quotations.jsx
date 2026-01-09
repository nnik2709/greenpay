import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getQuotations } from '@/lib/quotationsService';
import { getQuotationStatistics, markQuotationAsSent } from '@/lib/quotationWorkflowService';
import { convertQuotationToInvoice } from '@/lib/invoiceService';
import { formatPGK, calculateGST } from '@/lib/gstUtils';
import QuotationPDF from '@/components/QuotationPDF';
import { downloadQuotationPDF, emailQuotationPDF } from '@/lib/quotationPdfService';

const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-slate-200">
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const Quotations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [quotations, setQuotations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');

  // Dialog states
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  // Action states
  const [dueDays, setDueDays] = useState(30);
  const [applyGst, setApplyGst] = useState(false);
  const [convertingToInvoice, setConvertingToInvoice] = useState(false);

  useEffect(() => {
    loadQuotations();
    loadStatistics();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load quotations'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getQuotationStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const getSelectedQuotation = () => {
    return quotations.find(q => q.id === selectedQuotationId);
  };

  const handleActionChange = (value) => {
    setSelectedAction(value);
  };

  const handleDownloadPDF = async (quotation) => {
    try {
      await downloadQuotationPDF(quotation.id, quotation.quotation_number);
      toast({
        title: 'Success',
        description: 'Quotation PDF downloaded successfully'
      });
      setSelectedAction('');
    } catch (error) {
      console.error('Error downloading quotation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to download quotation PDF'
      });
    }
  };

  const handlePerformAction = () => {
    if (!selectedQuotationId) {
      toast({
        variant: 'destructive',
        title: 'No Selection',
        description: 'Please select a quotation first'
      });
      return;
    }

    const quotation = getSelectedQuotation();
    if (!quotation) return;

    switch (selectedAction) {
      case 'view':
        navigate(`/app/quotations/${quotation.id}`);
        break;
      case 'download_pdf':
        handleDownloadPDF(quotation);
        break;
      case 'email':
        setEmailDialogOpen(true);
        break;
      case 'convert_invoice':
        if (quotation.status !== 'approved' && quotation.status !== 'sent') {
          toast({
            variant: 'destructive',
            title: 'Cannot Convert',
            description: 'Quotation must be approved or sent before converting to invoice'
          });
          return;
        }
        if (quotation.converted_to_invoice) {
          toast({
            variant: 'destructive',
            title: 'Already Converted',
            description: 'This quotation has already been converted to an invoice'
          });
          return;
        }
        setInvoiceDialogOpen(true);
        break;
      default:
        toast({
          variant: 'destructive',
          title: 'No Action',
          description: 'Please select an action from the dropdown'
        });
    }
  };

  const handleEmailQuotation = async () => {
    const quotation = getSelectedQuotation();
    if (!quotation) return;

    try {
      await markQuotationAsSent(quotation.id);
      toast({
        title: 'Quotation Sent',
        description: `Quotation ${quotation.quotation_number} has been emailed to ${quotation.customer_email}`
      });
      setEmailDialogOpen(false);
      await loadQuotations();
      await loadStatistics();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send quotation'
      });
    }
  };

  const handleConvertToInvoice = async () => {
    const quotation = getSelectedQuotation();
    if (!quotation) return;

    try {
      setConvertingToInvoice(true);
      const result = await convertQuotationToInvoice({
        quotation_id: quotation.id,
        due_days: dueDays,
        apply_gst: applyGst
      });

      setInvoiceDialogOpen(false);
      setSelectedQuotationId(null);
      setSelectedAction('');
      setDueDays(30);
      setApplyGst(false);

      await loadQuotations();
      await loadStatistics();

      toast({
        title: 'Invoice Created!',
        description: `Invoice ${result.invoice?.invoice_number || 'INV-XXXXX'} created successfully`
      });

      navigate('/app/invoices');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Conversion Failed',
        description: error.response?.data?.error || 'Failed to create invoice'
      });
    } finally {
      setConvertingToInvoice(false);
    }
  };

  const stats = statistics ? [
    { title: 'Total', value: statistics.total_count || '0' },
    { title: 'Draft', value: statistics.draft_count || '0' },
    { title: 'Sent', value: statistics.sent_count || '0' },
    { title: 'Approved', value: statistics.approved_count || '0' },
    { title: 'Converted', value: statistics.converted_count || '0' },
    { title: 'Expired', value: statistics.expired_count || '0' },
  ] : [];

  const summaryStats = statistics ? [
    { title: 'Total Value', value: `PGK ${parseFloat(statistics.total_value || 0).toFixed(2)}` },
    { title: 'Converted Value', value: `PGK ${parseFloat(statistics.converted_value || 0).toFixed(2)}` },
    { title: 'Conversion Rate', value: `${parseFloat(statistics.conversion_rate || 0).toFixed(1)}%` },
  ] : [];

  return (
    <main>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Quotations Management
        </h1>
        <Button onClick={() => navigate('/app/quotations/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Create New Quotation
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryStats.map(stat => <StatCard key={stat.title} {...stat} />)}
      </div>

      {/* Action Bar */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="action-select" className="text-sm font-semibold text-slate-700">
                Select Action:
              </Label>
              <Select value={selectedAction} onValueChange={handleActionChange}>
                <SelectTrigger id="action-select" className="w-full sm:w-64 bg-white">
                  <SelectValue placeholder="Choose an action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Quotation</SelectItem>
                  <SelectItem value="download_pdf">Download PDF</SelectItem>
                  <SelectItem value="email">Email Quotation</SelectItem>
                  <SelectItem value="convert_invoice">Convert to Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePerformAction}
                disabled={!selectedQuotationId || !selectedAction}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Perform Action
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedQuotationId(null);
                  setSelectedAction('');
                }}
                className="border-slate-300"
              >
                Clear Selection
              </Button>
            </div>
          </div>
          {selectedQuotationId && (
            <div className="text-sm text-emerald-700 font-medium">
              Selected: {getSelectedQuotation()?.quotation_number} - {getSelectedQuotation()?.customer_name}
            </div>
          )}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-12">Select</th>
                <th scope="col" className="px-6 py-3">Quotation #</th>
                <th scope="col" className="px-6 py-3">Client</th>
                <th scope="col" className="px-6 py-3">Issued By</th>
                <th scope="col" className="px-6 py-3">Vouchers</th>
                <th scope="col" className="px-6 py-3">Amount</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Valid Until</th>
                <th scope="col" className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <h3 className="mt-2 text-lg font-medium text-slate-800">No quotations found</h3>
                    <p className="mt-1 text-sm text-slate-500">Create your first quotation to get started.</p>
                    <Button onClick={() => navigate('/app/quotations/create')} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                      Create Quotation
                    </Button>
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr
                    key={quotation.id}
                    className={`border-b hover:bg-emerald-50 cursor-pointer ${
                      selectedQuotationId === quotation.id ? 'bg-emerald-100 border-emerald-300' : 'bg-white'
                    }`}
                    onClick={() => setSelectedQuotationId(quotation.id)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="radio"
                        name="quotation-selection"
                        checked={selectedQuotationId === quotation.id}
                        onChange={() => setSelectedQuotationId(quotation.id)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{quotation.quotation_number}</td>
                    <td className="px-6 py-4">
                      <div>{quotation.customer_name}</div>
                      <div className="text-xs text-slate-500">{quotation.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">{quotation.created_by_name || '-'}</td>
                    <td className="px-6 py-4 text-right">{quotation.number_of_vouchers || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">PGK {parseFloat(quotation.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        quotation.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        quotation.status === 'sent' ? 'bg-purple-100 text-purple-700' :
                        quotation.status === 'approved' ? 'bg-green-100 text-green-700' :
                        quotation.status === 'converted' ? 'bg-yellow-100 text-yellow-700' :
                        quotation.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {quotation.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(quotation.valid_until).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(quotation.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Quotation Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Quotation</DialogTitle>
            <DialogDescription>
              Send quotation {getSelectedQuotation()?.quotation_number} to customer
            </DialogDescription>
          </DialogHeader>

          {getSelectedQuotation() && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Customer Details:</p>
                <p className="font-semibold">{getSelectedQuotation().customer_name}</p>
                <p className="text-sm text-slate-600">{getSelectedQuotation().customer_email}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  This quotation will be emailed as a PDF attachment to the customer.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailQuotation} className="bg-emerald-600 hover:bg-emerald-700">
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to PNG Tax Invoice</DialogTitle>
            <DialogDescription>
              Create a PNG GST-compliant tax invoice from this quotation
            </DialogDescription>
          </DialogHeader>

          {getSelectedQuotation() && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  This will create a formal tax invoice with PNG GST compliance (10% GST).
                </p>
                <p className="text-xs text-blue-700">
                  The invoice will require payment before vouchers (green passes) can be generated.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Company:</span>
                  <span className="text-sm font-semibold">{getSelectedQuotation().customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Passports:</span>
                  <span className="text-sm font-semibold">{getSelectedQuotation().number_of_vouchers || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Subtotal:</span>
                  <span className="text-sm font-semibold">
                    {(() => {
                      const total = parseFloat(getSelectedQuotation().total_amount) || 0;
                      const subtotal = parseFloat(getSelectedQuotation().subtotal) || (total / 1.10);
                      return formatPGK(subtotal);
                    })()}
                  </span>
                </div>
                {applyGst && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">GST (10%):</span>
                    <span className="text-sm font-semibold">
                      {(() => {
                        const total = parseFloat(getSelectedQuotation().total_amount) || 0;
                        const subtotal = parseFloat(getSelectedQuotation().subtotal) || (total / 1.10);
                        const gst = calculateGST(subtotal);
                        return formatPGK(gst);
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-bold">Total Amount:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {(() => {
                      const total = parseFloat(getSelectedQuotation().total_amount) || 0;
                      const subtotal = parseFloat(getSelectedQuotation().subtotal) || (total / 1.10);
                      if (applyGst) {
                        const gst = calculateGST(subtotal);
                        return formatPGK(subtotal + gst);
                      } else {
                        return formatPGK(subtotal);
                      }
                    })()}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gst-toggle" className="text-sm font-semibold text-amber-900">
                      Apply GST (10%)
                    </Label>
                    <p className="text-xs text-amber-700 mt-1">
                      Toggle to include or exclude GST on this invoice
                    </p>
                  </div>
                  <Switch
                    id="gst-toggle"
                    checked={applyGst}
                    onCheckedChange={setApplyGst}
                  />
                </div>
              </div>

              <div>
                <Label>Payment Terms</Label>
                <select
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value={0}>Due on receipt</option>
                  <option value={7}>Net 7 days</option>
                  <option value={14}>Net 14 days</option>
                  <option value={30}>Net 30 days</option>
                  <option value={60}>Net 60 days</option>
                  <option value={90}>Net 90 days</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInvoiceDialogOpen(false);
                setDueDays(30);
              }}
              disabled={convertingToInvoice}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToInvoice}
              disabled={convertingToInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {convertingToInvoice ? 'Creating Invoice...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Download Dialog */}
      {pdfDialogOpen && getSelectedQuotation() && (
        <QuotationPDF
          quotation={getSelectedQuotation()}
          isOpen={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
        />
      )}
    </motion.div>
    </main>
  );
};

export default Quotations;
