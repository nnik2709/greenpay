import React from 'react';
import { motion } from 'framer-motion';
import { User, Hash, Globe, Calendar, VenetianMask, Upload, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreatePassport = ({ onSave }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const passportData = Object.fromEntries(formData.entries());
    onSave(passportData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="passport_no">Passport Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="passport_no" id="passport_no" placeholder="e.g., P1234567" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="nationality" id="nationality" placeholder="e.g., Australian" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Surname</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="surname" id="surname" placeholder="e.g., Smith" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="given_name">Given Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="given_name" id="given_name" placeholder="e.g., John" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input name="dob" id="dob" type="date" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select name="sex" required>
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