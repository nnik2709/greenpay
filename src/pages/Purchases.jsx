import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Printer, Search, Calendar, DollarSign, Hash, User, CreditCard, Filter, Download, Settings as SettingsIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getPassports, searchPassports, createPassport } from '@/lib/passportsService';
import { createIndividualPurchase } from '@/lib/individualPurchasesService';
import { getPaymentModes } from '@/lib/paymentModesStorage';
import { getSettings, updateSettings } from '@/lib/settingsService';
import { useAuth } from '@/contexts/AuthContext';
import VoucherPrint from '@/components/VoucherPrint';

const Purchases = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, individual, corporate

  // Add Payment Dialog
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [step, setStep] = useState(0); // 0=select passport, 1=payment, 2=voucher

  // Passport Selection
  const [passportSearch, setPassportSearch] = useState('');
  const [passportResults, setPassportResults] = useState([]);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [newPassportMode, setNewPassportMode] = useState(false);
  const [newPassportData, setNewPassportData] = useState({
    passportNumber: '',
    surname: '',
    givenName: '',
    nationality: '',
    dob: '',
    sex: '',
    dateOfExpiry: '',
  });

  // Payment
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [amount, setAmount] = useState(50);
  const [discount, setDiscount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Voucher
  const [generatedVoucher, setGeneratedVoucher] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Settings Dialog
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ voucher_validity_days: 30, default_amount: 50 });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const amountAfterDiscount = amount - (amount * (discount / 100));
  const returnedAmount = collectedAmount - amountAfterDiscount;

  useEffect(() => {
    loadTransactions();
    loadPaymentModes();
    loadSettings();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchQuery, transactions, typeFilter]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Load related vouchers separately
      const transactionsWithVouchers = await Promise.all(
        (data || []).map(async (transaction) => {
          let voucher = null;

          if (transaction.transaction_type === 'individual' || transaction.transaction_type === 'individual_purchase') {
            const { data: voucherData } = await supabase
              .from('individual_purchases')
              .select('id, voucher_code, valid_until')
              .eq('id', transaction.reference_id)
              .maybeSingle();
            voucher = voucherData;
          } else if (transaction.transaction_type === 'corporate' || transaction.transaction_type === 'corporate_bulk') {
            const { data: voucherData } = await supabase
              .from('corporate_vouchers')
              .select('id, voucher_code, valid_until')
              .eq('id', transaction.reference_id)
              .maybeSingle();
            voucher = voucherData;
          }

          return {
            ...transaction,
            voucher
          };
        })
      );

      setTransactions(transactionsWithVouchers || []);
      setFilteredTransactions(transactionsWithVouchers || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load transactions: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (typeFilter === 'individual') {
          return t.transaction_type === 'individual' || t.transaction_type === 'individual_purchase';
        }
        if (typeFilter === 'corporate') {
          return t.transaction_type === 'corporate' || t.transaction_type === 'corporate_bulk';
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.passport_number?.toLowerCase().includes(query) ||
        t.id?.toLowerCase().includes(query) ||
        t.payment_method?.toLowerCase().includes(query) ||
        t.voucher?.voucher_code?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const loadPaymentModes = async () => {
    const modes = await getPaymentModes();
    const activeModes = modes.filter(m => m.active);
    setPaymentModes(activeModes);
    if (activeModes.length > 0) {
      setSelectedMode(activeModes[0].name);
    }
  };

  const loadSettings = async () => {
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
    setAmount(loadedSettings.default_amount || 50);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Voucher validity and default amount updated successfully.",
      });
      setShowSettings(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSearchPassport = async () => {
    if (!passportSearch.trim()) {
      toast({ variant: "destructive", title: "Search Empty", description: "Enter a passport number." });
      return;
    }

    try {
      const results = await searchPassports(passportSearch.trim());

      // Filter out passports that already have active vouchers
      const now = new Date();
      const { data: existingVouchers } = await supabase
        .from('individual_purchases')
        .select('passport_number, valid_until')
        .in('passport_number', results.map(p => p.passport_number));

      const activeVouchers = new Set(
        (existingVouchers || [])
          .filter(v => new Date(v.valid_until) > now)
          .map(v => v.passport_number)
      );

      const availablePassports = results.filter(
        p => !activeVouchers.has(p.passport_number)
      );

      if (availablePassports.length === 0 && results.length > 0) {
        toast({
          variant: "destructive",
          title: "Passport Unavailable",
          description: "This passport already has an active voucher.",
        });
      }

      setPassportResults(availablePassports);
    } catch (error) {
      console.error('Search error:', error);
      toast({ variant: "destructive", title: "Search Failed", description: "Failed to search passports." });
    }
  };

  const handleSelectPassport = (passport) => {
    setSelectedPassport(passport);
    setStep(1);
  };

  const handleCreateNewPassport = () => {
    setNewPassportMode(true);
    setPassportResults([]);
  };

  const handleNewPassportSubmit = async () => {
    if (!newPassportData.passportNumber || !newPassportData.surname || !newPassportData.givenName) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill required fields." });
      return;
    }

    try {
      const passport = await createPassport(newPassportData, user?.id);
      setSelectedPassport(passport);
      setNewPassportMode(false);
      setStep(1);
      toast({ title: "Success", description: "Passport created successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create passport." });
    }
  };

  const handlePayment = async () => {
    if (collectedAmount < amountAfterDiscount) {
      toast({ variant: "destructive", title: "Insufficient Amount", description: "Collected amount is less than the total." });
      return;
    }

    const selectedModeObj = paymentModes.find(m => m.name === selectedMode);
    if (selectedModeObj?.collectCardDetails && (!cardNumber || !expiry || !cvc)) {
      toast({ variant: "destructive", title: "Card Details Required", description: "Please enter all card details." });
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate validity based on settings
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (settings.voucher_validity_days || 30));

      const purchaseData = {
        passportId: selectedPassport.id,
        passportNumber: selectedPassport.passport_number || selectedPassport.passportNumber,
        amount: amountAfterDiscount,
        paymentMethod: selectedMode,
        cardLastFour: selectedModeObj?.collectCardDetails ? cardNumber.slice(-4) : null,
        nationality: selectedPassport.nationality,
        validUntil: validUntil.toISOString(),
      };

      const voucher = await createIndividualPurchase(purchaseData, user?.id);
      setGeneratedVoucher(voucher);
      setStep(2);

      // Reload transactions
      loadTransactions();

      toast({ title: "Success!", description: "Payment processed and voucher generated." });
    } catch (error) {
      console.error('Payment error:', error);
      toast({ variant: "destructive", title: "Error", description: `Failed to process payment: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setShowAddPayment(false);
    setStep(0);
    setSelectedPassport(null);
    setPassportSearch('');
    setPassportResults([]);
    setNewPassportMode(false);
    setNewPassportData({
      passportNumber: '',
      surname: '',
      givenName: '',
      nationality: '',
      dob: '',
      sex: '',
      dateOfExpiry: '',
    });
    setGeneratedVoucher(null);
    setDiscount(0);
    setCollectedAmount(amount);
    setCardNumber('');
    setExpiry('');
    setCvc('');
  };

  const getExitPassId = (transaction) => {
    if (transaction.voucher && transaction.voucher.voucher_code) {
      return transaction.voucher.voucher_code;
    }
    return 'N/A';
  };

  const getTransactionType = (transaction) => {
    if (transaction.transaction_type === 'individual' || transaction.transaction_type === 'individual_purchase') {
      return 'Individual';
    }
    if (transaction.transaction_type === 'corporate' || transaction.transaction_type === 'corporate_bulk') {
      return 'Corporate';
    }
    return 'Unknown';
  };

  const handlePrintVoucherFromList = async (transaction) => {
    if (!transaction.voucher) {
      toast({ variant: "destructive", title: "No Voucher", description: "No voucher found for this transaction." });
      return;
    }

    // Load the full voucher with passport details
    try {
      let voucherData = null;
      const isIndividual = transaction.transaction_type === 'individual' || transaction.transaction_type === 'individual_purchase';

      if (isIndividual) {
        const { data } = await supabase
          .from('individual_purchases')
          .select('*')
          .eq('id', transaction.reference_id)
          .single();
        voucherData = data;
      } else {
        const { data } = await supabase
          .from('corporate_vouchers')
          .select('*')
          .eq('id', transaction.reference_id)
          .single();
        voucherData = data;
      }

      if (voucherData) {
        setGeneratedVoucher(voucherData);
        setShowPrintDialog(true);
      }
    } catch (error) {
      console.error('Error loading voucher:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load voucher details." });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Purchases & Transactions
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowAddPayment(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
            <Plus className="w-4 h-4 mr-2" />
            Add New Payment
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by passport number, payment ID, voucher code, or method..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Label className="text-sm text-slate-600">Type:</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-600">
                    <th className="pb-3 font-semibold">Payment ID</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Passport Number</th>
                    <th className="pb-3 font-semibold">Exit Pass ID</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Payment Method</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-sm">{transaction.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getTransactionType(transaction) === 'Individual'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {getTransactionType(transaction)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{transaction.passport_number}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {getExitPassId(transaction) !== 'N/A' ? (
                          <button
                            onClick={() => handlePrintVoucherFromList(transaction)}
                            className="font-mono text-sm text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            {getExitPassId(transaction)}
                          </button>
                        ) : (
                          <span className="font-mono text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">PGK {transaction.amount}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span>{transaction.payment_method}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintVoucherFromList(transaction)}
                          disabled={!transaction.voucher}
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={resetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 0 && 'Select or Create Passport'}
              {step === 1 && 'Process Payment'}
              {step === 2 && 'Voucher Generated'}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Step 0: Passport Selection */}
            {step === 0 && (
              <motion.div key="passport" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {!newPassportMode ? (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search passport number or name..."
                        value={passportSearch}
                        onChange={(e) => setPassportSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchPassport()}
                      />
                      <Button onClick={handleSearchPassport}>Search</Button>
                      <Button variant="outline" onClick={handleCreateNewPassport}>
                        <Plus className="w-4 h-4 mr-2" />
                        New
                      </Button>
                    </div>

                    {passportResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {passportResults.map(passport => (
                          <Card
                            key={passport.id}
                            className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => handleSelectPassport(passport)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold">
                                  {passport.given_name} {passport.surname}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {passport.passport_number} - {passport.nationality}
                                </p>
                              </div>
                              <Button size="sm">Select</Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Create New Passport</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Passport Number *</Label>
                        <Input
                          value={newPassportData.passportNumber}
                          onChange={(e) => setNewPassportData({ ...newPassportData, passportNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality *</Label>
                        <Input
                          value={newPassportData.nationality}
                          onChange={(e) => setNewPassportData({ ...newPassportData, nationality: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Surname *</Label>
                        <Input
                          value={newPassportData.surname}
                          onChange={(e) => setNewPassportData({ ...newPassportData, surname: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Given Name *</Label>
                        <Input
                          value={newPassportData.givenName}
                          onChange={(e) => setNewPassportData({ ...newPassportData, givenName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth *</Label>
                        <Input
                          type="date"
                          value={newPassportData.dob}
                          onChange={(e) => setNewPassportData({ ...newPassportData, dob: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sex *</Label>
                        <Select value={newPassportData.sex} onValueChange={(value) => setNewPassportData({ ...newPassportData, sex: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Expiry Date *</Label>
                        <Input
                          type="date"
                          value={newPassportData.dateOfExpiry}
                          onChange={(e) => setNewPassportData({ ...newPassportData, dateOfExpiry: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setNewPassportMode(false)}>Cancel</Button>
                      <Button onClick={handleNewPassportSubmit}>Create & Continue</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 1: Payment (reusing the same component logic as IndividualPurchase) */}
            {step === 1 && selectedPassport && (
              <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Selected Passport:</p>
                  <p className="font-semibold">
                    {selectedPassport.given_name || selectedPassport.givenName} {selectedPassport.surname} - {selectedPassport.passport_number || selectedPassport.passportNumber}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (PGK)</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount (%)</Label>
                    <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>After Discount</Label>
                    <Input value={amountAfterDiscount.toFixed(2)} readOnly className="bg-slate-100 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collected Amount</Label>
                    <Input type="number" value={collectedAmount} onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Change</Label>
                    <Input value={returnedAmount > 0 ? returnedAmount.toFixed(2) : '0.00'} readOnly className="bg-slate-100" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="grid grid-cols-3 gap-3">
                    {paymentModes.map(mode => (
                      <div key={mode.id} className="flex items-center space-x-2 border rounded-lg p-3">
                        <RadioGroupItem value={mode.name} id={mode.name} />
                        <Label htmlFor={mode.name} className="cursor-pointer">{mode.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {paymentModes.find(m => m.name === selectedMode)?.collectCardDetails && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Card Information</h3>
                    <Input placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                      <Input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} type="password" />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                  <Button onClick={handlePayment} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Process Payment'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Voucher */}
            {step === 2 && generatedVoucher && (
              <motion.div key="voucher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <h3 className="text-xl font-bold text-green-700 mb-2">Payment Successful!</h3>
                  <p className="text-green-600">Voucher generated: {generatedVoucher.voucher_code}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Passport:</p>
                    <p className="font-semibold">{selectedPassport.passport_number || selectedPassport.passportNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Amount:</p>
                    <p className="font-semibold">PGK {generatedVoucher.amount}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Valid Until:</p>
                    <p className="font-semibold">{new Date(generatedVoucher.valid_until).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Payment Method:</p>
                    <p className="font-semibold">{generatedVoucher.payment_method}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setShowPrintDialog(true)}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Voucher
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={resetDialog}>Done</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voucher Settings</DialogTitle>
            <DialogDescription>
              Configure default voucher validity period and amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Voucher Validity (Days)</Label>
              <Input
                type="number"
                value={settings.voucher_validity_days}
                onChange={(e) => setSettings({ ...settings, voucher_validity_days: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-slate-500">New vouchers will be valid for this many days</p>
            </div>
            <div className="space-y-2">
              <Label>Default Amount (PGK)</Label>
              <Input
                type="number"
                value={settings.default_amount}
                onChange={(e) => setSettings({ ...settings, default_amount: parseFloat(e.target.value) || 50 })}
              />
              <p className="text-xs text-slate-500">Default payment amount for new purchases</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              <Save className="w-4 h-4 mr-2" />
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      {generatedVoucher && (
        <VoucherPrint
          voucher={generatedVoucher}
          isOpen={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          voucherType="Individual"
        />
      )}
    </motion.div>
  );
};

export default Purchases;
