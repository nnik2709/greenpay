import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getTickets, createTicket, updateTicket, addResponse as addResponseToStorage } from '@/lib/ticketStorage';
import TicketDashboard from '@/components/TicketDashboard';
import CreateTicket from '@/components/CreateTicket';
import TicketDetail from '@/components/TicketDetail';
import { useToast } from '@/components/ui/use-toast';

const Tickets = () => {
  const [view, setView] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { toast } = useToast();

  const fetchTickets = useCallback(() => {
    const storedTickets = getTickets();
    setTickets(storedTickets);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = (ticketData) => {
    createTicket(ticketData);
    toast({
      title: "Ticket Created!",
      description: `Ticket #${ticketData.ticketNumber} has been successfully created.`,
    });
    fetchTickets();
    setView('dashboard');
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedTicket(null);
    setView('dashboard');
  };

  const handleUpdateTicket = (ticketId, updates) => {
    updateTicket(ticketId, updates);
    toast({
      title: "Ticket Updated",
      description: "The ticket status has been changed.",
    });
    fetchTickets();
    // Also update the selected ticket if it's the one being viewed
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, ...updates }));
    }
  };

  const handleAddResponse = (ticketId, message) => {
    addResponseToStorage(ticketId, message);
    toast({
      title: "Response Added",
      description: "Your response has been added to the ticket.",
    });
    fetchTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = getTickets().find(t => t.id === ticketId);
        setSelectedTicket(updatedTicket);
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