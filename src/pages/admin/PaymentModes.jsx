import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPaymentModes, addPaymentMode, updatePaymentMode } from '@/lib/paymentModesStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const PaymentModes = () => {
  const [paymentModes, setPaymentModes] = useState([]);
  const [newModeName, setNewModeName] = useState('');
  const [newModeCollectCard, setNewModeCollectCard] = useState(false);
  const [newModeActive, setNewModeActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaymentModes = async () => {
      const modes = await getPaymentModes();
      setPaymentModes(modes);
    };
    fetchPaymentModes();
  }, []);

  const handleAddMode = async () => {
    if (!newModeName.trim()) {
      toast({
        title: "Validation Error",
        description: "Payment mode name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addPaymentMode({
        name: newModeName,
        collectCardDetails: newModeCollectCard,
        active: newModeActive,
      });
      const modes = await getPaymentModes();
      setPaymentModes(modes);
      setNewModeName('');
      setNewModeCollectCard(false);
      setNewModeActive(true);
      toast({
        title: "Success",
        description: "New payment mode added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment mode. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updatePaymentMode(id, { active: !currentStatus });
      const modes = await getPaymentModes();
      setPaymentModes(modes);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment mode. Please try again.",
        variant: "destructive",
      });
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
        Payment Modes Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Existing Payment Modes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600">Name</th>
                  <th className="p-3 text-left font-semibold text-slate-600">Collect Card Details</th>
                  <th className="p-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentModes.map((mode) => (
                  <tr key={mode.id} className="border-b border-slate-200">
                    <td className="p-3 font-medium text-slate-800">{mode.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${mode.collectCardDetails ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {mode.collectCardDetails ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${mode.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {mode.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={mode.active}
                        onCheckedChange={() => handleToggleActive(mode.id, mode.active)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Payment Mode</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-mode-name">Name</Label>
              <Input
                id="new-mode-name"
                value={newModeName}
                onChange={(e) => setNewModeName(e.target.value)}
                placeholder="e.g., PAYPAL"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="collect-card" className="flex flex-col">
                <span>Collect Card Details</span>
                <span className="text-xs text-slate-500">Toggle if card info is needed.</span>
              </Label>
              <Switch
                id="collect-card"
                checked={newModeCollectCard}
                onCheckedChange={setNewModeCollectCard}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active-status" className="flex flex-col">
                <span>Active Status</span>
                <span className="text-xs text-slate-500">Enable/disable this method.</span>
              </Label>
              <Switch
                id="active-status"
                checked={newModeActive}
                onCheckedChange={setNewModeActive}
              />
            </div>
            <Button onClick={handleAddMode} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              + Add Payment Mode
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentModes;