import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import ExportButton from '@/components/ExportButton';

const data = [
  { id: 1, type: 'P', nationality: 'PNG', passportNo: 'PA123456', surname: 'DOE', givenName: 'JOHN', dob: '1990-01-01', sex: 'M', dateOfExpiry: '2030-01-01' },
  { id: 2, type: 'P', nationality: 'AUS', passportNo: 'PB654321', surname: 'SMITH', givenName: 'JANE', dob: '1992-05-15', sex: 'F', dateOfExpiry: '2028-05-15' },
];

const columns = [
  { name: 'Type', selector: row => row.type, sortable: true },
  { name: 'Nationality', selector: row => row.nationality, sortable: true },
  { name: 'Passport No', selector: row => row.passportNo, sortable: true },
  { name: 'Surname', selector: row => row.surname, sortable: true },
  { name: 'Given Name', selector: row => row.givenName, sortable: true },
  { name: 'DOB', selector: row => row.dob, sortable: true },
  { name: 'Sex', selector: row => row.sex, sortable: true },
  { name: 'Date of Expiry', selector: row => row.dateOfExpiry, sortable: true },
];

const customStyles = {
  header: { style: { minHeight: '56px' } },
  headRow: { style: { borderTopStyle: 'solid', borderTopWidth: '1px', borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' } },
  headCells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' }, color: '#475569', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' } },
  cells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' } } },
};

const PassportReports = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Passports Report
        </h1>
        <ExportButton
          data={data}
          columns={columns}
          filename="Passports_Report"
          title="Passports Report"
        />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input placeholder="Filter by Type..." />
          <Input placeholder="Filter by Nationality..." />
          <Input placeholder="Filter by Passport No..." />
          <Input placeholder="Filter by Surname..." />
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