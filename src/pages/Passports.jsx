import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, ScanLine, FileText, User, Calendar, Hash, Globe, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPassports, searchPassports } from '@/lib/passportsService';
import CameraMRZScanner from '@/components/CameraMRZScanner';

const PassportCard = ({ passport, index, selectedIds, setSelectedIds, openSendEmail }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <Card className={`overflow-hidden card-hover border-slate-200 ${selectedIds.includes(passport.id) ? 'ring-2 ring-emerald-300' : ''}`}>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
            <FileText className="text-emerald-600 w-5 h-5" />
            {passport.given_name || passport.givenName} {passport.surname}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={selectedIds.includes(passport.id)}
              onChange={(e) => {
                setSelectedIds(prev => e.target.checked ? [...prev, passport.id] : prev.filter(id => id !== passport.id));
              }}
            />
            <span className="text-slate-600">Select</span>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-500" />
            <strong>Passport No:</strong> {passport.passport_number || passport.passportNumber}
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <strong>Nationality:</strong> {passport.nationality}
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <strong>Sex:</strong> {passport.sex}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <strong>DOB:</strong> {passport.date_of_birth ? new Date(passport.date_of_birth).toLocaleDateString() : passport.dob}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <strong>Expiry:</strong> {passport.date_of_expiry ? new Date(passport.date_of_expiry).toLocaleDateString() : passport.dateOfExpiry}
          </div>
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={() => openSendEmail(passport)}>
              Send Voucher Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Passports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEmail, setBulkEmail] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [allPassports, setAllPassports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all passports on component mount
  useEffect(() => {
    loadAllPassports();
  }, []);

  const loadAllPassports = async () => {
    setIsLoading(true);
    try {
      const passports = await getPassports();
      setAllPassports(passports);
    } catch (error) {
      console.error('Error loading passports:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load passports.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultVoucherTemplate = useMemo(() => ({
    subject: 'Your PNG Green Fee Voucher',
    html: `<p>Dear traveller,</p>
<p>Thank you for your payment. Your PNG Green Fee voucher is now ready.</p>
<p><strong>Voucher Code:</strong> {{VOUCHER_CODE}}<br/>
<strong>Passport No:</strong> {{PASSPORT_NUMBER}}<br/>
<strong>Issued On:</strong> {{ISSUE_DATE}}</p>
<p>Please keep this voucher for airport checks. For any questions, reply to this email.</p>
<p>Kind regards,<br/>PNG Green Fees Team</p>`
  }), []);

  const openSendEmail = (passport) => {
    setSelectedPassport(passport);
    setRecipientEmail('');
    setIsEmailModalOpen(true);
  };

  const fillPlaceholders = (html) => {
    if (!selectedPassport) return html;
    return html
      .replaceAll('{{VOUCHER_CODE}}', selectedPassport.voucherCode || '—')
      .replaceAll('{{PASSPORT_NUMBER}}', selectedPassport.passportNumber || '—')
      .replaceAll('{{ISSUE_DATE}}', new Date().toLocaleDateString());
  };

  const handleSendVoucherEmail = async () => {
    if (!recipientEmail) {
      toast({ variant: 'destructive', title: 'Recipient required', description: 'Enter a recipient email.' });
      return;
    }
    setIsSending(true);
    try {
      // TODO: Implement email sending via API
      // For now, show a placeholder message
      toast({
        title: 'Email feature pending',
        description: 'Email sending functionality will be implemented in the backend API.'
      });
      setIsEmailModalOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Send failed', description: e?.message || 'Unable to send email.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      toast({
        variant: "destructive",
        title: "Search field is empty",
        description: "Please enter a passport number or name to search.",
      });
      return;
    }

    try {
      const results = await searchPassports(searchQuery.trim());
      setSearchResults(results);
      setSelectedIds([]);

      toast({
        title: "Search Complete",
        description: `${results.length} passport(s) found.`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Failed to search passports.",
      });
    }
  };

  const handleCreateNew = () => {
    navigate('/passports/create');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <motion.div className="max-w-4xl mx-auto">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            Passport Management
          </h1>
          <p className="text-slate-600 text-lg">Search, create, or scan passports to begin your journey.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect rounded-3xl p-10 space-y-10">
          <form onSubmit={handleSearch}>
            <label htmlFor="passport-search" className="block text-xl font-semibold text-slate-800 mb-4">
              Search for a Passport
            </label>
            <div className="flex gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                <Input
                  id="passport-search"
                  placeholder="Enter Passport Number or Name..."
                  className="pl-14 h-16 text-lg border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  size="lg"
                  className="h-16 px-8 text-lg font-semibold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-2xl transition-all rounded-xl"
                >
                  Search
                </Button>
              </motion.div>
            </div>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="flex-shrink mx-6 text-slate-500 font-medium">Or</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="w-full h-28 text-lg font-semibold flex items-center justify-center gap-3 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-400 rounded-2xl transition-all shadow-md hover:shadow-xl"
              >
                <UserPlus className="w-7 h-7" />
                Create New Passport
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsScanModalOpen(true)}
                variant="outline"
                className="w-full h-28 text-lg font-semibold flex items-center justify-center gap-3 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400 rounded-2xl transition-all shadow-md hover:shadow-xl"
              >
                <ScanLine className="w-7 h-7" />
                Scan with Camera
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {hasSearched && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="mt-10"
          >
            <Card className="glass-effect border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold text-slate-800">Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                {searchResults.length > 0 ? (
                  <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-slate-600">Selected: {selectedIds.length}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)} disabled={selectedIds.length === 0}>Send Bulk Email</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>Clear Selection</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map((passport, index) => (
                      <PassportCard key={passport.id} passport={passport} index={index} selectedIds={selectedIds} setSelectedIds={setSelectedIds} openSendEmail={openSendEmail} />
                    ))}
                  </div>
                  </>
                ) : (
                  <p className="text-center text-slate-500 py-8">No passports found matching your search.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* All Passports List */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-10"
        >
          <Card className="glass-effect border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-800 flex items-center justify-between">
                <span>All Passports</span>
                <span className="text-base font-normal text-slate-500">
                  {isLoading ? 'Loading...' : `${allPassports.length} total`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : allPassports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPassports.map((passport, index) => (
                    <PassportCard key={passport.id} passport={passport} index={index} selectedIds={selectedIds} setSelectedIds={setSelectedIds} openSendEmail={openSendEmail} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No passports found. Create your first passport to get started.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Passport MRZ</DialogTitle>
            <DialogDescription>
              Use your camera to scan the Machine Readable Zone (MRZ) at the bottom of the passport to automatically fill in passport details.
            </DialogDescription>
          </DialogHeader>
          <CameraMRZScanner 
            onScanSuccess={(passportData) => {
              // Navigate to create passport with pre-filled data
              navigate('/passports/create', { 
                state: { 
                  prefillData: passportData,
                  fromScan: true 
                } 
              });
              setIsScanModalOpen(false);
            }}
            onClose={() => setIsScanModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Send Voucher Email Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Voucher Email</DialogTitle>
            <DialogDescription>
              Send the voucher to the traveller’s email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-slate-600">Recipient Email</label>
            <Input
              type="email"
              placeholder="traveller@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} disabled={isSending}>Cancel</Button>
            <Button onClick={handleSendVoucherEmail} disabled={isSending}>
              {isSending ? 'Sending…' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Send Modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Voucher Emails</DialogTitle>
            <DialogDescription>
              {selectedIds.length} selected passport(s) will be included.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Recipient Email</label>
              <Input type="email" value={bulkEmail} onChange={(e) => setBulkEmail(e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Message (optional)</label>
              <Input value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} placeholder="Short message to include" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkSending}>Cancel</Button>
            <Button
              disabled={bulkSending || selectedIds.length === 0}
              onClick={async () => {
                if (!bulkEmail) {
                  toast({ variant: 'destructive', title: 'Recipient required', description: 'Enter a recipient email.' });
                  return;
                }
                setBulkSending(true);
                try {
                  // TODO: Implement bulk email sending via API
                  toast({
                    title: 'Bulk email feature pending',
                    description: 'Bulk email functionality will be implemented in the backend API.'
                  });
                  setBulkOpen(false);
                  setSelectedIds([]);
                } catch (e) {
                  toast({ variant: 'destructive', title: 'Bulk send failed', description: e?.message || 'Unable to send bulk vouchers.' });
                } finally {
                  setBulkSending(false);
                }
              }}
            >
              {bulkSending ? 'Sending…' : 'Send Bulk Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Passports;
