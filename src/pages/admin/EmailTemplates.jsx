import React, { useState, useEffect } from 'react';
import { 
  getEmailTemplates, 
  createEmailTemplate, 
  updateEmailTemplate, 
  deleteEmailTemplate,
  testEmailTemplate,
  parseTemplateVariables,
  validateTemplateVariables,
  generateTemplatePreview,
  getDefaultSampleData
} from '@/lib/emailTemplatesService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EmailTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [previewData, setPreviewData] = useState({});
  const [testEmail, setTestEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    variables: []
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables || []
    });
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      body: '',
      variables: []
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    try {
      // Validate form data
      const errors = validateTemplateVariables(formData);
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // Parse variables from body
      const parsedVariables = parseTemplateVariables(formData.body);
      
      const templateData = {
        ...formData,
        variables: parsedVariables
      };

      if (selectedTemplate) {
        await updateEmailTemplate(selectedTemplate.id, templateData);
        toast({
          title: "Success",
          description: "Email template updated successfully"
        });
      } else {
        await createEmailTemplate(templateData);
        toast({
          title: "Success",
          description: "Email template created successfully"
        });
      }

      setShowEditDialog(false);
      fetchTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      await deleteEmailTemplate(template.id);
      toast({
        title: "Success",
        description: "Email template deleted successfully"
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewData(getDefaultSampleData(template.name));
    setShowPreviewDialog(true);
  };

  const handleTest = (template) => {
    setSelectedTemplate(template);
    setTestEmail('');
    setShowTestDialog(true);
  };

  const sendTestEmail = async () => {
    if (!testEmail || !selectedTemplate) return;

    try {
      await testEmailTemplate(selectedTemplate.name, {
        email: testEmail,
        variables: getDefaultSampleData(selectedTemplate.name)
      });
      
      toast({
        title: "Success",
        description: `Test email sent to ${testEmail}`
      });
      setShowTestDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const getPreviewHtml = () => {
    if (!selectedTemplate) return '';
    return generateTemplatePreview(selectedTemplate, previewData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading email templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Email Templates
          </h1>
          <p className="text-slate-600 mt-2">
            Manage email templates for automated communications
          </p>
        </div>
        <Button onClick={handleCreate}>
          + New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Templates ({templates.length})
          </CardTitle>
          <CardDescription>
            Click edit to modify templates, preview to see how they look, or test to send a sample email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No email templates found</p>
              <Button onClick={handleCreate} className="mt-4">
                Create Your First Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(template.variables || []).slice(0, 3).map((variable, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {(template.variables || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.variables || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(template)}
                        >
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., welcome-email"
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="e.g., Welcome to {app.name}"
              />
            </div>
            
            <div>
              <Label htmlFor="body">Email Body (HTML)</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="Enter HTML content..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-sm text-slate-500 mt-1">
                Use {'{{ $variable }}'} for Laravel syntax or {'{variable}'} for simple placeholders
              </p>
            </div>
            
            <div>
              <Label>Detected Variables</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {parseTemplateVariables(formData.body).map((variable, index) => (
                  <Badge key={index} variant="secondary">
                    {variable}
                  </Badge>
                ))}
                {parseTemplateVariables(formData.body).length === 0 && (
                  <span className="text-sm text-slate-500">No variables detected</span>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold mb-2">Sample Data</h3>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
            
            <div className="border rounded-lg">
              <div className="bg-slate-100 p-3 border-b">
                <h3 className="font-semibold">Rendered Email</h3>
              </div>
              <div 
                className="p-4 max-h-96 overflow-auto"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <span className="font-medium">⚠️ Test Email</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                A test email will be sent with sample data to verify the template works correctly.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendTestEmail}
              disabled={!testEmail}
            >
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates;