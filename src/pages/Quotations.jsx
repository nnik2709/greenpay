
    import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { FilePlus, Search, Filter, FileText, Calendar, CheckCircle, XCircle, Send as SendIcon, Clock, DollarSign, Hash, Users as UsersIcon, ThumbsUp, ArrowRightCircle } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useNavigate } from 'react-router-dom';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    import { supabase } from '@/lib/supabaseClient';
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { getQuotations } from '@/lib/quotationsService';
    import { getQuotationStatistics, markQuotationAsSent, approveQuotation, convertQuotationToVoucherBatch, canConvertQuotation, canApproveQuotation } from '@/lib/quotationWorkflowService';

    const StatCard = ({ title, value, icon, color, bgColor }) => {
      const Icon = icon;
      return (
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100 flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
          </div>
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
      const [sendOpen, setSendOpen] = useState(false);
      const [convertOpen, setConvertOpen] = useState(false);
      const [selectedQuotation, setSelectedQuotation] = useState(null);
      const [quotationId, setQuotationId] = useState('');
      const [recipient, setRecipient] = useState('');
      const [sending, setSending] = useState(false);
      const [converting, setConverting] = useState(false);
      const [paymentMethod, setPaymentMethod] = useState('CASH');
      const [collectedAmount, setCollectedAmount] = useState('');

      // Load quotations and statistics on mount
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

      const stats = statistics ? [
        { title: 'Total', value: statistics.total_count || '0', icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { title: 'Draft', value: statistics.draft_count || '0', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        { title: 'Sent', value: statistics.sent_count || '0', icon: SendIcon, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { title: 'Approved', value: statistics.approved_count || '0', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
        { title: 'Converted', value: statistics.converted_count || '0', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { title: 'Expired', value: statistics.expired_count || '0', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
      ] : [
        { title: 'Total', value: '0', icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { title: 'Draft', value: '0', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        { title: 'Sent', value: '0', icon: SendIcon, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { title: 'Approved', value: '0', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
        { title: 'Converted', value: '0', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { title: 'Expired', value: '0', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
      ];

      const summaryStats = statistics ? [
        { title: 'Total Value', value: `PGK ${(statistics.total_value || 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
        { title: 'Converted Value', value: `PGK ${(statistics.converted_value || 0).toFixed(2)}`, icon: UsersIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
        { title: 'Conversion Rate', value: `${(statistics.conversion_rate || 0).toFixed(1)}%`, icon: Calendar, color: 'text-pink-600', bgColor: 'bg-pink-100' },
      ] : [
        { title: 'Total Value', value: 'PGK 0.00', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
        { title: 'Total Vouchers', value: '0', icon: UsersIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
        { title: 'This Month', value: '0', icon: Calendar, color: 'text-pink-600', bgColor: 'bg-pink-100' },
      ];

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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSendOpen(true)}>
                <SendIcon className="w-4 h-4 mr-2" />
                Send Quotation
              </Button>
              <Button onClick={() => navigate('/quotations/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <FilePlus className="w-4 h-4 mr-2" />
                Create New Quotation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryStats.map(stat => <StatCard key={stat.title} {...stat} />)}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <Input placeholder="QUOTATION #, CLIENT NAME, EMAIL" className="lg:col-span-2" />
              <Input placeholder="Status: All Status" />
              <Input type="date" placeholder="Start Date" />
              <Input type="date" placeholder="End Date" />
              <div className="flex gap-2">
                <Button variant="outline" className="w-full"><Filter className="w-4 h-4 mr-2" />Filter</Button>
                <Button variant="ghost" className="w-full">Clear</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Quotation #</th>
                    <th scope="col" className="px-6 py-3">Client</th>
                    <th scope="col" className="px-6 py-3">Subject</th>
                    <th scope="col" className="px-6 py-3">Vouchers</th>
                    <th scope="col" className="px-6 py-3">Amount</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Due Date</th>
                    <th scope="col" className="px-6 py-3">Valid Until</th>
                    <th scope="col" className="px-6 py-3">Created</th>
                    <th scope="col" className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : quotations.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-16">
                        <FileText className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-lg font-medium text-slate-800">No quotations found</h3>
                        <p className="mt-1 text-sm text-slate-500">Create your first quotation to get started.</p>
                        <Button onClick={() => navigate('/quotations/create')} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                          Create Quotation
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    quotations.map((quotation) => (
                      <tr key={quotation.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{quotation.quotation_number}</td>
                        <td className="px-6 py-4">
                          <div>{quotation.company_name}</div>
                          <div className="text-xs text-slate-500">{quotation.contact_email}</div>
                        </td>
                        <td className="px-6 py-4">{quotation.notes || '-'}</td>
                        <td className="px-6 py-4 text-right">{quotation.number_of_passports}</td>
                        <td className="px-6 py-4 text-right">PGK {quotation.total_amount?.toFixed(2)}</td>
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
                        <td className="px-6 py-4">{quotation.due_date || '-'}</td>
                        <td className="px-6 py-4">{new Date(quotation.valid_until).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{new Date(quotation.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {/* Mark as Sent button */}
                            {(quotation.status === 'draft' || quotation.status === 'pending') && !quotation.sent_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`quotation-mark-sent-${quotation.id}`}
                                onClick={async () => {
                                  const result = await markQuotationAsSent(quotation.id);
                                  if (result.success) {
                                    toast({ title: 'Quotation Marked as Sent' });
                                    loadQuotations();
                                    loadStatistics();
                                  } else {
                                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                                  }
                                }}
                              >
                                <SendIcon className="w-3 h-3 mr-1" />
                                Mark Sent
                              </Button>
                            )}

                            {/* Approve button */}
                            {canApproveQuotation(quotation) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500 text-green-600 hover:bg-green-50"
                                data-testid={`quotation-approve-${quotation.id}`}
                                onClick={async () => {
                                  const result = await approveQuotation(quotation.id, user?.id);
                                  if (result.success) {
                                    toast({ title: 'Quotation Approved!' });
                                    loadQuotations();
                                    loadStatistics();
                                  } else {
                                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                                  }
                                }}
                              >
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                            )}

                            {/* Convert button */}
                            {canConvertQuotation(quotation) && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                data-testid={`quotation-convert-${quotation.id}`}
                                onClick={() => {
                                  setSelectedQuotation(quotation);
                                  setConvertOpen(true);
                                }}
                              >
                                <ArrowRightCircle className="w-3 h-3 mr-1" />
                                Convert
                              </Button>
                            )}

                            {/* View/Edit button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`quotation-view-${quotation.id}`}
                              onClick={() => {
                                toast({ title: 'View quotation', description: 'Quotation details view coming soon' });
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
              Showing all {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Conversion Dialog */}
          <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convert Quotation to Voucher Batch</DialogTitle>
                <DialogDescription>
                  Convert approved quotation to corporate voucher batch. This will generate {selectedQuotation?.number_of_passports} vouchers.
                </DialogDescription>
              </DialogHeader>

              {selectedQuotation && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Company:</span>
                      <span className="text-sm font-semibold">{selectedQuotation.company_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Vouchers:</span>
                      <span className="text-sm font-semibold">{selectedQuotation.number_of_passports}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Amount:</span>
                      <span className="text-sm font-semibold">PGK {selectedQuotation.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                        data-testid="conversion-payment-method"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="BANK TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Collected Amount (PGK)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={collectedAmount}
                        onChange={(e) => setCollectedAmount(e.target.value)}
                        placeholder={selectedQuotation.total_amount?.toFixed(2)}
                        data-testid="conversion-collected-amount"
                      />
                    </div>

                    {parseFloat(collectedAmount) > (selectedQuotation.total_amount || 0) && (
                      <div className="text-sm text-emerald-600">
                        Change: PGK {(parseFloat(collectedAmount) - (selectedQuotation.total_amount || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={converting}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!collectedAmount || parseFloat(collectedAmount) < (selectedQuotation?.total_amount || 0)) {
                      toast({
                        variant: 'destructive',
                        title: 'Invalid Amount',
                        description: 'Collected amount must be at least the total amount'
                      });
                      return;
                    }

                    setConverting(true);
                    try {
                      const result = await convertQuotationToVoucherBatch(selectedQuotation.id, {
                        paymentMethod,
                        collectedAmount,
                        createdBy: user?.id
                      });

                      if (result.success) {
                        toast({
                          title: 'Conversion Successful!',
                          description: `Generated ${result.vouchers?.length} vouchers in batch ${result.batchId}`
                        });
                        setConvertOpen(false);
                        loadQuotations();
                        loadStatistics();
                        
                        // Navigate to corporate vouchers to view the batch
                        navigate('/purchases/corporate-exit-pass');
                      } else {
                        toast({
                          variant: 'destructive',
                          title: 'Conversion Failed',
                          description: result.error
                        });
                      }
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: error.message
                      });
                    } finally {
                      setConverting(false);
                    }
                  }}
                  disabled={converting}
                  data-testid="conversion-confirm-button"
                >
                  {converting ? 'Converting...' : 'Convert to Vouchers'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send Quotation Dialog (existing) */}
          <Dialog open={sendOpen} onOpenChange={setSendOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Quotation</DialogTitle>
                <DialogDescription>Enter the quotation ID and recipient email address.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Quotation ID</label>
                  <Input value={quotationId} onChange={(e) => setQuotationId(e.target.value)} placeholder="e.g. 1024" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Recipient Email</label>
                  <Input type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="client@example.com" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendOpen(false)} disabled={sending}>Cancel</Button>
                <Button
                  disabled={sending}
                  onClick={async () => {
                    if (!quotationId || !recipient) {
                      toast({ variant: 'destructive', title: 'Missing data', description: 'Provide quotation ID and recipient email.' });
                      return;
                    }
                    setSending(true);
                    try {
                      // First, find the quotation by quotation_number to get the UUID
                      const { data: quotationData, error: findError } = await supabase
                        .from('quotations')
                        .select('id')
                        .eq('quotation_number', quotationId)
                        .single();

                      if (findError || !quotationData) {
                        throw new Error('Quotation not found. Please check the quotation number.');
                      }

                      // Call Edge Function to send quotation (server would render PDF and email)
                      const { error: fnError } = await supabase.functions.invoke('send-quotation', {
                        body: { quotationId: quotationData.id, email: recipient }
                      });
                      if (fnError) throw fnError;

                      // Update quotation status in DB using the UUID
                      await supabase.from('quotations')
                        .update({ status: 'sent', sent_at: new Date().toISOString() })
                        .eq('id', quotationData.id);

                      toast({ title: 'Quotation sent', description: 'Email has been queued for delivery.' });
                      setSendOpen(false);
                    } catch (e) {
                      toast({ variant: 'destructive', title: 'Send failed', description: e?.message || 'Unable to send quotation.' });
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  {sending ? 'Sending…' : 'Send'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
        </main>
      );
    };

    export default Quotations;
  