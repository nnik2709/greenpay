import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  getTransactionsForReconciliation,
  createReconciliation,
  getReconciliations,
  calculateVariance,
  calculateDenominationTotal,
  updateReconciliationStatus,
} from '@/lib/cashReconciliationService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';

// Reviewer roles that can approve/reject reconciliations
const REVIEWER_ROLES = ['Finance_Manager', 'Flex_Admin'];

const CashReconciliation = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is a reviewer (Finance Manager or Admin)
  const isReviewer = REVIEWER_ROLES.includes(user?.role);

  // Show appropriate view based on role
  if (isReviewer) {
    return <ReviewerDashboard user={user} toast={toast} />;
  }

  return <AgentReconciliationForm user={user} toast={toast} />;
};

// ============================================
// REVIEWER DASHBOARD (Finance Manager / Admin)
// ============================================
const ReviewerDashboard = ({ user, toast }) => {
  const [reconciliations, setReconciliations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Detail view state
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadReconciliations();
  }, [statusFilter]);

  const loadReconciliations = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const data = await getReconciliations(filters);
      setReconciliations(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reconciliations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadReconciliations();
  };

  const openDetailModal = (rec) => {
    setSelectedReconciliation(rec);
    setManagerNotes('');
    setShowDetailModal(true);
  };

  const handleApprove = async () => {
    if (!selectedReconciliation) return;

    setIsProcessing(true);
    try {
      await updateReconciliationStatus(
        selectedReconciliation.id,
        'approved',
        user.id,
        managerNotes
      );

      toast({
        title: "Reconciliation Approved",
        description: `Reconciliation for ${selectedReconciliation.agent_name || 'agent'} has been approved.`,
      });

      setShowDetailModal(false);
      loadReconciliations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve reconciliation.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReconciliation) return;

    if (!managerNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Notes Required",
        description: "Please provide a reason for rejection.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateReconciliationStatus(
        selectedReconciliation.id,
        'rejected',
        user.id,
        managerNotes
      );

      toast({
        title: "Reconciliation Rejected",
        description: `Reconciliation has been rejected. Agent will be notified.`,
      });

      setShowDetailModal(false);
      loadReconciliations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject reconciliation.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getVarianceColor = (variance) => {
    const absVariance = Math.abs(variance || 0);
    if (absVariance === 0) return 'text-green-600 bg-green-50';
    if (absVariance <= 5) return 'text-yellow-600 bg-yellow-50';
    if (absVariance <= 20) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  // Parse denominations from JSON if needed
  const parseDenominations = (denom) => {
    if (!denom) return null;
    if (typeof denom === 'string') {
      try {
        return JSON.parse(denom);
      } catch {
        return null;
      }
    }
    return denom;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Cash Reconciliation Review
        </h1>
      </div>

      {/* Approval Guidelines */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Approval Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><span className="text-green-600 font-semibold">Approve:</span> Variance is zero (perfect balance)</li>
            <li><span className="text-green-600 font-semibold">Approve:</span> Variance is +/- PGK 5 or less with valid explanation</li>
            <li><span className="text-yellow-600 font-semibold">Review carefully:</span> Variance +/- PGK 6-20 requires detailed notes</li>
            <li><span className="text-red-600 font-semibold">Reject:</span> Variance over +/- PGK 20 without valid explanation</li>
            <li><span className="text-red-600 font-semibold">Reject:</span> Missing notes or insufficient explanation</li>
          </ul>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reconciliations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Reconciliation Submissions ({reconciliations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : reconciliations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No reconciliations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-semibold">Agent Name</th>
                    <th className="text-left p-3 font-semibold">Recon Date</th>
                    <th className="text-right p-3 font-semibold">Expected Cash</th>
                    <th className="text-right p-3 font-semibold">Actual Cash</th>
                    <th className="text-right p-3 font-semibold">Variance</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Submitted</th>
                    <th className="text-left p-3 font-semibold">Notes</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((rec) => (
                    <tr key={rec.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{rec.agent_name || rec.agent_id || 'Unknown'}</td>
                      <td className="p-3">{formatDate(rec.reconciliation_date)}</td>
                      <td className="p-3 text-right">PGK {parseFloat(rec.expected_cash || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">PGK {parseFloat(rec.actual_cash || 0).toFixed(2)}</td>
                      <td className={`p-3 text-right font-semibold`}>
                        <span className={`px-2 py-1 rounded ${getVarianceColor(rec.variance)}`}>
                          {rec.variance > 0 && '+'}{parseFloat(rec.variance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(rec.status)}</td>
                      <td className="p-3 text-xs">{formatDateTime(rec.created_at)}</td>
                      <td className="p-3 max-w-[150px] truncate" title={rec.notes}>
                        {rec.notes || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailModal(rec)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Review Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              Review Reconciliation
            </DialogTitle>
            <DialogDescription>
              Review and approve/reject this cash reconciliation submission
            </DialogDescription>
          </DialogHeader>

          {selectedReconciliation && (
            <div className="space-y-6 py-4">
              {/* Summary Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Agent</p>
                  <p className="font-semibold">{selectedReconciliation.agent_name || 'Unknown'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Reconciliation Date</p>
                  <p className="font-semibold">{formatDate(selectedReconciliation.reconciliation_date)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Submitted</p>
                  <p className="font-semibold text-sm">{formatDateTime(selectedReconciliation.created_at)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReconciliation.status)}</div>
                </div>
              </div>

              {/* Financial Summary */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Opening Float:</span>
                    <span className="font-semibold">PGK {parseFloat(selectedReconciliation.opening_float || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Total Collected:</span>
                    <span className="font-semibold">PGK {parseFloat(selectedReconciliation.total_collected || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>Expected Cash:</span>
                    <span className="font-semibold text-blue-700">PGK {parseFloat(selectedReconciliation.expected_cash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-emerald-50 rounded">
                    <span>Actual Cash Counted:</span>
                    <span className="font-semibold text-emerald-700">PGK {parseFloat(selectedReconciliation.actual_cash || 0).toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between p-3 rounded-lg border-2 ${
                    Math.abs(selectedReconciliation.variance || 0) === 0 ? 'bg-green-100 border-green-300' :
                    Math.abs(selectedReconciliation.variance || 0) <= 5 ? 'bg-yellow-100 border-yellow-300' :
                    Math.abs(selectedReconciliation.variance || 0) <= 20 ? 'bg-orange-100 border-orange-300' :
                    'bg-red-100 border-red-300'
                  }`}>
                    <span className="font-bold">Variance:</span>
                    <span className="font-bold text-lg">
                      {selectedReconciliation.variance > 0 && '+'}{parseFloat(selectedReconciliation.variance || 0).toFixed(2)} PGK
                    </span>
                  </div>

                  {/* Variance Warning */}
                  {Math.abs(selectedReconciliation.variance || 0) > 5 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <strong>Attention:</strong> Variance exceeds PGK 5.
                        {Math.abs(selectedReconciliation.variance || 0) > 20
                          ? ' This variance exceeds PGK 20 - requires valid explanation or should be rejected.'
                          : ' Please review agent notes carefully before approving.'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Denomination Breakdown */}
              {selectedReconciliation.cash_denominations && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Cash Denomination Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const denom = parseDenominations(selectedReconciliation.cash_denominations);
                      if (!denom) return <p className="text-slate-500">No denomination data</p>;

                      const denomLabels = {
                        hundred: 'K 100', fifty: 'K 50', twenty: 'K 20', ten: 'K 10',
                        five: 'K 5', two: 'K 2', one: 'K 1',
                        fiftyCents: '50t', twentyCents: '20t', tenCents: '10t', fiveCents: '5t'
                      };
                      const denomValues = {
                        hundred: 100, fifty: 50, twenty: 20, ten: 10,
                        five: 5, two: 2, one: 1,
                        fiftyCents: 0.50, twentyCents: 0.20, tenCents: 0.10, fiveCents: 0.05
                      };

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {Object.entries(denomLabels).map(([key, label]) => {
                            const count = denom[key] || 0;
                            const value = count * denomValues[key];
                            if (count === 0) return null;
                            return (
                              <div key={key} className="flex justify-between p-2 bg-slate-50 rounded">
                                <span>{label} x {count}</span>
                                <span className="font-semibold">= K {value.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Breakdown */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-slate-500">Cash</p>
                      <p className="font-bold text-yellow-700">PGK {parseFloat(selectedReconciliation.expected_cash - selectedReconciliation.opening_float || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-slate-500">Card</p>
                      <p className="font-bold text-purple-700">PGK {parseFloat(selectedReconciliation.card_transactions || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-slate-500">Bank Transfer</p>
                      <p className="font-bold text-blue-700">PGK {parseFloat(selectedReconciliation.bank_transfers || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-slate-500">EFTPOS</p>
                      <p className="font-bold text-teal-700">PGK {parseFloat(selectedReconciliation.eftpos_transactions || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Notes */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Agent Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-slate-50 rounded-lg min-h-[60px]">
                    {selectedReconciliation.notes || <span className="text-slate-400 italic">No notes provided</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Manager Notes (for approval/rejection) */}
              {selectedReconciliation.status === 'pending' && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Manager Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add notes (required for rejection)..."
                      value={managerNotes}
                      onChange={(e) => setManagerNotes(e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Previous Approval Notes (if already processed) */}
              {selectedReconciliation.status !== 'pending' && selectedReconciliation.approval_notes && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Manager Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      {selectedReconciliation.approval_notes}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedReconciliation?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  {isProcessing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isProcessing ? 'Processing...' : 'Approve'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// ============================================
// AGENT RECONCILIATION FORM (Counter Agent)
// ============================================
const AgentReconciliationForm = ({ user, toast }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reconciliation form data
  const [openingFloat, setOpeningFloat] = useState(0);
  const [denominations, setDenominations] = useState({
    hundred: 0,
    fifty: 0,
    twenty: 0,
    ten: 0,
    five: 0,
    two: 0,
    one: 0,
    fiftyCents: 0,
    twentyCents: 0,
    tenCents: 0,
    fiveCents: 0,
  });
  const [notes, setNotes] = useState('');
  const [actualCash, setActualCash] = useState(0);

  // Reconciliation history
  const [reconciliations, setReconciliations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (selectedDate && user) {
      loadTransactionSummary();
    }
  }, [selectedDate, user]);

  useEffect(() => {
    const total = calculateDenominationTotal(denominations);
    setActualCash(total);
  }, [denominations]);

  const loadTransactionSummary = async () => {
    setIsLoading(true);
    try {
      const summary = await getTransactionsForReconciliation(selectedDate, user.id);
      setTransactionSummary(summary);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transaction summary.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadReconciliations = async () => {
    try {
      const data = await getReconciliations({ agent_id: user.id });
      setReconciliations(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reconciliation history.",
      });
    }
  };

  const handleDenominationChange = (key, value) => {
    setDenominations(prev => ({
      ...prev,
      [key]: parseInt(value) || 0,
    }));
  };

  const handleSubmitReconciliation = async () => {
    if (!transactionSummary) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "Please load transaction summary first.",
      });
      return;
    }

    const expectedCash = transactionSummary.cash + openingFloat;
    const variance = calculateVariance(expectedCash, actualCash);

    try {
      const reconciliationData = {
        agentId: user.id,
        date: selectedDate,
        openingFloat: openingFloat,
        expectedCash: expectedCash,
        actualCash: actualCash,
        variance: variance,
        denominations: denominations,
        cardTotal: transactionSummary.card,
        bankTransferTotal: transactionSummary.bankTransfer,
        eftposTotal: transactionSummary.eftpos,
        totalCollected: transactionSummary.total,
        notes: notes,
      };

      await createReconciliation(reconciliationData);

      toast({
        title: "Reconciliation Submitted!",
        description: `Variance: PGK ${variance.toFixed(2)}. Awaiting manager approval.`,
      });

      // Reset form
      setDenominations({
        hundred: 0, fifty: 0, twenty: 0, ten: 0, five: 0, two: 0, one: 0,
        fiftyCents: 0, twentyCents: 0, tenCents: 0, fiveCents: 0,
      });
      setNotes('');
      setOpeningFloat(0);
      loadTransactionSummary();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit reconciliation.",
      });
    }
  };

  const variance = transactionSummary ? calculateVariance(
    transactionSummary.cash + openingFloat,
    actualCash
  ) : 0;

  const DenominationInput = ({ label, value, onChange, denomination }) => (
    <div className="flex items-center gap-3">
      <Label className="w-20 text-right">{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24"
      />
      <span className="text-sm text-slate-500">
        = PGK {((denomination) * (value || 0)).toFixed(2)}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Cash Reconciliation
        </h1>
        <Button variant="outline" onClick={() => { loadReconciliations(); setShowHistory(true); }}>
          View History
        </Button>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            Select Reconciliation Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex-1">
              <Label>Opening Float (PGK)</Label>
              <Input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <Button onClick={loadTransactionSummary} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load Transactions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {transactionSummary && (
        <>
          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                Transaction Summary for {new Date(selectedDate).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-emerald-700">{transactionSummary.count}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-700">PGK {transactionSummary.total.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-slate-600">Cash</p>
                  <p className="text-2xl font-bold text-yellow-700">PGK {transactionSummary.cash.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-slate-600">Card</p>
                  <p className="text-2xl font-bold text-purple-700">PGK {transactionSummary.card.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-slate-600">Other</p>
                  <p className="text-2xl font-bold text-teal-700">
                    PGK {(transactionSummary.bankTransfer + transactionSummary.eftpos).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Count */}
          <Card>
            <CardHeader>
              <CardTitle>
                Cash Denomination Count
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-700">Notes</h3>
                  <DenominationInput label="K 100" value={denominations.hundred} onChange={(v) => handleDenominationChange('hundred', v)} denomination={100} />
                  <DenominationInput label="K 50" value={denominations.fifty} onChange={(v) => handleDenominationChange('fifty', v)} denomination={50} />
                  <DenominationInput label="K 20" value={denominations.twenty} onChange={(v) => handleDenominationChange('twenty', v)} denomination={20} />
                  <DenominationInput label="K 10" value={denominations.ten} onChange={(v) => handleDenominationChange('ten', v)} denomination={10} />
                  <DenominationInput label="K 5" value={denominations.five} onChange={(v) => handleDenominationChange('five', v)} denomination={5} />
                  <DenominationInput label="K 2" value={denominations.two} onChange={(v) => handleDenominationChange('two', v)} denomination={2} />
                  <DenominationInput label="K 1" value={denominations.one} onChange={(v) => handleDenominationChange('one', v)} denomination={1} />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-700">Coins</h3>
                  <DenominationInput label="50t" value={denominations.fiftyCents} onChange={(v) => handleDenominationChange('fiftyCents', v)} denomination={0.50} />
                  <DenominationInput label="20t" value={denominations.twentyCents} onChange={(v) => handleDenominationChange('twentyCents', v)} denomination={0.20} />
                  <DenominationInput label="10t" value={denominations.tenCents} onChange={(v) => handleDenominationChange('tenCents', v)} denomination={0.10} />
                  <DenominationInput label="5t" value={denominations.fiveCents} onChange={(v) => handleDenominationChange('fiveCents', v)} denomination={0.05} />
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <Label>Notes (Optional - explain any discrepancies)</Label>
                <Input
                  placeholder="Any discrepancies or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reconciliation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                Reconciliation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <span>Opening Float:</span>
                  <span className="font-semibold">PGK {openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <span>Expected Cash (Float + Cash Sales):</span>
                  <span className="font-semibold">PGK {(transactionSummary.cash + openingFloat).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded">
                  <span className="font-semibold">Actual Cash Counted:</span>
                  <span className="font-bold text-emerald-700">PGK {actualCash.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-lg ${
                  variance === 0 ? 'bg-green-100 border-green-300' :
                  Math.abs(variance) <= 5 ? 'bg-yellow-100 border-yellow-300' :
                  'bg-red-100 border-red-300'
                } border-2`}>
                  <span className="font-bold text-lg">Variance:</span>
                  <span className="font-bold text-xl">
                    {variance > 0 && '+'}{variance.toFixed(2)} PGK
                  </span>
                </div>

                {variance !== 0 && (
                  <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                    {variance > 0 ? (
                      <p><strong>Overage:</strong> You have PGK {variance.toFixed(2)} more than expected. Please recount or explain in notes.</p>
                    ) : (
                      <p><strong>Shortage:</strong> You are short by PGK {Math.abs(variance).toFixed(2)}. Please recount or explain in notes.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleSubmitReconciliation}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                  size="lg"
                >
                  Submit Reconciliation
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reconciliation History</DialogTitle>
            <DialogDescription>
              View your past cash reconciliation submissions and their approval status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {reconciliations.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No reconciliation records found.</p>
            ) : (
              reconciliations.map((rec) => (
                <Card key={rec.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{new Date(rec.reconciliation_date).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            rec.status === 'approved' ? 'bg-green-100 text-green-800' :
                            rec.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Expected</p>
                            <p className="font-semibold">PGK {parseFloat(rec.expected_cash || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Actual</p>
                            <p className="font-semibold">PGK {parseFloat(rec.actual_cash || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Variance</p>
                            <p className={`font-semibold ${rec.variance > 0 ? 'text-green-600' : rec.variance < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                              {rec.variance > 0 && '+'}{parseFloat(rec.variance || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {rec.notes && (
                          <div className="text-sm">
                            <p className="text-slate-500">Your Notes:</p>
                            <p className="text-slate-700">{rec.notes}</p>
                          </div>
                        )}
                        {rec.approval_notes && (
                          <div className="text-sm mt-2 p-2 bg-slate-50 rounded">
                            <p className="text-slate-500">Manager Notes:</p>
                            <p className="text-slate-700">{rec.approval_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHistory(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CashReconciliation;
