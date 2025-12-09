import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';
import AddCustomerDialog from '@/components/AddCustomerDialog';

const CustomerSelector = ({ value, onSelect, className }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load customers",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerAdded = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    onSelect(newCustomer);
    setShowAddDialog(false);
    toast({
      title: "Customer Added",
      description: `${newCustomer.name} has been added successfully`,
    });
  };

  const selectedCustomer = customers.find(c => c.id === value);

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      (customer.company_name || '').toLowerCase().includes(query) ||
      (customer.email || '').toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <Label>Customer</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedCustomer
                ? `${selectedCustomer.name}${selectedCustomer.company_name ? ` (${selectedCustomer.company_name})` : ''}`
                : "Select customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="flex flex-col">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div
                  onClick={() => {
                    setOpen(false);
                    setShowAddDialog(true);
                  }}
                  className="flex items-center px-3 py-2 hover:bg-slate-100 cursor-pointer border-b"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="font-medium">Add New Customer</span>
                </div>
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500">
                    No customers found
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        onSelect(customer);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center px-3 py-2 hover:bg-slate-100 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 flex-shrink-0",
                          value === customer.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{customer.name}</div>
                        {customer.company_name && (
                          <div className="text-sm text-slate-500 truncate">{customer.company_name}</div>
                        )}
                        {customer.email && (
                          <div className="text-xs text-slate-400 truncate">{customer.email}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <AddCustomerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCustomerAdded={handleCustomerAdded}
      />
    </>
  );
};

export default CustomerSelector;
