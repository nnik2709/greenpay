import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getTickets, createTicket, updateTicket, addResponse as addResponseToStorage } from '@/lib/ticketStorage';
import TicketDashboard from '@/components/TicketDashboard';
import CreateTicket from '@/components/CreateTicket';
import TicketDetail from '@/components/TicketDetail';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Tickets = () => {
  const [view, setView] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTickets = useCallback(async () => {
    const storedTickets = await getTickets();
    setTickets(storedTickets);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (ticketData) => {
    try {
      const newTicket = await createTicket(ticketData, user?.id);
      toast({
        title: "Ticket Created!",
        description: `Ticket #${newTicket.ticketNumber} has been successfully created.`,
      });
      fetchTickets();
      setView('dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedTicket(null);
    setView('dashboard');
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      const updated = await updateTicket(ticketId, updates);
      toast({
        title: "Ticket Updated",
        description: "The ticket status has been changed.",
      });
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId && updated) {
        setSelectedTicket(updated);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddResponse = async (ticketId, message) => {
    try {
      const updated = await addResponseToStorage(ticketId, message);
      toast({
        title: "Response Added",
        description: "Your response has been added to the ticket.",
      });
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId && updated) {
        setSelectedTicket(updated);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderView = () => {
    switch (view) {
      case 'create':
        return <CreateTicket onBack={handleBack} onSubmit={handleCreateTicket} />;
      case 'detail':
        return (
          <TicketDetail
            ticket={selectedTicket}
            onBack={handleBack}
            onUpdate={handleUpdateTicket}
            onAddResponse={handleAddResponse}
          />
        );
      case 'dashboard':
      default:
        return (
          <TicketDashboard
            tickets={tickets}
            onViewTicket={handleViewTicket}
            onNewTicket={() => setView('create')}
            onTicketsUpdated={fetchTickets}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Tickets;