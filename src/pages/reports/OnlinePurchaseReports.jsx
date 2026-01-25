import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import VoucherPrint from '@/components/VoucherPrint';
import ExportButton from '@/components/ExportButton';
import EditPaymentModal from '@/components/EditPaymentModal';
import RefundPaymentModal from '@/components/RefundPaymentModal';


const customStyles = {
  header: { style: { minHeight: '56px' } },
  headRow: { style: { borderTopStyle: 'solid', borderTopWidth: '1px', borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' } },
  headCells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' }, color: '#475569', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' } },
  cells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' } } },
};

const StatCard = ({ title, value }) => (
  <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
    <p className="text-xs text-slate-500 mb-1">{title}</p>
    <p className="text-base md:text-lg font-bold text-slate-800 truncate">{value}</p>
  </div>
);

const OnlinePurchaseReports = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  // Search and filter state - ONLINE filter pre-selected
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ONLINE');

  useEffect(() => {
    fetchVouchers();
  }, [page]);

  const fetchVouchers = async (pageNum = page) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : '',
        payment_method: paymentTypeFilter !== 'all' ? paymentTypeFilter : ''
      };

      const response = await api.get('/individual-purchases', { params });
      // Backend returns { type: 'success', data: [...], pagination: {...} }
      setData(response.data || []);

      if (response.pagination) {
        setPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({
        title: "Error",
        description: "Failed to load vouchers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to page 1 when searching
    fetchVouchers(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Calculate actual status based on business rules (matching backend logic)
  const calculateStatus = (row) => {
    // Rule 1: If refunded, status is "Refunded"
    if (row.refunded_at || row.refunded) {
      return 'refunded';
    }

    // Rule 2: If used, status is "Used"
    if (row.used_at) {
      return 'used';
    }

    // Rule 3: Check if expired
    if (row.valid_until) {
      const expiryDate = new Date(row.valid_until);
      const now = new Date();
      if (expiryDate < now) {
        return 'expired';
      }
    }

    // Rule 4: Not used, not expired, not refunded = "Active"
    return 'active';
  };

  const handlePrintVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowPrint(true);
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  const handleRefundPayment = (payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleSavePayment = async (id, updatedData) => {
    try {
      await api.put(`/individual-purchases/${id}`, updatedData);

      // Refresh data
      await fetchVouchers();

      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  };

  const handleProcessRefund = async (id, refundData) => {
    try {
      // Update the payment record with refund information
      await api.put(`/individual-purchases/${id}`, {
        refunded: true,
        refund_amount: refundData.refund_amount,
        refund_reason: refundData.refund_reason,
        refund_method: refundData.refund_method,
        refund_notes: refundData.notes,
        refunded_at: refundData.refunded_at,
        status: refundData.refund_amount === refundData.original_amount ? 'refunded' : 'partial_refund'
      });

      // Refresh data
      await fetchVouchers();

      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  };

  const columns = [
    { name: 'Voucher Code', selector: row => row.voucher_code, sortable: true, width: '150px' },
    { name: 'Passport No', selector: row => row.passport_number || 'N/A', sortable: true },
    { name: 'Amount', selector: row => row.amount ? `PGK ${parseFloat(row.amount).toFixed(2)}` : 'PGK 0.00', sortable: true, right: true },
    { name: 'Payment Method', selector: row => row.payment_method || 'N/A', sortable: true },
    { name: 'Created', selector: row => formatDate(row.created_at), sortable: true },
    { name: 'Valid Until', selector: row => formatDate(row.valid_until), sortable: true },
    { name: 'Status', selector: row => {
      const status = calculateStatus(row);
      const labels = { refunded: 'Refunded', used: 'Used', expired: 'Expired', active: 'Active' };
      return labels[status];
    }, sortable: true, cell: row => {
      const status = calculateStatus(row);
      const statusConfig = {
        refunded: { bg: 'bg-red-100', text: 'text-red-700', label: 'Refunded' },
        used: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Used' },
        expired: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Expired' },
        active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' }
      };
      const config = statusConfig[status];
      return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      );
    }},
    {
      name: 'Actions',
      cell: row => (
        <div className="flex items-center gap-1 flex-nowrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePrintVoucher(row)}
            disabled={row.used_at !== null || row.refunded}
            title={row.used_at ? 'Cannot print used voucher' : row.refunded ? 'Cannot print refunded voucher' : 'Print voucher'}
            className="px-2 py-1 h-7 text-xs whitespace-nowrap"
          >
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditPayment(row)}
            disabled={row.refunded}
            title={row.refunded ? 'Cannot edit refunded payment' : 'Edit payment method'}
            className="px-2 py-1 h-7 text-xs whitespace-nowrap"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRefundPayment(row)}
            disabled={row.refunded}
            title={row.refunded ? 'Already refunded' : 'Refund payment'}
            className="px-2 py-1 h-7 text-xs whitespace-nowrap text-red-600 hover:text-red-700"
          >
            Refund
          </Button>
        </div>
      ),
      width: '180px'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Online Purchase Reports
        </h1>
        <ExportButton
          data={data}
          columns={columns}
          filename="Online_Purchase_Report"
          title="Online Purchase Report"
        />
      </div>

      {/* Statistics: 3-column grid (responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard title="Total Records" value={total} />
        <StatCard title="Current Page" value={data.length} />
        <StatCard title="Total Amount" value={`PGK ${data.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0).toFixed(2)}`} />
        <StatCard title="Active Vouchers" value={data.filter(v => calculateStatus(v) === 'active').length} />
        <StatCard
          title="Cash Payments"
          value={`${data.filter(v => v.payment_method === 'CASH').length} (K${data.filter(v => v.payment_method === 'CASH').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0).toFixed(0)})`}
        />
        <StatCard
          title="POS Payments"
          value={`${data.filter(v => v.payment_method === 'POS').length} (K${data.filter(v => v.payment_method === 'POS').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0).toFixed(0)})`}
        />
        <StatCard
          title="Online Payments"
          value={`${data.filter(v => v.payment_method === 'ONLINE').length} (K${data.filter(v => v.payment_method === 'ONLINE').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0).toFixed(0)})`}
        />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by voucher code, passport number, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
          >
            <option value="all">All Payment Types</option>
            <option value="CASH">Cash</option>
            <option value="POS">POS/Card</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
        <div className="flex justify-end mb-4">
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <DataTable
          columns={columns}
          data={data}
          pagination={false}
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
        />

        {/* Custom Backend Pagination Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {data.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} records
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchVouchers(1)}
              disabled={page === 1 || loading}
              variant="outline"
              size="sm"
            >
              First
            </Button>
            <Button
              onClick={() => fetchVouchers(page - 1)}
              disabled={page === 1 || loading}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              onClick={() => fetchVouchers(page + 1)}
              disabled={page >= totalPages || loading}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
            <Button
              onClick={() => fetchVouchers(totalPages)}
              disabled={page >= totalPages || loading}
              variant="outline"
              size="sm"
            >
              Last
            </Button>
          </div>
        </div>
      </div>

      <VoucherPrint
        voucher={selectedVoucher}
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        voucherType="Individual"
      />

      <EditPaymentModal
        payment={selectedPayment}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPayment(null);
        }}
        onSave={handleSavePayment}
      />

      <RefundPaymentModal
        payment={selectedPayment}
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedPayment(null);
        }}
        onRefund={handleProcessRefund}
      />
    </div>
  );
};

export default OnlinePurchaseReports;
