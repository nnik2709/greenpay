import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AgentLanding = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const steps = [
    {
      number: 1,
      title: "Add Passport",
      description: "Create new passport entries or search existing ones",
      emoji: "👤",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      actions: [
        { label: "Create New Passport", path: "/passports/create" },
        { label: "Search Passports", path: "/passports" },
        { label: "Bulk Upload", path: "/passports/bulk-upload" }
      ]
    },
    {
      number: 2,
      title: "Receive Payment",
      description: "Process payments and record transactions",
      emoji: "💳",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      actions: [
        { label: "Process Payment", path: "/payments" },
        { label: "Scan & Validate", path: "/scan" }
      ]
    },
    {
      number: 3,
      title: "Print & Validate",
      description: "Generate vouchers and validate transactions",
      emoji: "🖨️",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      actions: [
        { label: "Print Vouchers", path: "/passports" },
        { label: "Validate QR Codes", path: "/scan" }
      ]
    }
  ];

  const quickActions = [
    {
      title: "Quick Passport Search",
      description: "Find existing passport records",
      emoji: "📄",
      path: "/passports",
      color: "bg-blue-500"
    },
    {
      title: "Process Payment",
      description: "Record a new payment transaction",
      emoji: "💰",
      path: "/payments",
      color: "bg-green-500"
    },
    {
      title: "Scan QR Code",
      description: "Validate existing vouchers",
      emoji: "📱",
      path: "/scan",
      color: "bg-purple-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center text-white text-xl">
                👤
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">PNG Green Fees</h1>
                <p className="text-sm text-slate-500">Counter Agent Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {user?.email?.split('@')[0] || 'Agent'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto p-6"
      >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          Counter Agent Portal
        </h1>
        <p className="text-xl text-slate-600 mb-2">
          Welcome back, {user?.email?.split('@')[0] || 'Agent'}!
        </p>
        <p className="text-lg text-slate-500">
          Follow these simple steps to process passport transactions efficiently
        </p>
      </motion.div>

      {/* Step-by-Step Workflow */}
      <motion.div variants={itemVariants} className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
          Transaction Workflow
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative"
            >
              <Card className={`${step.bgColor} ${step.borderColor} border-2 h-full`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${step.bgColor} ${step.borderColor} border-2 flex items-center justify-center text-4xl`}>
                    {step.emoji}
                  </div>
                  <CardTitle className={`text-2xl font-bold ${step.textColor}`}>
                    Step {step.number}
                  </CardTitle>
                  <h3 className={`text-xl font-semibold ${step.textColor} mt-2`}>
                    {step.title}
                  </h3>
                  <p className="text-slate-600 mt-2">
                    {step.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {step.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant="outline"
                      className={`w-full ${step.borderColor} ${step.textColor} hover:${step.bgColor} border-2`}
                      onClick={() => navigate(action.path)}
                    >
                      {action.label} →
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-slate-400 text-3xl">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer h-full hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-slate-300"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${action.color} flex items-center justify-center text-3xl`}>
                    {action.emoji}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-slate-600">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Status Summary */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">✓</span>
              <h3 className="text-xl font-semibold text-slate-800">
                System Ready
              </h3>
            </div>
            <p className="text-slate-600 mb-4">
              All systems are operational. You can start processing transactions immediately.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => navigate('/passports')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3"
              >
                Start with Passports
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/payments')}
                className="px-8 py-3"
              >
                Process Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </motion.div>
    </div>
  );
};

export default AgentLanding;
