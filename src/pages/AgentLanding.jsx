import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, CheckCircle, FileEdit } from 'lucide-react';

const AgentLanding = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 3 main actions for counter agents
  const mainActions = [
    {
      id: 1,
      title: "Add Passport & Generate Voucher",
      description: "Add new passport, process payment, and print GREEN CARD voucher at your desk using POS barcode printer",
      icon: PlusCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      hoverBg: "hover:bg-emerald-100",
      path: "/app/passports/create",
      emoji: "🆕",
      benefits: [
        "MRZ scanner or manual entry",
        "Accept cash/card/EFTPOS payment",
        "Print 8-character GREEN CARD instantly"
      ]
    },
    {
      id: 2,
      title: "Validate Existing Voucher",
      description: "Scan GREEN CARD voucher (corporate or online purchase) with USB barcode scanner to validate authenticity and status",
      icon: CheckCircle,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverBg: "hover:bg-blue-100",
      path: "/app/scan",
      emoji: "✅",
      benefits: [
        "Scan 8-character barcode",
        "Check voucher validity (12 months)",
        "Verify passport data attached"
      ]
    },
    {
      id: 3,
      title: "Add Passport to Voucher",
      description: "Add passport details to existing voucher (if purchased without passport data), then print complete GREEN CARD",
      icon: FileEdit,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverBg: "hover:bg-purple-100",
      path: "/voucher-registration",
      emoji: "📝",
      benefits: [
        "Link passport to existing voucher",
        "Update passport number and holder name",
        "Re-print complete GREEN CARD"
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      {/* Header with Logout */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                🎫
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  PNG Green Fees
                </h1>
                <p className="text-sm text-slate-600">Counter Agent Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">
                  {user?.name || user?.email?.split('@')[0] || 'Agent'}
                </p>
                <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ')}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-slate-300"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6 py-12"
      >
        {/* Welcome Header */}
        <motion.div variants={cardVariants} className="text-center mb-12">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Welcome Back!
          </h2>
          <p className="text-xl text-slate-600 mb-2">
            Choose an action below to get started
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mt-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-700">System Ready</span>
          </div>
        </motion.div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {mainActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                variants={cardVariants}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer h-full ${action.bgColor} ${action.borderColor} border-2 ${action.hoverBg} transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden group`}
                  onClick={() => navigate(action.path)}
                >
                  {/* Number badge */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-lg font-bold text-slate-700 shadow-md">
                    {action.id}
                  </div>

                  {/* Decorative gradient blob */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 ${action.bgColor} rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>

                  <CardContent className="p-8 relative">
                    {/* Icon */}
                    <div className={`w-20 h-20 mb-6 rounded-2xl bg-white shadow-lg flex items-center justify-center text-5xl transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                      {action.emoji}
                    </div>

                    {/* Title */}
                    <h3 className={`text-2xl font-bold mb-3 ${action.iconColor}`}>
                      {action.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-700 leading-relaxed mb-6">
                      {action.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2 mb-6">
                      {action.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 mt-0.5 ${action.iconColor} flex-shrink-0`} />
                          <span className="text-sm text-slate-600">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button
                      className={`w-full ${action.iconColor} bg-white border-2 ${action.borderColor} hover:bg-opacity-90 font-semibold group-hover:shadow-lg transition-all`}
                      size="lg"
                    >
                      Start Now →
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats / Info Banner */}
        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">8-Char</div>
                  <div className="text-sm text-slate-300">Voucher Code Format</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-400 mb-2">12 Months</div>
                  <div className="text-sm text-slate-300">Voucher Validity Period</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">GREEN CARD</div>
                  <div className="text-sm text-slate-300">Official Voucher Name</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AgentLanding;
