import { supabase } from './supabaseClient';

/**
 * Email Templates Service
 * Handles CRUD operations for email templates
 */

// Get all email templates
export const getEmailTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
};

// Get email template by name
export const getEmailTemplate = async (name) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
};

// Create new email template
export const createEmailTemplate = async (template) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert([{
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
};

// Update email template
export const updateEmailTemplate = async (id, template) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
};

// Delete email template
export const deleteEmailTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
  }
};

// Test email template by sending a test email
export const testEmailTemplate = async (templateName, testData = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: testData.email || 'test@example.com',
        subject: `TEST: ${templateName}`,
        template: templateName,
        variables: testData.variables || {}
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error testing email template:', error);
    throw error;
  }
};

// Parse variables from template body
export const parseTemplateVariables = (body) => {
  const variables = new Set();
  
  // Match Laravel Blade syntax: {{ $variable }}
  const bladeMatches = body.match(/\{\{\s*\$([^}]+)\s*\}\}/g);
  if (bladeMatches) {
    bladeMatches.forEach(match => {
      const variable = match.replace(/\{\{\s*\$|\s*\}\}/g, '');
      variables.add(variable);
    });
  }
  
  // Match simple placeholder syntax: {variable}
  const placeholderMatches = body.match(/\{([^}]+)\}/g);
  if (placeholderMatches) {
    placeholderMatches.forEach(match => {
      const variable = match.replace(/\{|\}/g, '');
      if (!variable.includes('$')) { // Exclude already parsed Laravel variables
        variables.add(variable);
      }
    });
  }
  
  return Array.from(variables);
};

// Validate template variables
export const validateTemplateVariables = (template) => {
  const errors = [];
  
  if (!template.name || template.name.trim() === '') {
    errors.push('Template name is required');
  }
  
  if (!template.subject || template.subject.trim() === '') {
    errors.push('Subject is required');
  }
  
  if (!template.body || template.body.trim() === '') {
    errors.push('Body is required');
  }
  
  // Check for unclosed tags
  const openTags = (template.body.match(/<[^\/][^>]*>/g) || []).length;
  const closeTags = (template.body.match(/<\/[^>]*>/g) || []).length;
  
  if (openTags !== closeTags) {
    errors.push('HTML tags are not properly closed');
  }
  
  return errors;
};

// Generate preview HTML with sample data
export const generateTemplatePreview = (template, sampleData = {}) => {
  let preview = template.body;
  
  // Replace variables with sample data
  Object.keys(sampleData).forEach(key => {
    const regex = new RegExp(`\\{\\{[^}]*\\$${key}[^}]*\\}\\}`, 'g');
    preview = preview.replace(regex, sampleData[key]);
    
    // Also replace simple placeholders
    const simpleRegex = new RegExp(`\\{${key}\\}`, 'g');
    preview = preview.replace(simpleRegex, sampleData[key]);
  });
  
  return preview;
};

// Default sample data for different template types
export const getDefaultSampleData = (templateName) => {
  const samples = {
    'individual-passport-voucher': {
      customer_name: 'John Doe',
      voucher_code: 'VOUCHER-12345',
      amount: 'PGK 100.00',
      validity_date: '2025-12-31'
    },
    'invoice-email': {
      'invoice->client_name': 'Corporate Client Ltd.',
      'invoice->invoice_number': 'INV-2025-001',
      'invoice->invoice_date': '2025-01-15',
      'invoice->due_date': '2025-02-15',
      'invoice->total_vouchers': '50',
      'invoice->voucher_value': '100.00',
      'invoice->amount_after_discount': '5000.00',
      'invoice->payment_mode': 'bank transfer'
    },
    'welcome': {
      'user->name': 'Jane Smith',
      'user->email': 'jane.smith@example.com',
      password: 'temp123',
      loginUrl: 'https://app.example.com/login'
    },
    'quotation-email': {
      'quotation->client_name': 'ABC Corporation',
      'quotation->quotation_number': 'QUO-2025-001',
      'quotation->subject': 'Government Exit Pass Vouchers',
      'quotation->total_amount': '10000.00',
      'quotation->total_vouchers': '100',
      'quotation->voucher_value': '100.00',
      'quotation->validity_date': '2025-12-31'
    },
    'ticket_created': {
      'ticket->subject': 'Unable to access system',
      'ticket->category': 'Technical Support',
      'ticket->priority': 'High',
      'ticket->description': 'I am unable to log into the system. Getting an error message.',
      'ticket->user->name': 'John User',
      'ticket->created_at': '2025-01-15 10:30:00'
    }
  };
  
  return samples[templateName] || {};
};








