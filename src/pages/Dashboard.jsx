import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api/client';

const StatCard = ({ title, value, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
      <h3 className="text-sm font-medium mb-2 opacity-90 relative z-10">{title}</h3>
      <p className="text-3xl md:text-4xl font-bold relative z-10">{value}</p>
    </motion.div>
  );
};

const processDataForCharts = (data) => {
    const lineChartData = Array(12).fill(0).map((_, i) => ({
        name: new Date(0, i).toLocaleString('default', { month: 'short' }),
        Individual: 0,
        Corporate: 0,
        Overall: 0,
    }));

    const barChartData = {};

    data.forEach(item => {
        const month = item.date.getMonth();
        lineChartData[month][item.type] += item.amount;
        lineChartData[month].Overall += item.amount;

        if (!barChartData[item.nationality]) {
            barChartData[item.nationality] = 0;
        }
        barChartData[item.nationality] += item.amount;
    });

    const formattedBarData = Object.entries(barChartData)
        .map(([name, Kina]) => ({ name, Kina }))
        .sort((a, b) => b.Kina - a.Kina)
        .slice(0, 7);

    return { lineChartData, barChartData: formattedBarData };
};

const Dashboard = () => {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [fromDate, setFromDate] = useState(oneMonthAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);
  const [filteredData, setFilteredData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [fromDate, toDate, transactions]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch all transactions from API
      const response = await api.transactions.getAll();
      const data = response.transactions || response.data || response;

      // Transform to match expected format
      const formattedData = (data || []).map(t => ({
        date: new Date(t.created_at || t.createdAt),
        amount: parseFloat(t.amount),
        paymentMethod: t.payment_method || t.paymentMethod || 'Cash',
        type: (t.transaction_type === 'individual' || t.transaction_type === 'individual_purchase' || t.transactionType === 'individual') ? 'Individual' : 'Corporate',
        nationality: t.nationality || 'Unknown'
      }));

      setTransactions(formattedData);
    } catch (error) {
      // Silently handle missing transactions endpoint - will be implemented later
      // console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const data = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
    setFilteredData(data);
  };

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= todayStart && transactionDate <= todayEnd;
    });

    const overallRevenue = filteredData.reduce((acc, t) => acc + t.amount, 0);
    const todaysRevenue = todaysTransactions.reduce((acc, t) => acc + t.amount, 0);
    const cardPayments = filteredData.filter(t => t.paymentMethod === 'Card').reduce((acc, t) => acc + t.amount, 0);
    const cashPayments = filteredData.filter(t => t.paymentMethod === 'Cash').reduce((acc, t) => acc + t.amount, 0);
    const totalIndividual = filteredData.filter(t => t.type === 'Individual').length;
    const totalCorporate = filteredData.filter(t => t.type === 'Corporate').length;

    return [
      { title: "Overall Revenue", value: `K ${overallRevenue.toLocaleString()}` },
      { title: "Today's Revenue", value: `K ${todaysRevenue.toLocaleString()}` },
      { title: "Card Payments", value: `K ${cardPayments.toLocaleString()}` },
      { title: "Cash Payments", value: `K ${cashPayments.toLocaleString()}` },
      { title: "Total Individual Purchases", value: totalIndividual },
      { title: "Total Corporate Purchases", value: totalCorporate },
    ];
  }, [filteredData]);

  const { lineChartData, barChartData } = useMemo(() => processDataForCharts(filteredData), [filteredData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-6 mb-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg">Monitor your green fees performance</p>
        </div>
        <div className="flex flex-wrap items-end gap-4 glass-effect p-5 rounded-xl">
          <div className="grid gap-2">
            <Label htmlFor="from-date" className="text-sm font-medium text-slate-700">From Date</Label>
            <Input id="from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-white border-slate-200 h-11" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to-date" className="text-sm font-medium text-slate-700">To Date</Label>
            <Input id="to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-white border-slate-200 h-11" />
          </div>
          <Button onClick={handleFilter} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 px-6 shadow-md hover:shadow-lg transition-all">Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 glass-effect card-hover border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-800">Individual Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `K ${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="Individual" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 glass-effect card-hover border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-800">Corporate Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `K ${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="Corporate" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 glass-effect card-hover border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-800">Overall Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `K ${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="Overall" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="glass-effect card-hover border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-slate-800">Revenue by Nationality (Kina)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => `K ${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Kina" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </motion.div>
  );
};

export default Dashboard;