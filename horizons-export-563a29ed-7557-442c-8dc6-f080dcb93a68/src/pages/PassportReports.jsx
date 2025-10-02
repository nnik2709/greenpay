
import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const data = [
  { id: 1, type: 'TYPE', nationality: 'NATIONALITY', passportNo: '54545', surname: 'SURNAME', givenName: 'Given Name', sex: 'Sex', dateOfExpiry: 'Date of Expiry' },
];

const columns = [
  { name: 'Type', selector: row => row.type, sortable: true },
  { name: 'Nationality', selector: row => row.nationality, sortable: true },
  { name: 'Passport No', selector: row => row.passportNo, sortable: true },
  { name: 'Surname', selector: row => row.surname, sortable: true },
  { name: 'Given Name', selector: row => row.givenName, sortable: true },
  { name: 'Sex', selector: row => row.sex, sortable: true },
  { name: 'Date of Expiry', selector: row => row.dateOfExpiry, sortable: true },
];

const customStyles = {
  header: {
    style: {
      minHeight: '56px',
    },
  },
  headRow: {
    style: {
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderTopColor: '#E2E8F0',
      backgroundColor: '#F8FAFC',
    },
  },
  headCells: {
    style: {
      '&:not(:last-of-type)': {
        borderRightStyle: 'solid',
        borderRightWidth: '1px',
        borderRightColor: '#E2E8F0',
      },
      color: '#475569',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  },
  cells: {
    style: {
      '&:not(:last-of-type)': {
        borderRightStyle: 'solid',
        borderRightWidth: '1px',
        borderRightColor: '#E2E8F0',
      },
    },
  },
};

const PassportReports = () => {
  const { toast } = useToast();

  const handleAction = (action) => {
    toast({
      title: "🚧 Feature In Progress!",
      description: `${action} isn't implemented yet. You can request it in your next prompt! 🚀`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Passports Report
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAction('Print Report')}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={() => handleAction('Download PDF')}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => handleAction('Download CSV')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input placeholder="Type" />
          <Input placeholder="Nationality" />
          <Input placeholder="Passport No" />
          <Input placeholder="Surname" />
        </div>
        <DataTable
          columns={columns}
          data={data}
          pagination
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
        />
      </div>
    </motion.div>
  );
};

export default PassportReports;
