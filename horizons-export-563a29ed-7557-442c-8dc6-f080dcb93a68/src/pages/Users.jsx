import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { users as initialUsers } from '@/lib/authData';
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

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: '' });

  useEffect(() => {
    setUsers(initialUsers.map(u => ({...u, active: true})));
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setEditingUser({ ...selectedUser, password: '' });
    } else {
      setEditingUser(null);
    }
  }, [selectedUser]);

  const handleAction = (actionName) => {
    toast({
      title: "🚧 Feature In Progress!",
      description: `${actionName} isn't implemented yet. You can request it in your next prompt! 🚀`,
    });
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const newId = Math.max(...users.map(u => u.id)) + 1;
    setUsers([...users, { ...newUser, id: newId, active: true }]);
    setAddUserModalOpen(false);
    setNewUser({ email: '', password: '', role: '' });
    toast({
      title: "User Added! 🎉",
      description: `User ${newUser.email} has been successfully created.`,
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === editingUser.id ? { ...u, email: editingUser.email, role: editingUser.role } : u));
    setEditUserModalOpen(false);
    toast({
      title: "User Updated! ✨",
      description: `User ${editingUser.email}'s details have been updated.`,
    });
  };

  const openDeactivateModal = (user) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const handleDeactivateUser = () => {
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, active: !u.active } : u));
    setDeactivateModalOpen(false);
    toast({
      title: `User ${selectedUser.active ? 'Deactivated' : 'Activated'}!`,
      description: `User ${selectedUser.email}'s status has been updated.`,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Users
          </h1>
          <Button onClick={() => setAddUserModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600">Showing 1 to {users.length} of {users.length} entries</div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search..." className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">ID</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Login History</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">{user.role.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.active ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'}`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="link" className="p-0 h-auto text-emerald-600" onClick={() => handleAction('View Login History')}>
                        View Login History
                      </Button>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>Edit</Button>
                      <Button size="sm" variant={user.active ? "destructive" : "outline"} onClick={() => openDeactivateModal(user)}>
                        {user.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end pt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-emerald-100">1</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </div>
      </motion.div>

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
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="col-span-3" required />
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
              Update the user's details. Leave password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">Email</Label>
                  <Input id="edit-email" type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-password" className="text-right">Password</Label>
                  <Input id="edit-password" type="password" placeholder="Leave blank to keep current" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">Role</Label>
                  <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})} required>
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
              This will {selectedUser?.active ? 'deactivate' : 'activate'} the user account for <span className="font-bold">{selectedUser?.email}</span>. They will {selectedUser?.active ? 'lose' : 'regain'} access to the system.
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