
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const OfflineTemplate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const templateStructure = [
    { column: 'A', field: 'Passport Number', required: true, format: 'Text' },
    { column: 'B', field: 'Surname', required: true, format: 'Text' },
    { column: 'C', field: 'Given Name', required: true, format: 'Text' },
    { column: 'D', field: 'Nationality', required: false, format: 'Text' },
    { column: 'E', field: 'Date of Birth', required: false, format: 'YYYY-MM-DD' },
    { column: 'F', field: 'Sex', required: false, format: 'Male/Female/Other' },
    { column: 'P', field: 'Payment Mode', required: true, format: 'Cash/Card' },
    { column: 'Q', field: 'Voucher Value', required: true, format: 'Number' },
    { column: 'S', field: 'Collected Amount', required: true, format: 'Number' },
    { column: 'T', field: 'Email Address', required: false, format: 'Email' },
  ];

  const handleDownload = () => {
    const headers = [
      "passportNo", "surname", "givenName", "nationality", "dob", "sex",
      "placeOfBirth", "placeOfIssue", "dateOfIssue", "dateOfExpiry", "fileNumber",
      "paymentMode", "voucherValue", "discount", "collectedAmount", "emailAddress"
    ];
    const exampleRow = [
      "P123456789", "Doe", "John", "Papua New Guinea", "1990-01-01", "Male",
      "Port Moresby", "Port Moresby", "2020-01-01", "2030-01-01", "FILE001",
      "Cash", "50", "0", "50", "john.doe@example.com"
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
      link.setAttribute("download", "offline_passport_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast({
      title: "Template Downloading",
      description: "Your offline_passport_template.csv file has started downloading.",
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
        Download Excel Template
      </h1>

      <div className="bg-emerald-600 text-white rounded-xl p-6 text-center">
        <p className="font-semibold">Ready to Download! Click the button below to download the Excel template for offline data entry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">✓ Template Features</h2>
          <ul className="space-y-2 text-slate-600 list-disc list-inside">
            <li>Pre-filled headers and sample data</li>
            <li>All required fields marked with *</li>
            <li>Date format instructions (YYYY-MM-DD)</li>
            <li>Payment mode options (Cash/Card)</li>
            <li>Card payment fields included</li>
            <li>Auto-sized columns for easy reading</li>
          </ul>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">📋 Instructions</h2>
          <ul className="space-y-2 text-slate-600 list-decimal list-inside">
            <li>Download the template</li>
            <li>Fill in passport details</li>
            <li>Add payment information</li>
            <li>Save the file</li>
            <li>Upload when network is available</li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={handleDownload} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Download Excel Template
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">📊 Template Structure</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600">Column</th>
                <th className="p-3 text-left font-semibold text-slate-600">Field</th>
                <th className="p-3 text-left font-semibold text-slate-600">Required</th>
                <th className="p-3 text-left font-semibold text-slate-600">Format</th>
              </tr>
            </thead>
            <tbody>
              {templateStructure.map((item) => (
                <tr key={item.column} className="border-b border-slate-200">
                  <td className="p-3 font-mono text-slate-700">{item.column}</td>
                  <td className="p-3 text-slate-800">{item.field}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {item.required ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{item.format}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-right">
        <Button variant="outline" onClick={() => navigate('/app/payments/offline-upload')}>Go to Upload Page</Button>
      </div>
    </motion.div>
  );
};

export default OfflineTemplate;
