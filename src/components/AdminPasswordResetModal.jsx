import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Mail, User, Send, Loader2 } from 'lucide-react';

const AdminPasswordResetModal = ({ isOpen, onClose }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, active')
        .eq('active', true)
        .order('email');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Users loaded successfully:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);

      // Show error state - no hardcoded fallback data
      setUsers([]);

      toast({
        title: "Error Loading Users",
        description: "Failed to load users from database. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user to reset password for.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the selected user's email
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        throw new Error('User not found');
      }

      // Send password reset email using Supabase Auth
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: `${window.location.origin}/reset-password`
        }
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: `A password reset email has been sent to ${user.email}`,
        variant: "default",
      });

      // Reset form and close modal
      setSelectedUser('');
      onClose();

    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'User not found. Please refresh and try again.';
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Send Password Reset Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            {(() => {
              console.log('Rendering Select component, isLoadingUsers:', isLoadingUsers, 'users.length:', users.length);
              console.log('Users data:', users);
              return null;
            })()}
            
            {isLoadingUsers ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500 border rounded-md">
                No users found
              </div>
            ) : (
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a user to reset password for</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.role_name || user.role || 'User'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedUser && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Password Reset Email</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    A secure password reset link will be sent to the selected user's email address. 
                    The link will expire in 24 hours for security purposes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordReset}
              disabled={isLoading || !selectedUser || isLoadingUsers}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Reset Email
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPasswordResetModal;
