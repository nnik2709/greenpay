
    import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { FilePlus, Search, Filter, FileText, Calendar, CheckCircle, XCircle, Send as SendIcon, Clock, DollarSign, Hash, Users as UsersIcon } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useNavigate } from 'react-router-dom';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

      const [sendOpen, setSendOpen] = useState(false);
      const [quotationId, setQuotationId] = useState('');
      const [recipient, setRecipient] = useState('');
      const [sending, setSending] = useState(false);

      const stats = [
        { title: 'Total', value: '0', icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { title: 'Draft', value: '0', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        { title: 'Sent', value: '0', icon: SendIcon, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { title: 'Approved', value: '0', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
        { title: 'Converted', value: '0', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { title: 'Expired', value: '0', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
      ];

      const summaryStats = [
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
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">Showing all 0 quotations</p>
          </div>

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
                      // Call Edge Function to send quotation (server would render PDF and email)
                      const { error: fnError } = await supabase.functions.invoke('send-quotation', {
                        body: { quotationId, email: recipient }
                      });
                      if (fnError) throw fnError;

                      // Update quotation status in DB (best-effort)
                      await supabase.from('quotations')
                        .update({ status: 'sent', sent_at: new Date().toISOString() })
                        .eq('id', quotationId);

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
  