import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Building, User } from 'lucide-react';
import api from '@/lib/api/client';

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Papua New Guinea',
    tin: '',
    is_gst_registered: false,
    contact_person: '',
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data || response);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load customers'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name?.toLowerCase().includes(query) ||
      customer.company_name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.tin?.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'Papua New Guinea',
      tin: '',
      is_gst_registered: false,
      contact_person: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      company_name: customer.company_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address_line1: customer.address_line1 || '',
      address_line2: customer.address_line2 || '',
      city: customer.city || '',
      province: customer.province || '',
      postal_code: customer.postal_code || '',
      country: customer.country || 'Papua New Guinea',
      tin: customer.tin || '',
      is_gst_registered: customer.is_gst_registered || false,
      contact_person: customer.contact_person || '',
      notes: customer.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.address_line1) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Customer name and address are required for PNG Tax Invoices'
      });
      return;
    }

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast({
          title: 'Success',
          description: 'Customer updated successfully'
        });
      } else {
        await api.post('/customers', formData);
        toast({
          title: 'Success',
          description: 'Customer created successfully'
        });
      }

      setModalOpen(false);
      loadCustomers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save customer'
      });
    }
  };

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) {
      return;
    }

    try {
      await api.delete(`/customers/${customerId}`);
      toast({
        title: 'Success',
        description: 'Customer deactivated successfully'
      });
      loadCustomers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to deactivate customer'
      });
    }
  };

  return (
    <main>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Customers
            </h1>
            <p className="text-slate-600 mt-1">Manage customer information for PNG GST Tax Invoices</p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers by name, company, email, or TIN..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-600">
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Contact</th>
                  <th scope="col" className="px-6 py-3">Address</th>
                  <th scope="col" className="px-6 py-3">TIN</th>
                  <th scope="col" className="px-6 py-3">GST</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <Building className="mx-auto h-12 w-12 text-slate-300" />
                      <h3 className="mt-2 text-lg font-medium text-slate-800">No customers found</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first customer'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {customer.company_name ? (
                              <>
                                <Building className="h-4 w-4 text-emerald-600" />
                                {customer.company_name}
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4 text-blue-600" />
                                {customer.name}
                              </>
                            )}
                          </div>
                          {customer.company_name && (
                            <div className="text-xs text-slate-500">Contact: {customer.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {customer.email && <div>{customer.email}</div>}
                          {customer.phone && <div className="text-slate-500">{customer.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs">
                          <div>{customer.address_line1}</div>
                          {customer.city && customer.province && (
                            <div className="text-slate-500">{customer.city}, {customer.province}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.tin ? (
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                            {customer.tin}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.is_gst_registered ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Registered
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                            Not Registered
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                Enter customer information. Address and name are required for PNG GST Tax Invoices.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name <span className="text-red-600">*</span></Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      placeholder="Company Ltd"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+675 xxx xxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Address (Required for PNG Tax Invoices)</h3>
                <div>
                  <Label>Address Line 1 <span className="text-red-600">*</span></Label>
                  <Input
                    value={formData.address_line1}
                    onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={formData.address_line2}
                    onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Port Moresby"
                    />
                  </div>
                  <div>
                    <Label>Province</Label>
                    <Input
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      placeholder="National Capital"
                    />
                  </div>
                  <div>
                    <Label>Postal Code</Label>
                    <Input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                      placeholder="111"
                    />
                  </div>
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Tax Information (PNG IRC)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>TIN (Tax Identification Number)</Label>
                    <Input
                      value={formData.tin}
                      onChange={(e) => setFormData({...formData, tin: e.target.value})}
                      placeholder="123456789"
                    />
                    <p className="text-xs text-slate-500 mt-1">From PNG Internal Revenue Commission</p>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_gst_registered"
                      checked={formData.is_gst_registered}
                      onChange={(e) => setFormData({...formData, is_gst_registered: e.target.checked})}
                      className="h-4 w-4 text-emerald-600 border-slate-300 rounded"
                    />
                    <Label htmlFor="is_gst_registered" className="cursor-pointer">
                      GST Registered in PNG
                    </Label>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Additional Information</h3>
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder="Primary contact person"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </main>
  );
};

export default Customers;
