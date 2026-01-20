
/**
 * Email Templates Service
 * Uses real backend API endpoints for email template management
 */

import api from './api/client';

// Get all email templates
export const getEmailTemplates = async () => {
  try {
    const response = await api.get('/email-templates');
    return response.templates || [];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
};

// Get email template by ID
export const getEmailTemplateById = async (id) => {
  try {
    const response = await api.get(`/email-templates/${id}`);
    return response.template || null;
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
};

// Get email template by name
export const getEmailTemplate = async (name) => {
  try {
    const response = await api.get(`/email-templates/name/${name}`);
    return response.template || null;
  } catch (error) {
    console.error('Error fetching email template by name:', error);
    throw error;
  }
};

// Create new email template
export const createEmailTemplate = async (template) => {
  try {
    const response = await api.post('/email-templates', {
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
      is_active: template.is_active !== undefined ? template.is_active : true
    });
    return response.template;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
};

// Update email template
export const updateEmailTemplate = async (id, template) => {
  try {
    const response = await api.put(`/email-templates/${id}`, {
      name: template.name,
      description: template.description,
      subject: template.subject,
      body: template.body,
      variables: template.variables,
      is_active: template.is_active
    });
    return response.template;
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
};

// Delete email template
export const deleteEmailTemplate = async (id) => {
  try {
    await api.delete(`/email-templates/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
  }
};

// Preview email template with variables
export const previewEmailTemplate = async (id, variables) => {
  try {
    const response = await api.post(`/email-templates/${id}/preview`, {
      variables
    });
    return response.preview;
  } catch (error) {
    console.error('Error previewing email template:', error);
    throw error;
  }
};

// Send test email
export const sendTestEmail = async (id, email, variables) => {
  try {
    const response = await api.post(`/email-templates/${id}/send-test`, {
      email,
      variables
    });
    return response;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

// Test email template (alias for backward compatibility)
export const testEmailTemplate = async (templateId, testData = {}) => {
  try {
    // If testData has an email field, send test email
    if (testData.email) {
      return await sendTestEmail(templateId, testData.email, testData.variables || {});
    }
    // Otherwise just preview
    return await previewEmailTemplate(templateId, testData);
  } catch (error) {
    console.error('Error testing email template:', error);
    throw error;
  }
};

// Parse variables from template body
export const parseTemplateVariables = (body) => {
  const variables = new Set();

  // Match our template syntax: {{VARIABLE_NAME}}
  const matches = body.match(/\{\{([^}]+)\}\}/g);
  if (matches) {
    matches.forEach(match => {
      // Extract variable name (remove {{ and }})
      const variable = match.replace(/\{\{|\}\}/g, '').trim();
      variables.add(variable);
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

  // Replace variables with sample data using our {{VARIABLE}} syntax
  Object.keys(sampleData).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    preview = preview.replace(regex, sampleData[key]);
  });

  return preview;
};

// Default sample data for different template types (matching our template variables)
export const getDefaultSampleData = (templateName) => {
  const samples = {
    'individual_purchase': {
      CUSTOMER_NAME: 'John Smith',
      VOUCHER_CODE: 'IND-TEST123',
      AMOUNT: '50.00',
      PAYMENT_METHOD: 'CASH',
      ISSUE_DATE: new Date().toLocaleDateString(),
      VALID_UNTIL: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      REGISTRATION_URL: 'https://greenpay.eywademo.cloud/voucher/IND-TEST123'
    },
    'corporate_purchase': {
      CONTACT_NAME: 'Jane Doe',
      COMPANY_NAME: 'ABC Corporation Ltd.',
      VOUCHER_COUNT: '25',
      BATCH_ID: 'BATCH-2026-001',
      TOTAL_AMOUNT: '1250.00',
      PAYMENT_METHOD: 'Bank Transfer',
      ISSUE_DATE: new Date().toLocaleDateString(),
      REGISTRATION_BASE_URL: 'https://greenpay.eywademo.cloud/voucher/'
    },
    'quotation_email': {
      CUSTOMER_NAME: 'Michael Johnson',
      QUOTATION_NUMBER: 'QUO-2026-001',
      QUANTITY: '50',
      TOTAL_AMOUNT: '2500.00',
      VALID_UNTIL: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    },
    'invoice_email': {
      CUSTOMER_NAME: 'Sarah Williams',
      INVOICE_NUMBER: 'INV-2026-001',
      TOTAL_AMOUNT: '3500.00',
      PAYMENT_METHOD: 'Credit Card',
      INVOICE_DATE: new Date().toLocaleDateString()
    }
  };

  return samples[templateName] || {};
};








