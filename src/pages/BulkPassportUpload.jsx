import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CreditCard, QrCode, Check, Download, ChevronsRight, History, FileSpreadsheet, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Payments from '@/pages/Payments';
import { uploadBulkPassports, getBulkUploadHistory } from '@/lib/bulkUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const steps = [
  { id: 1, name: 'Upload File', icon: UploadCloud },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'View Vouchers', icon: QrCode },
];

const DEFAULT_FIELDS = [
  { id: 'passportNo', label: 'Passport Number', required: true, enabled: true },
  { id: 'surname', label: 'Surname', required: true, enabled: true },
  { id: 'givenName', label: 'Given Name', required: true, enabled: true },
  { id: 'nationality', label: 'Nationality', required: true, enabled: true },
  { id: 'dob', label: 'Date of Birth', required: true, enabled: true },
  { id: 'sex', label: 'Sex', required: true, enabled: true },
  { id: 'dateOfExpiry', label: 'Passport Expiry Date', required: true, enabled: true },
  { id: 'placeOfBirth', label: 'Place of Birth', required: false, enabled: false },
  { id: 'placeOfIssue', label: 'Place of Issue', required: false, enabled: false },
  { id: 'dateOfIssue', label: 'Date of Issue', required: false, enabled: false },
  { id: 'fileNumber', label: 'File Number', required: false, enabled: false },
  { id: 'email', label: 'Email Address', required: false, enabled: false },
  { id: 'phone', label: 'Phone Number', required: false, enabled: false },
];

