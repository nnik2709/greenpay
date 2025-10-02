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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            Passport Management
          </h1>
          <p className="text-slate-600 text-lg">Search, create, or scan passports to begin.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100 space-y-8">
          <form onSubmit={handleSearch}>
            <label htmlFor="passport-search" className="block text-lg font-semibold text-slate-700 mb-3">
              Search for a Passport
            </label>
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="passport-search"
                  placeholder="Enter Passport Number or Name..."
                  className="pl-12 h-14 text-lg border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-500">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.03 }}>
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="w-full h-24 text-lg flex items-center justify-center gap-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <UserPlus className="w-6 h-6" />
                Create New Passport
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }}>
              <Button
                onClick={() => setIsScanModalOpen(true)}
                variant="outline"
                className="w-full h-24 text-lg flex items-center justify-center gap-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ScanLine className="w-6 h-6" />
                Scan with Camera
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {hasSearched && (
          <motion.div variants={itemVariants} className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((passport) => (
                      <motion.div key={passport.id} variants={itemVariants}>
                        <Card className="overflow-hidden">
                          <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <FileText className="text-emerald-600" />
                              {passport.givenName} {passport.surname}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-2 text-sm">
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
