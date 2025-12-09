import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import api from '@/lib/api/client';

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passportFilter, setPassportFilter] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('');

  useEffect(() => {
    fetchPassports();
  }, [fromDate, toDate]);

  const fetchPassports = async () => {
    try {
      setLoading(true);

      // Build query params for date filtering
      const params = {};
      if (fromDate) params.dateFrom = fromDate;
      if (toDate) params.dateTo = toDate;

      const response = await api.get('/passports', { params });
      const passports = response.data || [];

      // Transform data to match table format
      const transformedData = passports.map(p => ({
        id: p.id,
        type: 'P', // Default type
        nationality: p.nationality,
        passportNo: p.passport_number || p.passportNo,
        surname: p.surname,
        givenName: p.given_name || p.givenName,
        dob: p.date_of_birth || p.dob,
        sex: p.sex,
        dateOfExpiry: p.date_of_expiry || p.dateOfExpiry,
      }));

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching passports:', error);
      alert('Failed to load passports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      alert('You must be logged in to export');
      return;
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/report-export`;
    const body = {
      type: 'passports',
      filters: {
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      },
      format: 'csv',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      alert(`Export failed: ${text}`);
      return;
    }

    const blob = await res.blob();
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `report_passports_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);
  };

  // Filter data based on search inputs
  const filteredData = data.filter(row => {
    const matchesPassport = !passportFilter || row.passportNo.toLowerCase().includes(passportFilter.toLowerCase());
    const matchesSurname = !surnameFilter || row.surname.toLowerCase().includes(surnameFilter.toLowerCase());
    return matchesPassport && matchesSurname;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Passports Report
        </h1>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm text-slate-600 mb-1">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-slate-600 mb-1">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <Input 
            placeholder="Filter by Passport No..." 
            value={passportFilter}
            onChange={(e) => setPassportFilter(e.target.value)}
          />
          <Input 
            placeholder="Filter by Surname..." 
            value={surnameFilter}
            onChange={(e) => setSurnameFilter(e.target.value)}
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
          progressComponent={<div className="py-8">Loading passports...</div>}
          noDataComponent={<div className="py-8 text-slate-500">No passports found</div>}
        />
      </div>
    </div>
  );
};

export default PassportReports;
