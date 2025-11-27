import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, createUser, updateUser, activateUser, deactivateUser } from '@/lib/usersService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Users() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Check if current user is Flex_Admin (full access) or IT_Support (view only)
  const isFlexAdmin = currentUser?.role === 'Flex_Admin';
  const isITSupport = currentUser?.role === 'IT_Support';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      setEditingUser({ ...selectedUser, password: '', confirmPassword: '' });
    } else {
      setEditingUser(null);
    }
  }, [selectedUser]);

  const handleViewLoginHistory = (user) => {
    // Navigate to login history page with user filter
    navigate('/admin/login-history', {
      state: {
        userFilter: user.id,
        userName: user.email
      }
    });
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push('at least 8 characters');
    if (!hasUpperCase) errors.push('one uppercase letter');
    if (!hasDigit) errors.push('one digit');
    if (!hasSpecialChar) errors.push('one special character');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Validate password strength
    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: `Password must contain ${passwordValidation.errors.join(', ')}.`
      });
      return;
    }

    // Validate password confirmation
    if (newUser.password !== newUser.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Password and Confirm Password do not match."
      });
      return;
    }

    try {
      await createUser(newUser);
      await loadUsers();
      setAddUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: '' });
      toast({
        title: "User Added!",
        description: `User ${newUser.email} has been successfully created.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user"
      });
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowPasswordReset(false); // Reset password fields visibility
    setEditUserModalOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    // If password is being reset, validate it
    if (editingUser.password || editingUser.confirmPassword) {
      // Validate password strength
      const passwordValidation = validatePassword(editingUser.password);
      if (!passwordValidation.isValid) {
        toast({
          variant: "destructive",
          title: "Weak Password",
          description: `Password must contain ${passwordValidation.errors.join(', ')}.`
        });
        return;
      }

      // Validate password confirmation
      if (editingUser.password !== editingUser.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Password Mismatch",
          description: "Password and Confirm Password do not match."
        });
        return;
      }
    }

    try {
      const updateData = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      };

      // Only include password if it's being reset
      if (editingUser.password) {
        updateData.password = editingUser.password;
      }

      await updateUser(editingUser.id, updateData);
      await loadUsers();
      setEditUserModalOpen(false);
      toast({
        title: "User Updated!",
        description: `User ${editingUser.email}'s details have been updated.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user"
      });
    }
  };

  const openDeactivateModal = (user) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const handleDeactivateUser = async () => {
    try {
      const isActive = selectedUser.isActive !== undefined ? selectedUser.isActive : selectedUser.active;

      if (isActive) {
        await deactivateUser(selectedUser.id);
      } else {
        await activateUser(selectedUser.id);
      }

      await loadUsers();
      setDeactivateModalOpen(false);
      toast({
        title: `User ${isActive ? 'Deactivated' : 'Activated'}!`,
        description: `User ${selectedUser.email}'s status has been updated.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user status"
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            USERS
          </h1>
          {isFlexAdmin && (
            <Button onClick={() => setAddUserModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              ADD USER
            </Button>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Show</span>
              <Select value={entriesPerPage.toString()} onValueChange={(val) => setEntriesPerPage(parseInt(val))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-600">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Search:</span>
              <Input
                placeholder=""
                className="w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">ID</th>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Login History</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      No users found. Click "Add User" to create the first user.
                    </td>
                  </tr>
                ) : (
                  users.filter(user => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      (user.name || '').toLowerCase().includes(query) ||
                      (user.email || '').toLowerCase().includes(query) ||
                      (user.role_name || user.role || '').toLowerCase().includes(query)
                    );
                  }).slice(0, entriesPerPage).map(user => {
                    const isActive = user.isActive !== undefined ? user.isActive : user.active;
                    const userRole = user.role_name || user.role || 'N/A';

                    return (
                      <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-6 py-4">{user.id}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{user.name || 'N/A'}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{userRole.toUpperCase()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'text-white bg-green-600' : 'text-white bg-red-600'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-700 font-normal"
                            onClick={() => handleViewLoginHistory(user)}
                          >
                            View Login History
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          {isFlexAdmin ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(user)}
                                className="border-slate-300 hover:bg-slate-50"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={isActive ? "default" : "outline"}
                                onClick={() => openDeactivateModal(user)}
                                className={isActive ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">No actions available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
            <div>Showing 1 to {Math.min(entriesPerPage, users.length)} of {users.length} entries</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-emerald-100 text-emerald-700">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAddUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign a role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="password" className="text-right pt-2">Password</Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    placeholder="Enter password"
                  />
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                      <li className={newUser.password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                      <li className={/[A-Z]/.test(newUser.password) ? 'text-green-600' : ''}>One uppercase letter</li>
                      <li className={/\d/.test(newUser.password) ? 'text-green-600' : ''}>One digit</li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newUser.password) ? 'text-green-600' : ''}>One special character (!@#$%...)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  className="col-span-3"
                  required
                  placeholder="Re-enter password"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                <Select onValueChange={(value) => setNewUser({...newUser, role: value})} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flex_Admin">Flex Admin</SelectItem>
                    <SelectItem value="Finance_Manager">Finance Manager</SelectItem>
                    <SelectItem value="Counter_Agent">Counter Agent</SelectItem>
                    <SelectItem value="IT_Support">IT Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's information below.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser}>
              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingUser.role_name || editingUser.role}
                    onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flex_Admin">Flex Admin</SelectItem>
                      <SelectItem value="Finance_Manager">Finance Manager</SelectItem>
                      <SelectItem value="Counter_Agent">Counter Agent</SelectItem>
                      <SelectItem value="IT_Support">IT Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password Reset Section */}
                {!showPasswordReset ? (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordReset(true)}
                      className="w-full"
                    >
                      Reset Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">
                        Password Reset
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setEditingUser({...editingUser, password: '', confirmPassword: ''});
                        }}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-password">New Password</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        value={editingUser.password || ''}
                        onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-confirm-password">Confirm Password</Label>
                      <Input
                        id="edit-confirm-password"
                        type="password"
                        value={editingUser.confirmPassword || ''}
                        onChange={(e) => setEditingUser({...editingUser, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                      />
                    </div>

                    {/* Password requirements - only show if password is being entered */}
                    {editingUser.password && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 font-medium mb-2">Password requirements:</p>
                        <ul className="text-xs space-y-1">
                          <li className={editingUser.password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}>
                            {editingUser.password.length >= 8 ? '✓' : '○'} At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(editingUser.password) ? 'text-emerald-600' : 'text-slate-400'}>
                            {/[A-Z]/.test(editingUser.password) ? '✓' : '○'} One uppercase letter
                          </li>
                          <li className={/\d/.test(editingUser.password) ? 'text-emerald-600' : 'text-slate-400'}>
                            {/\d/.test(editingUser.password) ? '✓' : '○'} One digit
                          </li>
                          <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(editingUser.password) ? 'text-emerald-600' : 'text-slate-400'}>
                            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(editingUser.password) ? '✓' : '○'} One special character
                          </li>
                          <li className={editingUser.password && editingUser.password === editingUser.confirmPassword ? 'text-emerald-600' : 'text-slate-400'}>
                            {editingUser.password && editingUser.password === editingUser.confirmPassword ? '✓' : '○'} Passwords match
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {(selectedUser?.isActive !== undefined ? selectedUser?.isActive : selectedUser?.active) ? 'deactivate' : 'activate'} the user account for <span className="font-bold">{selectedUser?.email}</span>. They will {(selectedUser?.isActive !== undefined ? selectedUser?.isActive : selectedUser?.active) ? 'lose' : 'regain'} access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateUser}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Users;