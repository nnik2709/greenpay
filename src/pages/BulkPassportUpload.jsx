import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CreditCard, QrCode, Check, Download, ChevronsRight, History, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Payments from '@/pages/Payments';

const steps = [
  { id: 1, name: 'Upload File', icon: UploadCloud },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'View Vouchers', icon: QrCode },
];

const recentUploads = [
    { id: 'UPL-001', date: '2025-09-28', passports: 50, status: 'Completed' },
    { id: 'UPL-002', date: '2025-09-27', passports: 25, status: 'Completed' },
    { id: 'UPL-003', date: '2025-09-25', passports: 10, status: 'Failed' },
];

const BulkPassportUpload = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [passportCount, setPassportCount] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      // Mock processing file
      setPassportCount(Math.floor(Math.random() * (100 - 20 + 1) + 20));
    }
  };

  const handleProceedToPayment = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Uploaded",
        description: "Please upload an Excel file to proceed.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handlePayment = (paymentData) => {
    setCurrentStep(3);
    toast({
      title: "Payment Successful!",
      description: "Vouchers for your bulk upload have been generated.",
    });
  };
  
  const handleStartOver = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setPassportCount(0);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "passportNo", "surname", "givenName", "nationality", "dob", "sex", 
      "placeOfBirth", "placeOfIssue", "dateOfIssue", "dateOfExpiry", "fileNumber"
    ];
    const exampleRow = [
      "P123456789", "Doe", "John", "Papua New Guinea", "1990-01-01", "Male",
      "Port Moresby", "Port Moresby", "2020-01-01", "2030-01-01", "FILE001"
    ];

    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "passport_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast({
      title: "Template Downloading",
      description: "Your passport_template.csv file has started downloading.",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center p-10 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/50">
              <UploadCloud className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-2 text-lg font-medium text-slate-800">Drag & drop your file here</h3>
              <p className="mt-1 text-sm text-slate-500">or</p>
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-emerald-600 hover:text-emerald-500">
                <span>Browse files</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
              </label>
              {uploadedFile && (
                <div className="mt-4 text-sm text-slate-700 flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>{uploadedFile.name} ({passportCount} passports detected)</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button onClick={handleProceedToPayment} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                Proceed to Payment <ChevronsRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 2:
        return <Payments onBack={() => setCurrentStep(1)} onPay={handlePayment} />;
      case 3:
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 p-8 bg-white/80 rounded-xl">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Upload & Payment Successful!</h2>
                <p className="text-slate-600">
                    Successfully processed <span className="font-bold text-emerald-700">{passportCount}</span> passports from your file <span className="font-semibold">{uploadedFile.name}</span>.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg" className="bg-slate-700 hover:bg-slate-800 text-white">
                        <FileSpreadsheet className="w-5 h-5 mr-2" />
                        Download Vouchers (CSV)
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleStartOver}>
                        Start New Bulk Upload
                    </Button>
                </div>
            </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          Bulk Passport Upload
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className={`flex-1 ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  <div className="flex items-center">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${currentStep > step.id ? 'bg-emerald-600' : currentStep === step.id ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      {currentStep > step.id ? <Check className="h-6 w-6 text-white" /> : <step.icon className="h-6 w-6 text-white" />}
                    </span>
                    <span className={`ml-4 text-sm font-medium ${currentStep >= step.id ? 'text-emerald-700' : 'text-slate-500'}`}>{step.name}</span>
                  </div>
                  {stepIdx !== steps.length - 1 ? (
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-slate-300 w-full" style={{ left: '2.5rem', right: '-2.5rem' }} />
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
            <AnimatePresence mode="wait">
              <div key={currentStep}>
                {renderStepContent()}
              </div>
            </AnimatePresence>
          </div>
        </div>
        
        <div className="lg:col-span-1">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 h-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
                    <History className="w-5 h-5 mr-2 text-emerald-600" />
                    Recent Uploads
                </h3>
                <ul className="space-y-3">
                    {recentUploads.map(upload => (
                        <li key={upload.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-slate-700">{upload.id}</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${upload.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {upload.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{upload.date} - {upload.passports} passports</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BulkPassportUpload;