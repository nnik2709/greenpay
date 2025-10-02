import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Code, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const EmailTemplates = () => {
  const { toast } = useToast();

  const templates = [
    { name: 'Individual Passport Voucher', file: 'individual-passport-voucher.blade.php', description: 'Voucher email for single passport purchases.' },
    { name: 'Share Invoice', file: 'invoice-email.blade.php', description: 'Invoice sharing email template.' },
    { name: 'Bulk Purchase Vouchers', file: 'passport-bulk-vouchers.blade.php', description: 'Email for bulk passport uploads.' },
    { name: 'Share Quotation', file: 'quotation-email.blade.php', description: 'Quotation sharing email template.' },
    { name: 'Corporate Purchase Vouchers', file: 'voucher-images.blade.php', description: 'Corporate voucher batch emails.' },
    { name: 'Support Ticket Created', file: 'ticket_created.blade.php', description: 'New ticket notification email.' },
    { name: 'Welcome Email', file: 'welcome.blade.php', description: 'Welcome email for new users.' },
    { name: 'New User Notification', file: 'new-user-notification.blade.php', description: 'New user creation alerts for admins.' },
  ];

  const handleEdit = (templateName) => {
    toast({
      title: "🚧 Feature In Progress!",
      description: `Editing for "${templateName}" isn't implemented yet. You can request it in your next prompt! 🚀`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        Email Templates Management
      </h1>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Available Templates</h2>
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.file} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-800">{template.name}</p>
                  <p className="text-sm text-slate-500">{template.description}</p>
                  <p className="text-xs font-mono text-slate-400 mt-1">{template.file}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit(template.name)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EmailTemplates;