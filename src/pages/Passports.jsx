import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { useAuth } from '@/contexts/AuthContext';
import { useScannerInput } from '@/hooks/useScannerInput';

const Passports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Keyboard wedge scanner support for passport search
  const { inputRef: searchInputRef, scanData: scannedPassportData, isScanning: isScanningPassport, clearScan } = useScannerInput({
    onScan: (data) => {
      // If it's a passport MRZ scan, extract passport number
      if (data.passportNumber) {
        setSearchQuery(data.passportNumber);
        // Auto-search after scanning
        setTimeout(() => {
          handleSearch({ preventDefault: () => {} });
        }, 100);
      } else {
        // Simple barcode/voucher code
        setSearchQuery(data);
        setTimeout(() => {
          handleSearch({ preventDefault: () => {} });
        }, 100);
      }
    },
    enableMrzParsing: true
  });
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 100 });

  // Load passports on component mount and when page changes
  useEffect(() => {
    loadAllPassports();
  }, [currentPage]);

  const loadAllPassports = async () => {
    setIsLoading(true);
    try {
      const response = await getPassports({ page: currentPage, limit: 100 });
      setAllPassports(response.passports || []);
      setPagination(response.pagination || { total: 0, totalPages: 0, page: currentPage, limit: 100 });
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
    navigate('/app/passports/create');
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
              <div className="flex-grow relative">
                <Input
                  ref={searchInputRef}
                  id="passport-search"
                  placeholder="Enter Passport Number or Name... (or scan with KB scanner)"
                  className={`h-16 text-lg border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all rounded-xl ${isScanningPassport ? 'border-emerald-500 ring-2 ring-emerald-300 bg-emerald-50' : ''}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isScanningPassport && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                    Scanning...
                  </div>
                )}
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

          {/* All roles see view-only interface - search and view passports only */}
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-slate-600">
                          <th className="pb-3 font-semibold w-12">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={selectedIds.length === searchResults.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(searchResults.map(p => p.id));
                                } else {
                                  setSelectedIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="pb-3 font-semibold">Name</th>
                          <th className="pb-3 font-semibold">Passport No</th>
                          <th className="pb-3 font-semibold">Nationality</th>
                          <th className="pb-3 font-semibold">Expiry</th>
                          <th className="pb-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((passport) => (
                          <tr key={passport.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300"
                                checked={selectedIds.includes(passport.id)}
                                onChange={(e) => {
                                  setSelectedIds(prev => e.target.checked ? [...prev, passport.id] : prev.filter(id => id !== passport.id));
                                }}
                              />
                            </td>
                            <td className="py-4 font-semibold">
                              {passport.full_name || (passport.given_name || passport.givenName) + ' ' + (passport.surname || '')}
                            </td>
                            <td className="py-4">
                              <span className="font-mono text-sm">{passport.passport_number || passport.passportNo || passport.passportNumber}</span>
                            </td>
                            <td className="py-4">{passport.nationality || '—'}</td>
                            <td className="py-4">
                              {passport.expiry_date ? new Date(passport.expiry_date).toLocaleDateString() : (passport.date_of_expiry ? new Date(passport.date_of_expiry).toLocaleDateString() : (passport.dateOfExpiry ? new Date(passport.dateOfExpiry).toLocaleDateString() : '—'))}
                            </td>
                            <td className="py-4">
                              {/* View Vouchers feature removed */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  {isLoading ? 'Loading...' : `${pagination.total} total (page ${pagination.page} of ${pagination.totalPages})`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
              ) : allPassports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-slate-600">
                        <th className="pb-3 font-semibold w-12">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={selectedIds.length === allPassports.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(allPassports.map(p => p.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Passport No</th>
                        <th className="pb-3 font-semibold">Nationality</th>
                        <th className="pb-3 font-semibold">Expiry</th>
                        <th className="pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPassports.map((passport) => (
                        <tr key={passport.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={selectedIds.includes(passport.id)}
                              onChange={(e) => {
                                setSelectedIds(prev => e.target.checked ? [...prev, passport.id] : prev.filter(id => id !== passport.id));
                              }}
                            />
                          </td>
                          <td className="py-4 font-semibold">
                            {passport.full_name || (passport.given_name || passport.givenName) + ' ' + (passport.surname || '')}
                          </td>
                          <td className="py-4">
                            <span className="font-mono text-sm">{passport.passport_number || passport.passportNo || passport.passportNumber}</span>
                          </td>
                          <td className="py-4">{passport.nationality || '—'}</td>
                          <td className="py-4">
                            {passport.expiry_date ? new Date(passport.expiry_date).toLocaleDateString() : (passport.date_of_expiry ? new Date(passport.date_of_expiry).toLocaleDateString() : (passport.dateOfExpiry ? new Date(passport.dateOfExpiry).toLocaleDateString() : '—'))}
                          </td>
                          <td className="py-4">
                            {/* Actions placeholder */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-slate-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} passports
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={pagination.page === 1 || isLoading}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={pagination.page === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm font-medium text-slate-700">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                          disabled={pagination.page === pagination.totalPages || isLoading}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={pagination.page === pagination.totalPages || isLoading}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
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
              navigate('/app/passports/create', { 
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
