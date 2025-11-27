import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

const CashReconciliation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
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
        description: `Variance: PGK ${variance.toFixed(2)}`,
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
                <Label>Notes (Optional)</Label>
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
              View your past cash reconciliation submissions
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
                            <p className="font-semibold">PGK {rec.expected_cash?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Actual</p>
                            <p className="font-semibold">PGK {rec.actual_cash?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Variance</p>
                            <p className={`font-semibold ${rec.variance > 0 ? 'text-green-600' : rec.variance < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                              {rec.variance > 0 && '+'}{rec.variance?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {rec.notes && (
                          <div className="text-sm">
                            <p className="text-slate-500">Notes:</p>
                            <p className="text-slate-700">{rec.notes}</p>
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
