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
import { mockTransactions } from '@/lib/dashboardData';

const StatCard = ({ title, value, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-4 shadow-lg"
    >
      <h3 className="text-sm font-medium mb-1 opacity-90">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
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
  const today = new Date('2025-10-02');
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [fromDate, setFromDate] = useState(oneMonthAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    handleFilter();
  }, []);

  const handleFilter = () => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const data = mockTransactions.filter(t => {
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

    const todaysTransactions = mockTransactions.filter(t => {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <div className="flex flex-wrap items-end gap-4 bg-white/80 p-4 rounded-lg shadow-sm">
          <div className="grid gap-1.5">
            <Label htmlFor="from-date">From Date</Label>
            <Input id="from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-white" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="to-date">To Date</Label>
            <Input id="to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-white" />
          </div>
          <Button onClick={handleFilter} className="bg-emerald-600 hover:bg-emerald-700 text-white">Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm shadow-lg border-emerald-100">
          <CardHeader>
            <CardTitle>Individual Purchases</CardTitle>
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
        <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm shadow-lg border-emerald-100">
          <CardHeader>
            <CardTitle>Corporate Purchases</CardTitle>
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
        <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm shadow-lg border-emerald-100">
          <CardHeader>
            <CardTitle>Overall Revenue</CardTitle>
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
      
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-emerald-100">
        <CardHeader>
          <CardTitle>Revenue by Nationality (Kina)</CardTitle>
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