
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const OfflineUpload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please choose a file to upload.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Upload & Process",
      description: "This feature is not yet implemented.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        Upload Offline Excel Data
      </h1>

      <div className="bg-blue-100/50 border border-blue-200 text-blue-800 rounded-xl p-6">
        <h2 className="font-semibold mb-2">Instructions</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Upload the Excel file containing offline passport transactions.</li>
          <li>File must be in .xlsx or .xls format (max 10MB).</li>
          <li>Each row should contain complete passport and payment information.</li>
          <li>Required fields: Passport Number, Surname, Given Name, Payment Mode, Voucher Value, Collected Amount.</li>
        </ul>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
        <div className="space-y-2">
          <Label htmlFor="offline-file" className="text-lg font-semibold text-slate-700">Select Excel File</Label>
          <div className="flex items-center gap-4">
            <Input id="offline-file" type="file" onChange={handleFileChange} className="flex-grow" accept=".xlsx, .xls, .csv" />
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-slate-600 pt-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{selectedFile.name}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-2">Choose the Excel file with offline transaction data.</p>
        <div className="flex justify-end items-center gap-4 mt-8">
          <Button variant="outline" onClick={() => navigate('/purchases/offline-template')}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload & Process
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default OfflineUpload;
