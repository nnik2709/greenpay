
const STORAGE_KEY = 'green_exit_tickets';

export const getTickets = () => {
  try {
    const tickets = localStorage.getItem(STORAGE_KEY);
    return tickets ? JSON.parse(tickets) : [];
  } catch (error) {
    console.error('Error loading tickets:', error);
    return [];
  }
};

export const saveTickets = (tickets) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error('Error saving tickets:', error);
  }
};

export const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

export const createTicket = (ticketData) => {
  const tickets = getTickets();
  const newTicket = {
    id: Date.now().toString(),
    ticketNumber: generateTicketNumber(),
    ...ticketData,
    status: 'open',
    createdAt: new Date().toISOString(),
    responses: [],
  };
  
  tickets.unshift(newTicket);
  saveTickets(tickets);
  return newTicket;
};

export const updateTicket = (ticketId, updates) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...updates };
    saveTickets(tickets);
    return tickets[index];
  }
  
  return null;
};

export const deleteTicket = (ticketId) => {
  const tickets = getTickets();
  const filteredTickets = tickets.filter(t => t.id !== ticketId);
  saveTickets(filteredTickets);
};

export const addResponse = (ticketId, message) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  
  if (index !== -1) {
    if (!tickets[index].responses) {
      tickets[index].responses = [];
    }
    
    tickets[index].responses.push({
      message,
      timestamp: new Date().toISOString(),
    });
    
    saveTickets(tickets);
    return tickets[index];
  }
  
  return null;
};
  