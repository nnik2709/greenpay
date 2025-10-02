import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, ScanLine, FileText, User, Calendar, Hash } from 'lucide-react';
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
import { passports as mockPassports } from '@/lib/passportData';

const Passports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
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

    const lowercasedQuery = searchQuery.toLowerCase();
    const results = mockPassports.filter(
      (passport) =>
        passport.passportNumber.toLowerCase().includes(lowercasedQuery) ||
        passport.surname.toLowerCase().includes(lowercasedQuery) ||
        passport.givenName.toLowerCase().includes(lowercasedQuery) ||
        `${passport.givenName.toLowerCase()} ${passport.surname.toLowerCase()}`.includes(lowercasedQuery)
    );
    setSearchResults(results);

    toast({
      title: "Search Complete",
      description: `${results.length} passport(s) found.`,
    });
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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto"
      >
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map((passport, index) => (
                      <motion.div
                        key={passport.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        <Card className="overflow-hidden card-hover border-slate-200">
                          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
                              <FileText className="text-emerald-600 w-5 h-5" />
                              {passport.givenName} {passport.surname}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-5 space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-slate-500" />
                              <strong>Passport No:</strong> {passport.passportNumber}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <strong>Nationality:</strong> {passport.nationality}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <strong>Expiry Date:</strong> {passport.dateOfExpiry}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">No passports found matching your search.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Passport</DialogTitle>
            <DialogDescription>
              Passport scanning via camera is not yet implemented. This feature will allow you to use your device's camera to automatically fill in passport details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8 bg-slate-100 rounded-lg">
            <p className="text-slate-500">Camera feed would appear here.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsScanModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Passports;
