import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const reportItems = [
  { title: 'Passport Reports', description: 'Analyze all passport data.', link: '/app/reports/passports' },
  { title: 'Individual Purchase', description: 'Track single transaction details.', link: '/app/reports/individual-purchase' },
  { title: 'Corporate Vouchers', description: 'Monitor bulk corporate sales.', link: '/app/reports/corporate-vouchers' },
  { title: 'Revenue Generated', description: 'View combined financial analysis.', link: '/app/reports/revenue-generated' },
  { title: 'Quotations Reports', description: 'Track business quotation pipeline.', link: '/app/reports/quotations' },
];

const Reports = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          Reporting Dashboard
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Select a report type below to get detailed insights and analytics across different areas of the system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className="h-full hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(item.link)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <div className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Reports;