const BulkPassportUpload = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [passportCount, setPassportCount] = useState(0);
  const [showFieldsConfig, setShowFieldsConfig] = useState(false);
  const [templateFields, setTemplateFields] = useState(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth check on mount:', session ? 'Authenticated' : 'Not authenticated');
      if (!session || !session.user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use bulk upload",
          variant: "destructive"
        });
      } else {
        console.log('User is logged in:', session.user.email);
      }
    };
    checkAuth();
  }, []);

  const fetchRecentUploads = async () => {
    try {
      const uploads = await getBulkUploadHistory(5);
      setRecentUploads(uploads.map(upload => ({
        id: upload.id || 'N/A',
        date: new Date(upload.created_at).toLocaleDateString(),
        passports: upload.total_records || 0,
        status: upload.status || 'Unknown'
      })));
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verify authentication before uploading
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      toast({
        title: "Not Authenticated",
        description: "Please log in to upload files",
        variant: "destructive"
      });
      e.target.value = ''; // Reset file input
      return;
    }

    setUploadedFile(file);
    setLoading(true);
    
    console.log('Starting file upload:', file.name);
    
    try {
      const result = await uploadBulkPassports(file);
      console.log('Upload result:', result);
      
      setUploadResult(result);
      setPassportCount(result.successCount);
      
      if (result.success) {
        if (result.errors.length > 0) {
          toast({
            title: "Partial Success",
            description: `${result.successCount} passports uploaded, ${result.errorCount} had errors`,
            variant: "warning"
          });
        } else {
          toast({
            title: "Upload Successful",
            description: `${result.successCount} passports processed successfully`,
          });
        }
        // Refresh recent uploads
        fetchRecentUploads();
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to process file',
        variant: "destructive"
      });
      setUploadedFile(null);
      setPassportCount(0);
    } finally {
      setLoading(false);
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
    fetchRecentUploads(); // Refresh recent uploads after payment
    toast({
      title: "Payment Successful!",
      description: "Vouchers for your bulk upload have been generated.",
    });
  };
  
  const handleStartOver = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setPassportCount(0);
    setUploadResult(null);
    fetchRecentUploads();
  };

  const toggleField = (fieldId) => {
    setTemplateFields(fields =>
      fields.map(f =>
        f.id === fieldId && !f.required
          ? { ...f, enabled: !f.enabled }
          : f
      )
    );
  };

  const handleDownloadTemplate = () => {
    // Get enabled fields only
    const enabledFields = templateFields.filter(f => f.enabled);
    const headers = enabledFields.map(f => f.id);

    // Generate example row with sample data
    const exampleData = {
      passportNo: "P123456789",
      surname: "Doe",
      givenName: "John",
      nationality: "Papua New Guinea",
      dob: "1990-01-01",
      sex: "Male",
      dateOfExpiry: "2030-01-01",
      placeOfBirth: "Port Moresby",
      placeOfIssue: "Port Moresby",
      dateOfIssue: "2020-01-01",
      fileNumber: "FILE001",
      email: "john.doe@example.com",
      phone: "+675 1234 5678"
    };

    const exampleRow = enabledFields.map(f => exampleData[f.id] || '');

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
      title: "Template Downloaded",
      description: `CSV template with ${enabledFields.length} fields has been downloaded.`,
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
              <label htmlFor="file-upload" className={`relative rounded-md font-semibold text-emerald-600 hover:text-emerald-500 ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <span>{loading ? 'Processing...' : 'Browse files'}</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv" disabled={loading} />
              </label>
              {uploadedFile && (
                <div className="mt-4 text-sm text-slate-700 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>{uploadedFile.name} ({passportCount} passports processed)</span>
                  </div>
                  {uploadResult && uploadResult.errorCount > 0 && (
                    <div className="text-xs text-orange-600">
                      {uploadResult.errorCount} records had errors
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFieldsConfig(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Template
                </Button>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template ({templateFields.filter(f => f.enabled).length} fields)
                </Button>
              </div>
              <Button onClick={handleProceedToPayment} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white" disabled={loading}>
                {loading ? 'Processing...' : 'Proceed to Payment'} <ChevronsRight className="w-5 h-5 ml-2" />
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
                {recentUploads.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No recent uploads</p>
                ) : (
                  <ul className="space-y-3">
                      {recentUploads.map(upload => (
                          <li key={upload.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex justify-between items-center">
                                  <p className="font-semibold text-slate-700 text-xs truncate">ID: {upload.id}</p>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${upload.status === 'completed' || upload.status === 'Completed' ? 'bg-green-100 text-green-800' : upload.status === 'failed' || upload.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {upload.status}
                                  </span>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">{upload.date} - {upload.passports} passports</p>
                          </li>
                      ))}
                  </ul>
                )}
            </div>
        </div>
      </div>

      {/* Template Configuration Dialog */}
      <Dialog open={showFieldsConfig} onOpenChange={setShowFieldsConfig}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure CSV Template Fields</DialogTitle>
            <DialogDescription>
              Enable or disable fields to include in your CSV template. Required fields cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Required Fields Section */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Required</span>
                Essential Fields
              </h3>
              <div className="space-y-3 pl-4 border-l-2 border-red-200">
                {templateFields.filter(f => f.required).map(field => (
                  <div key={field.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                    <div>
                      <Label htmlFor={field.id} className="font-medium text-slate-700">
                        {field.label}
                      </Label>
                      <p className="text-xs text-slate-500 mt-0.5">Field ID: {field.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Always included</span>
                      <Switch
                        id={field.id}
                        checked={true}
                        disabled={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Fields Section */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">Optional</span>
                Additional Fields
              </h3>
              <div className="space-y-3 pl-4 border-l-2 border-emerald-200">
                {templateFields.filter(f => !f.required).map(field => (
                  <div key={field.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div>
                      <Label htmlFor={field.id} className="font-medium text-slate-700 cursor-pointer">
                        {field.label}
                      </Label>
                      <p className="text-xs text-slate-500 mt-0.5">Field ID: {field.id}</p>
                    </div>
                    <Switch
                      id={field.id}
                      checked={field.enabled}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Total fields enabled:</strong> {templateFields.filter(f => f.enabled).length} out of {templateFields.length}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Your CSV template will include these {templateFields.filter(f => f.enabled).length} fields when downloaded.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldsConfig(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowFieldsConfig(false);
              toast({
                title: "Configuration Saved",
                description: `Template configured with ${templateFields.filter(f => f.enabled).length} fields.`,
              });
            }}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BulkPassportUpload;