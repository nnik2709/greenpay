import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Hash, Globe, Calendar, VenetianMask, Upload, Save, ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useScannerInput } from '@/hooks/useScannerInput';

const CreatePassport = ({ onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    passport_no: '',
    nationality: '',
    surname: '',
    given_name: '',
    dob: '',
    sex: ''
  });

  // Hardware scanner support with MRZ parsing
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: (data) => {
      if (data.type === 'mrz') {
        // MRZ passport scan - auto-fill all fields
        setFormData({
          passport_no: data.passportNumber,
          surname: data.surname,
          given_name: data.givenName,
          nationality: data.nationality,
          dob: data.dob,
          sex: data.sex === 'Male' ? 'M' : data.sex === 'Female' ? 'F' : 'X'
        });
        toast({
          title: "MRZ Scanned Successfully",
          description: "Passport details have been auto-filled. Please verify and add photos."
        });
      } else {
        // Simple passport number scan
        setFormData(prev => ({ ...prev, passport_no: data.value }));
        toast({
          title: "Passport Number Scanned",
          description: "Please enter remaining passport details manually."
        });
      }
    },
    onScanError: (error) => {
      toast({
        title: "Scan Error",
        description: error.message || "Failed to process scan. Please try again.",
        variant: "destructive"
      });
    },
    minLength: 5,
    scanTimeout: 100,
    enableMrzParsing: true,
    debugMode: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataObj = new FormData(e.target);
    const passportData = Object.fromEntries(formDataObj.entries());
    onSave(passportData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, sex: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
        {/* Scanner Status Indicator */}
        {isScannerActive && (
          <Card className="mb-6 bg-emerald-50 border-emerald-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ScanLine className="w-6 h-6 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-emerald-900">Scanning Passport MRZ...</h3>
                  <p className="text-emerald-700 text-sm">
                    Scan the 2 lines at the bottom of the passport for automatic data entry.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {!isScannerActive && (
          <Card className="mb-6 bg-blue-50 border-blue-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ScanLine className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-blue-900">Hardware Scanner Ready</h3>
                  <p className="text-blue-700 text-sm">
                    Use your scanner to scan passport MRZ for automatic form filling, or enter details manually below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="passport_no">Passport Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  name="passport_no"
                  id="passport_no"
                  placeholder="e.g., P1234567"
                  className="pl-10"
                  value={formData.passport_no}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  name="nationality"
                  id="nationality"
                  placeholder="e.g., Australian"
                  className="pl-10"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Surname</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  name="surname"
                  id="surname"
                  placeholder="e.g., Smith"
                  className="pl-10"
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="given_name">Given Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  name="given_name"
                  id="given_name"
                  placeholder="e.g., John"
                  className="pl-10"
                  value={formData.given_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  name="dob"
                  id="dob"
                  type="date"
                  className="pl-10"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                name="sex"
                value={formData.sex}
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger id="sex">
                  <VenetianMask className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <SelectValue placeholder="Select sex" className="pl-10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="X">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="photo">Passport Photo</Label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="photo" id="photo" type="file" className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature">Signature Image</Label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="signature" id="signature" type="file" className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Save className="w-5 h-5 mr-2" />
              Save and Proceed to Payment
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreatePassport;