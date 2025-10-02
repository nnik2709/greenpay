import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DollarSign, Users, CheckCircle, Clock, BarChart, QrCode, ScanLine, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const StatCard = ({ icon, title, value, color, index }) => {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-br ${color} p-3 rounded-xl shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-4xl font-bold text-slate-800">{value}</p>
    </motion.div>
  );
};

const ActionButton = ({ icon, title, to, index, onClick }) => {
  const Icon = icon;
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl text-white h-full"
    >
      <Icon className="w-10 h-10" />
      <span className="font-semibold text-center">{title}</span>
    </motion.div>
  );

  if (to) {
    return <Link to={to} className="block h-full" onClick={onClick}>{content}</Link>;
  }
  return <button onClick={onClick} className="block h-full w-full">{content}</button>;
};

const Dashboard = () => {
  const { toast } = useToast();

  const handleScanClick = () => {
    toast({
      title: "🚧 Feature In Progress!",
      description: "Passport scanning via camera isn't implemented yet. You can search by passport number on the Passports page.",
    });
  };
  
  const handleReportClick = (e) => {
    e.preventDefault();
    toast({
      title: "🚧 Feature In Progress!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const stats = [
    { icon: DollarSign, title: "Today's Revenue", value: "K 12,450", color: "from-green-500 to-emerald-600" },
    { icon: Users, title: "Passports Processed", value: "83", color: "from-blue-500 to-cyan-600" },
    { icon: CheckCircle, title: "Vouchers Issued", value: "79", color: "from-amber-500 to-orange-600" },
    { icon: Clock, title: "Pending Payments", value: "4", color: "from-red-500 to-pink-600" },
  ];

  const actions = [
    { icon: ScanLine, title: "Scan Passport", onClick: handleScanClick },
    { icon: CreditCard, title: "New Payment", to: "/payments" },
    { icon: QrCode, title: "Validate Voucher", to: "/vouchers" },
    { icon: BarChart, title: "View Reports", to: "/reports", onClick: handleReportClick },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Welcome, Counter Agent!
        </h1>
        <p className="text-slate-600">Here's a summary of today's activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <ActionButton key={action.title} {...action} index={index} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;