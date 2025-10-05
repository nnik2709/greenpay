import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Eye, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Lightweight, PNG English style default templates (no PHP refs)
const TEMPLATE_DEFS = [
  {
    id: 'individual_voucher',
    name: 'Individual Passport Voucher',
    description: 'Voucher email for a single traveller passport purchase.',
    subject: 'Your PNG Green Fee Voucher',
    html: `<p>Dear traveller,</p>
<p>Thank you for your payment. Your PNG Green Fee voucher is now ready.</p>
<p><strong>Voucher Code:</strong> {{VOUCHER_CODE}}<br/>
<strong>Passport No:</strong> {{PASSPORT_NUMBER}}<br/>
<strong>Issued On:</strong> {{ISSUE_DATE}}</p>
<p>Please keep this voucher for airport checks. For any questions, reply to this email.</p>
<p>Kind regards,<br/>PNG Green Fees Team</p>`
  },
  {
    id: 'invoice_share',
    name: 'Share Invoice',
    description: 'Invoice email for payments and records.',
    subject: 'PNG Green Fee Invoice {{INVOICE_NUMBER}}',
    html: `<p>Greetings,</p>
<p>Please find your PNG Green Fee invoice attached and available online.</p>
<p><strong>Invoice No:</strong> {{INVOICE_NUMBER}}<br/>
<strong>Amount:</strong> {{AMOUNT}} {{CURRENCY}}<br/>
<strong>Date:</strong> {{DATE}}</p>
<p>You may proceed with payment using the provided options.</p>
<p>Thank you,<br/>PNG Green Fees Team</p>`
  },
  {
    id: 'bulk_vouchers',
    name: 'Bulk Purchase Vouchers',
    description: 'Email for bulk passport uploads with multiple vouchers.',
    subject: 'PNG Green Fee Vouchers — Bulk Batch {{BATCH_NAME}}',
    html: `<p>Hello,</p>
<p>Your bulk PNG Green Fee vouchers are prepared. The batch includes {{COUNT}} travellers.</p>
<p>You can download the vouchers here: {{DOWNLOAD_LINK}}</p>
<p>Best regards,<br/>PNG Green Fees Team</p>`
  },
  {
    id: 'quotation_share',
    name: 'Share Quotation',
    description: 'Quotation email for estimate sharing.',
    subject: 'PNG Green Fee Quotation {{QUOTATION_NUMBER}}',
    html: `<p>Dear Sir/Madam,</p>
<p>Please review the attached quotation for PNG Green Fees.</p>
<p><strong>Quotation No:</strong> {{QUOTATION_NUMBER}}<br/>
<strong>Total:</strong> {{TOTAL}} {{CURRENCY}}</p>
<p>We remain available to assist with any clarifications.</p>
<p>Sincerely,<br/>PNG Green Fees Team</p>`
  },
  {
    id: 'corporate_vouchers',
    name: 'Corporate Purchase Vouchers',
    description: 'Corporate voucher batch notification email.',
    subject: 'Corporate Voucher Batch {{BATCH_NAME}} Ready',
    html: `<p>Dear Partner,</p>
<p>Your corporate voucher batch {{BATCH_NAME}} is ready.</p>
<p>Download link: {{DOWNLOAD_LINK}}</p>
<p>Regards,<br/>PNG Green Fees Team</p>`
  },
  {
    id: 'ticket_created',
    name: 'Support Ticket Created',
    description: 'Customer support ticket acknowledgement.',
    subject: 'We received your support request — Ticket {{TICKET_NUMBER}}',
    html: `<p>Dear customer,</p>
<p>We have registered your request with ticket number {{TICKET_NUMBER}}.</p>
<p>Our team will get back to you shortly. Thank you for your patience.</p>
<p>PNG Green Fees Support</p>`
  },
  {
    id: 'welcome_user',
    name: 'Welcome Email',
    description: 'Welcome message for newly registered users.',
    subject: 'Welcome to PNG Green Fees',
    html: `<p>Welcome,</p>
<p>Your PNG Green Fees account has been created.</p>
<p>You can now sign in and manage your payments and vouchers.</p>
<p>Warm regards,<br/>PNG Green Fees Team</p>`
  },
  {
    id: 'new_user_admin_alert',
    name: 'New User Notification',
    description: 'Admin alert when a new user is created.',
    subject: 'New User Created — {{USER_EMAIL}}',
    html: `<p>Admin,</p>
<p>A new user has been created: {{USER_EMAIL}}.</p>
<p>Role: {{ROLE}}</p>
<p>— PNG Green Fees System</p>`
  },
];

const findTemplateDef = (id) => TEMPLATE_DEFS.find(t => t.id === id);

const EmailTemplates = () => {
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState('individual_voucher');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const selectedDef = useMemo(() => findTemplateDef(selectedId), [selectedId]);

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      try {
        // Try to load from Supabase if exists, otherwise fallback to defaults
        const { data, error } = await supabase
          .from('email_templates')
          .select('template_key, name, subject, html, body')
          .eq('template_key', selectedId)
          .maybeSingle();

        if (error) {
          // Table may not exist or RLS; fallback to defaults silently
          setSubject(selectedDef?.subject || '');
          setHtml(selectedDef?.html || '');
          return;
        }

        if (data) {
          setSubject(data.subject || selectedDef?.subject || '');
          // Prefer body if present to match existing schema, fallback to html/defaults
          setHtml(data.body ?? data.html ?? selectedDef?.html ?? '');
        } else {
          setSubject(selectedDef?.subject || '');
          setHtml(selectedDef?.html || '');
        }
      } finally {
        setLoading(false);
      }
    };
    if (selectedDef) loadTemplate();
  }, [selectedId, selectedDef]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        template_key: selectedId,
        name: selectedDef?.name || selectedId,
        subject,
        html, // keep for forward compatibility
        body: html, // write to existing 'body' column to satisfy NOT NULL
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('email_templates')
        .upsert(payload, { onConflict: 'template_key' });

      if (error) throw error;

      toast({ title: 'Saved', description: 'Template saved successfully.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message || 'Could not save template.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ variant: 'destructive', title: 'Recipient required', description: 'Enter a test email address.' });
      return;
    }
    setSending(true);
    try {
      // Attempt to call an Edge Function named 'send-email'
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject,
          html,
          templateId: selectedId,
        }
      });

      if (error) throw error;

      toast({ title: 'Sent', description: 'Test email sent (if email service is configured).' });
    } catch (e) {
      // Fallback notice if no function configured
      toast({ title: 'Send Not Configured', description: 'Email function not available. Template content is ready; configure Edge Function to enable sending.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        Email Templates
      </h1>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Template</label>
            <div className="space-y-2">
              {TEMPLATE_DEFS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3 rounded-lg border ${selectedId === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'} hover:bg-emerald-50 transition`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">{t.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <Input name="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">HTML Content</label>
                <div className="text-xs text-slate-500">Use placeholders like {'{{VOUCHER_CODE}}'}, {'{{INVOICE_NUMBER}}'}</div>
              </div>
              <Textarea name="html" value={html} onChange={e => setHtml(e.target.value)} rows={12} className="font-mono" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Template
              </Button>
              <div className="flex items-center gap-2">
                <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Test recipient email" className="w-64" />
                <Button variant="outline" onClick={handleSendTest} disabled={sending || loading}>
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Test
                </Button>
              </div>
              <Button variant="secondary" onClick={() => window.open('about:blank', '_blank')?.document.write(html)}>
                <Eye className="w-4 h-4 mr-2" /> Preview HTML
              </Button>
            </div>

            {loading && (
              <div className="text-sm text-slate-500">Loading template…</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailTemplates;