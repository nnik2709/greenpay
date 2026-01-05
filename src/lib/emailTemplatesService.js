
/**
 * Email Templates Service (Postgres/local fallback)
 * Supabase is not used; this module now provides an in-memory fallback to avoid runtime errors.
 * If/when backend endpoints are added, swap the implementations to real API calls.
 */

let localStore = [];
let idSeq = 1;

// Get all email templates
export const getEmailTemplates = async () => {
  return [...localStore];
};

// Get email template by name
export const getEmailTemplate = async (name) => {
  return localStore.find(t => t.name === name) || null;
};

// Create new email template
export const createEmailTemplate = async (template) => {
  const record = {
    id: idSeq++,
    name: template.name,
    subject: template.subject,
    body: template.body,
    variables: template.variables || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStore.push(record);
  return record;
};

// Update email template
export const updateEmailTemplate = async (id, template) => {
  const idx = localStore.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Template not found');
  const updated = {
    ...localStore[idx],
    name: template.name,
    subject: template.subject,
    body: template.body,
    variables: template.variables || [],
    updated_at: new Date().toISOString()
  };
  localStore[idx] = updated;
  return updated;
};

// Delete email template
export const deleteEmailTemplate = async (id) => {
  const before = localStore.length;
  localStore = localStore.filter(t => t.id !== id);
  if (localStore.length === before) throw new Error('Template not found');
  return true;
};

// Test email template by sending a test email (noop)
export const testEmailTemplate = async (_templateName, _testData = {}) => {
  return { success: true };
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








