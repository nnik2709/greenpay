import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
      title: "Scan Passport & Generate Voucher",
      description: "Scan passport with PrehKeyTec MRZ scanner, process payment, and print GREEN CARD voucher at your desk using POS barcode printer",
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      hoverBg: "hover:bg-emerald-100",
      path: "/app/passports/create",
      benefits: [
        "PrehKeyTec MRZ scanner (primary method)",
        "Accept cash/card/POS Terminal payment",
        "Print 8-character GREEN CARD instantly"
      ]
    },
    {
      id: 2,
      title: "Validate Existing Voucher",
      description: "Scan GREEN CARD voucher (corporate or online purchase) with USB barcode scanner to validate authenticity and status",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverBg: "hover:bg-blue-100",
      path: "/app/scan",
      benefits: [
        "Scan 8-character barcode",
        "Check voucher validity (12 months)",
        "Verify passport data attached"
      ]
    },
    {
      id: 3,
      title: "Add Passport to Voucher",
      description: "Scan GREEN CARD voucher barcode, then scan passport with PrehKeyTec MRZ scanner to link them",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverBg: "hover:bg-purple-100",
      path: "/voucher-registration",
      benefits: [
        "Scan voucher barcode first",
        "PrehKeyTec MRZ scanner for passport",
        "Print or email complete GREEN CARD"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex flex-col">
      {/* Green Header with Navigation and Logout */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo removed - appears on login page only */}
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <a href="/app/agent" className="text-white/90 hover:text-white text-sm">Home</a>
                <a href="/app/passports" className="text-white/90 hover:text-white text-sm">All Passports</a>
                <a href="/app/passports/create" className="text-white/90 hover:text-white text-sm">Individual Green Pass</a>
                <a href="/app/vouchers-list" className="text-white/90 hover:text-white text-sm">Vouchers List</a>
                <a href="/app/scan" className="text-white/90 hover:text-white text-sm">Scan & Validate</a>
                <a href="/app/cash-reconciliation" className="text-white/90 hover:text-white text-sm">Cash Reconciliation</a>
              </nav>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/90">{user?.name || user?.email?.split('@')[0] || 'Agent'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact to fit on one screen */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 py-4 flex-1 flex flex-col"
      >
        {/* Welcome Header - Compact */}
        <motion.div variants={cardVariants} className="text-center mb-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-1">
            Welcome Back!
          </h2>
          <p className="text-sm text-slate-600">
            Choose an action below to get started
          </p>
        </motion.div>

        {/* 3 Main Action Cards - Professional & Engaging */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainActions.map((action, index) => {
            // Determine gradient colors based on action color
            const gradients = {
              emerald: 'from-emerald-50 to-emerald-100/50',
              blue: 'from-blue-50 to-blue-100/50',
              purple: 'from-purple-50 to-purple-100/50'
            };
            const gradientClass = action.iconColor.includes('emerald') ? gradients.emerald : 
                                 action.iconColor.includes('blue') ? gradients.blue : gradients.purple;
            
            return (
              <motion.div
                key={action.id}
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="flex"
              >
                <div
                  className={`cursor-pointer flex flex-col bg-gradient-to-br ${gradientClass} border-2 ${action.borderColor} rounded-xl ${action.hoverBg} transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-xl group`}
                  onClick={() => navigate(action.path)}
                >
                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 ${action.bgColor} opacity-30 rounded-bl-full transform translate-x-8 -translate-y-8`}></div>
                  
                  {/* Number badge - Enhanced */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-white/50">
                    <span className={action.iconColor}>{action.id}</span>
                  </div>

                  <div className="p-4 relative flex flex-col h-full">
                    {/* Title with accent */}
                    <div className="mb-2 pr-10">
                      <div className={`h-1 w-12 ${action.borderColor.replace('border-', 'bg-')} rounded-full mb-2`}></div>
                      <h3 className={`text-base font-bold mb-1 ${action.iconColor} leading-tight`}>
                        {action.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-700 leading-relaxed mb-3 line-clamp-2 flex-grow">
                      {action.description}
                    </p>

                    {/* Benefits - Enhanced */}
                    <div className="space-y-1.5 mb-3 bg-white/50 rounded-md p-2">
                      {action.benefits.slice(0, 2).map((benefit, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start">
                          <span className={`mr-2 ${action.iconColor} font-bold`}>•</span>
                          <span className="leading-tight flex-1">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button - Professional */}
                    <button
                      className={`w-full ${action.iconColor.replace('text-', 'bg-')} text-white border-0 hover:opacity-90 font-semibold text-sm py-2 h-9 rounded-lg text-center transition-all duration-200 shadow-md hover:shadow-lg group-hover:scale-[1.02] flex items-center justify-center gap-1`}
                    >
                      Start Now
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default AgentLanding;
