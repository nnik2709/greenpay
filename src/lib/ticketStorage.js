import { api } from './api/client';

export const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

export const getTickets = async () => {
  try {
    const data = await api.tickets.getAll();

    return (data || []).map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      createdBy: ticket.createdBy,
      responses: ticket.responses || [],
    }));
  } catch (error) {
    console.error('Error loading tickets:', error);
    return [];
  }
};

export const createTicket = async (ticketData, userId) => {
  try {
    const data = await api.tickets.create({
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
    });

    return {
      id: data.id,
      ticketNumber: data.ticketNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      responses: [],
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

export const updateTicket = async (ticketId, updates) => {
  try {
    const updateData = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;

    const data = await api.tickets.update(ticketId, updateData);

    return {
      id: data.id,
      ticketNumber: data.ticketNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      responses: data.responses || [],
    };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return null;
  }
};

export const deleteTicket = async (ticketId) => {
  try {
    await api.tickets.delete(ticketId);
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

export const addResponse = async (ticketId, message, isStaffResponse = false) => {
  try {
    await api.tickets.addResponse(ticketId, message, isStaffResponse);

    // Fetch updated ticket to get all responses
    const data = await api.tickets.getById(ticketId);

    return {
      id: data.id,
      ticketNumber: data.ticketNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      responses: data.responses || [],
    };
  } catch (error) {
    console.error('Error adding response:', error);
    return null;
  }
};
