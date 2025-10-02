import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Paperclip, Send, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

const TicketDetail = ({ ticket, onBack, onUpdate, onAddResponse }) => {
  const [newResponse, setNewResponse] = useState('');
  const { user } = useAuth();
  const isAdmin = user.role === 'ROLE_VFLEX_ADMIN' || user.role === 'ROLE_IT_SUPPORT';

  if (!ticket) {
    return (
      <div>
        <p>Ticket not found.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const handleStatusChange = (newStatus) => {
    onUpdate(ticket.id, { status: newStatus });
  };

  const handleAddResponse = () => {
    if (newResponse.trim()) {
      onAddResponse(ticket.id, newResponse);
      setNewResponse('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'open':
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low':
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
          <p className="text-sm text-slate-500">Ticket #{ticket.ticketNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Conversation</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <UserCircle className="w-8 h-8 text-slate-400 mt-1" />
                <div className="flex-1 bg-emerald-50/60 rounded-lg p-4">
                  <p className="font-semibold text-slate-700">Original Request</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {ticket.responses && ticket.responses.map((response, index) => (
                <div key={index} className="flex gap-4">
                  <UserCircle className="w-8 h-8 text-slate-400 mt-1" />
                  <div className="flex-1 bg-blue-50/60 rounded-lg p-4">
                    <p className="font-semibold text-slate-700">Response</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{response.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(response.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
            <h3 className="font-semibold text-lg mb-4">Add a Response</h3>
            <div className="space-y-4">
              <Textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[120px]"
              />
              <div className="flex justify-between items-center">
                <Button variant="outline" size="icon" disabled>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button onClick={handleAddResponse} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 space-y-4">
            <h3 className="font-semibold text-lg">Ticket Details</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Status</span>
              {isAdmin ? (
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className={`w-[150px] h-8 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Priority</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Category</span>
              <span className="font-medium text-sm text-slate-700">{ticket.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Created</span>
              <span className="font-medium text-sm text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketDetail;