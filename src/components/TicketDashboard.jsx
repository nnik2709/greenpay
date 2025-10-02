import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlusCircle, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicketList from '@/components/TicketList';

const StatCard = ({ title, value, icon, color, bgColor }) => {
  const Icon = icon;
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100 flex items-center gap-4`}>
      <div className={`p-3 rounded-full ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

const TicketDashboard = ({ tickets, onViewTicket, onNewTicket, onTicketsUpdated }) => {
  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, { open: 0, 'in-progress': 0, resolved: 0 });

  const categoryCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const stats = [
    { title: 'Open Tickets', value: statusCounts.open, icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'In Progress', value: statusCounts['in-progress'], icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Resolved', value: statusCounts.resolved, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Support Dashboard
        </h1>
        <Button onClick={onNewTicket} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + index * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Tickets by Category</h3>
          {tickets.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 py-12">No ticket data to display.</p>}
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Tickets by Status</h3>
          {tickets.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[statusCounts]}>
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="open" stackId="a" fill="#F59E0B" name="Open" />
                <Bar dataKey="in-progress" stackId="a" fill="#3B82F6" name="In Progress" />
                <Bar dataKey="resolved" stackId="a" fill="#10B981" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 py-12">No ticket data to display.</p>}
        </div>
      </motion.div>

      <TicketList tickets={tickets} onViewTicket={onViewTicket} onTicketsUpdated={onTicketsUpdated} />
    </div>
  );
};

export default TicketDashboard;