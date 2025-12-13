import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getPassportById, updatePassport } from '@/lib/passportsService';

const EditPassport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passport, setPassport] = useState(null);
  const [formData, setFormData] = useState({
    passport_number: '',
    nationality: '',
    surname: '',
    given_name: '',
    date_of_birth: '',
    sex: '',
    date_of_expiry: '',
    place_of_birth: '',
    place_of_issue: '',
    date_of_issue: '',
  });

  useEffect(() => {
    loadPassport();
  }, [id]);

  const loadPassport = async () => {
    try {
      setLoading(true);
      const data = await getPassportById(id);
      
      if (!data) {
        toast({
          variant: 'destructive',
          title: 'Passport Not Found',
          description: 'The requested passport could not be found.',
        });
        navigate('/app/passports');
        return;
      }

      setPassport(data);
      setFormData({
        passport_number: data.passport_number || '',
        nationality: data.nationality || '',
        surname: data.surname || '',
        given_name: data.given_name || '',
        date_of_birth: data.date_of_birth || '',
        sex: data.sex || '',
        date_of_expiry: data.date_of_expiry || '',
        place_of_birth: data.place_of_birth || '',
        place_of_issue: data.place_of_issue || '',
        date_of_issue: data.date_of_issue || '',
      });
    } catch (error) {
      console.error('Error loading passport:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load passport data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSexChange = (value) => {
    setFormData(prev => ({
      ...prev,
      sex: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.passport_number || !formData.surname || !formData.given_name) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
        });
        return;
      }

      const result = await updatePassport(id, formData);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Passport updated successfully!',
        });
        navigate('/app/passports');
      } else {
        throw new Error(result.error || 'Failed to update passport');
      }
    } catch (error) {
      console.error('Error updating passport:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update passport.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Edit Passport
          </h1>
          <p className="text-slate-500 mt-2">Update passport information for {passport?.surname} {passport?.given_name}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/app/passports')}
        >
          ← Back to Passports
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-sm text-amber-800">
          <p className="font-semibold">⚠️ Important:</p>
          <p>Changes to passport information will be logged for audit purposes. Ensure all information is accurate before saving.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Core Passport Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">Core Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number *</Label>
                <Input
                  name="passport_number"
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={handleChange}
                  placeholder="e.g., P1234567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  name="nationality"
                  id="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="e.g., Australian"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="surname">Surname *</Label>
                <div className="relative">
                  <Input 
                    name="surname" 
                    id="surname" 
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="e.g., Smith" 
                    className="" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="given_name">Given Name *</Label>
                <div className="relative">
                  <Input 
                    name="given_name" 
                    id="given_name" 
                    value={formData.given_name}
                    onChange={handleChange}
                    placeholder="e.g., John" 
                    className="" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <div className="relative">
                  <Input 
                    name="date_of_birth" 
                    id="date_of_birth" 
                    type="date" 
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex *</Label>
                <Select 
                  value={formData.sex} 
                  onValueChange={handleSexChange}
                  required
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" className="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_of_expiry">Expiry Date *</Label>
                <div className="relative">
                  <Input 
                    name="date_of_expiry" 
                    id="date_of_expiry" 
                    type="date" 
                    value={formData.date_of_expiry}
                    onChange={handleChange}
                    className="" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_issue">Issue Date</Label>
                <div className="relative">
                  <Input 
                    name="date_of_issue" 
                    id="date_of_issue" 
                    type="date" 
                    value={formData.date_of_issue}
                    onChange={handleChange}
                    className="" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="place_of_birth">Place of Birth</Label>
                <div className="relative">
                  <Input 
                    name="place_of_birth" 
                    id="place_of_birth" 
                    value={formData.place_of_birth}
                    onChange={handleChange}
                    placeholder="e.g., Sydney" 
                    className="" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="place_of_issue">Place of Issue</Label>
                <div className="relative">
                  <Input 
                    name="place_of_issue" 
                    id="place_of_issue" 
                    value={formData.place_of_issue}
                    onChange={handleChange}
                    placeholder="e.g., Sydney" 
                    className="" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/app/passports')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditPassport;









