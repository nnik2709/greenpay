import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Download, Package, Eye, Mail, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const customStyles = {
  header: { style: { minHeight: '56px' } },
  headRow: { 
    style: { 
      borderTopStyle: 'solid', 
      borderTopWidth: '1px', 
      borderTopColor: '#E2E8F0', 
      backgroundColor: '#F8FAFC' 
    } 
  },
  headCells: { 
    style: { 
      '&:not(:last-of-type)': { 
        borderRightStyle: 'solid', 
        borderRightWidth: '1px', 
        borderRightColor: '#E2E8F0' 
      }, 
      color: '#475569', 
      fontSize: '12px', 
      fontWeight: '600', 
      textTransform: 'uppercase' 
    } 
  },
  cells: { 
    style: { 
      '&:not(:last-of-type)': { 
        borderRightStyle: 'solid', 
        borderRightWidth: '1px', 
        borderRightColor: '#E2E8F0' 
      } 
    } 
  },
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-emerald-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      {Icon && <Icon className="w-8 h-8 text-emerald-500 opacity-50" />}
    </div>
  </div>
);

const CorporateBatchHistory = () => {
  const { toast } = useToast();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [batchVouchers, setBatchVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      
      // Query corporate_vouchers and group by batch_id or company
      const { data: vouchers, error } = await supabase
        .from('corporate_vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group vouchers by batch (using created_at date + company as batch identifier)
      const batchMap = new Map();
      
      (vouchers || []).forEach(voucher => {
        const batchKey = voucher.batch_id || `${voucher.company_name}_${new Date(voucher.created_at).toDateString()}`;
        
        if (!batchMap.has(batchKey)) {
          batchMap.set(batchKey, {
            batchId: batchKey,
            companyName: voucher.company_name,
            createdAt: voucher.created_at,
            paymentMethod: voucher.payment_method,
            vouchers: [],
            totalAmount: 0,
            quantity: 0
          });
        }
        
        const batch = batchMap.get(batchKey);
        batch.vouchers.push(voucher);
        batch.totalAmount += parseFloat(voucher.amount || 0);
        batch.quantity += parseInt(voucher.quantity || 1);
      });

      const batchesArray = Array.from(batchMap.values()).map((batch, index) => ({
        id: index + 1,
        batchId: batch.batchId,
        companyName: batch.companyName,
        date: new Date(batch.createdAt).toLocaleString(),
        quantity: batch.quantity,
        totalAmount: batch.totalAmount,
        paymentMethod: batch.paymentMethod,
        vouchers: batch.vouchers,
        usedCount: batch.vouchers.filter(v => v.used_at).length,
        validCount: batch.vouchers.filter(v => !v.used_at).length
      }));

      setBatches(batchesArray);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to load corporate batch history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (batch) => {
    setSelectedBatch(batch);
    setBatchVouchers(batch.vouchers);
    setShowDetailsDialog(true);
  };

  const handleDownloadBatch = async (batch) => {
    toast({
      title: "Download Started",
      description: `Preparing ZIP file for ${batch.companyName}...`,
    });
    
    try {
      // Call the generate-corporate-zip Edge Function
      const voucherIds = batch.vouchers.map(v => v.id);
      
      const { data, error } = await supabase.functions.invoke('generate-corporate-zip', {
        body: { 
          voucherIds,
          companyName: batch.companyName 
        }
      });

      if (error) throw error;

      toast({
        title: "Download Ready",
        description: "ZIP file generated successfully",
      });
    } catch (error) {
      console.error('Error downloading batch:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to generate ZIP file",
        variant: "destructive"
      });
    }
  };

  const handleEmailBatch = async () => {
    if (!emailAddress || !selectedBatch) return;

    setEmailLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-corporate-batch-email', {
        body: {
          batchId: selectedBatch.batchId,
          recipientEmail: emailAddress
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent Successfully",
        description: `Corporate batch details sent to ${emailAddress}`,
      });

      setShowEmailDialog(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const columns = [
    { 
      name: 'Batch ID', 
      selector: row => row.id, 
      sortable: true,
      width: '100px'
    },
    { 
      name: 'Company Name', 
      selector: row => row.companyName, 
      sortable: true,
      wrap: true
    },
    { 
      name: 'Date Created', 
      selector: row => row.date, 
      sortable: true 
    },
    { 
      name: 'Quantity', 
      selector: row => row.quantity, 
      sortable: true,
      right: true,
      width: '100px'
    },
    { 
      name: 'Total Amount', 
      selector: row => `PGK ${row.totalAmount.toFixed(2)}`, 
      sortable: true,
      right: true 
    },
    { 
      name: 'Payment Method', 
      selector: row => row.paymentMethod, 
      sortable: true 
    },
    { 
      name: 'Status', 
      cell: row => (
        <div className="flex flex-col gap-1 py-1">
          <span className="text-xs">
            <span className="font-semibold text-green-600">{row.validCount}</span> Valid
          </span>
          <span className="text-xs">
            <span className="font-semibold text-slate-600">{row.usedCount}</span> Used
          </span>
        </div>
      ),
      width: '100px'
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(row)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadBatch(row)}
            title="Download ZIP"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      ),
      width: '120px'
    }
  ];

  const filteredBatches = batches.filter(batch => 
    batch.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBatches = batches.length;
  const totalVouchers = batches.reduce((sum, b) => sum + b.quantity, 0);
  const totalRevenue = batches.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalUsed = batches.reduce((sum, b) => sum + b.usedCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Corporate Batch History
          </h1>
          <p className="text-slate-600">
            View and manage all corporate voucher batches
          </p>
        </div>
        <Button 
          onClick={fetchBatches}
          variant="outline"
          disabled={loading}
        >
          <Package className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Batches" 
          value={totalBatches} 
          icon={Package} 
        />
        <StatCard 
          title="Total Vouchers" 
          value={totalVouchers} 
          icon={FileText} 
        />
        <StatCard 
          title="Total Revenue" 
          value={`PGK ${totalRevenue.toFixed(2)}`} 
        />
        <StatCard 
          title="Vouchers Used" 
          value={`${totalUsed} / ${totalVouchers}`} 
        />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="mb-4">
          <Input
            placeholder="Search by company name or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <DataTable
          columns={columns}
          data={filteredBatches}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
          noDataComponent={
            <div className="py-8 text-center text-slate-500">
              No corporate batches found
            </div>
          }
        />
      </div>

      {/* Batch Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              {selectedBatch && `${selectedBatch.companyName} - ${selectedBatch.quantity} vouchers`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Batch ID</p>
                  <p className="font-semibold text-slate-800 text-sm">{selectedBatch.batchId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Company</p>
                  <p className="font-semibold text-slate-800">{selectedBatch.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date Created</p>
                  <p className="font-semibold text-slate-800">{selectedBatch.date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment Method</p>
                  <p className="font-semibold text-slate-800">{selectedBatch.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="font-semibold text-emerald-600">PGK {selectedBatch.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-semibold text-slate-800">
                    {selectedBatch.validCount} Valid, {selectedBatch.usedCount} Used
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Vouchers in This Batch</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {batchVouchers.map((voucher, index) => (
                    <div 
                      key={voucher.id} 
                      className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-800">
                          {voucher.voucher_code}
                        </p>
                        <p className="text-xs text-slate-500">
                          Passport: {voucher.passport_number || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          PGK {parseFloat(voucher.amount || 0).toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          voucher.used_at 
                            ? 'bg-gray-200 text-gray-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {voucher.used_at ? 'Used' : 'Valid'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleDownloadBatch(selectedBatch)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ZIP
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEmailDialog(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Batch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email Corporate Batch</DialogTitle>
            <DialogDescription>
              Send batch details to an email address
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="recipient@company.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full"
              />
            </div>
            
            {selectedBatch && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Batch:</strong> {selectedBatch.companyName}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Vouchers:</strong> {selectedBatch.quantity}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Amount:</strong> PGK {selectedBatch.totalAmount.toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEmailDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEmailBatch}
                disabled={!emailAddress || emailLoading}
                className="flex-1"
              >
                {emailLoading ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CorporateBatchHistory;

