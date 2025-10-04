import { supabase } from './supabaseClient';

export const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

export const getTickets = async () => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
      responses: ticket.responses || [],
      createdBy: ticket.created_by,
    }));
  } catch (error) {
    console.error('Error loading tickets:', error);
    return [];
  }
};

export const createTicket = async (ticketData, userId) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        ticket_number: generateTicketNumber(),
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority || 'medium',
        status: 'open',
        created_by: userId,
        responses: [],
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      ticketNumber: data.ticket_number,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      responses: data.responses || [],
      createdBy: data.created_by,
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
    if (updates.responses !== undefined) updateData.responses = updates.responses;

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      ticketNumber: data.ticket_number,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      responses: data.responses || [],
      createdBy: data.created_by,
    };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return null;
  }
};

export const deleteTicket = async (ticketId) => {
  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

export const addResponse = async (ticketId, message) => {
  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('responses')
      .eq('id', ticketId)
      .single();

    if (fetchError) throw fetchError;

    const responses = ticket.responses || [];
    responses.push({
      message,
      timestamp: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('tickets')
      .update({ responses })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      ticketNumber: data.ticket_number,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      responses: data.responses || [],
      createdBy: data.created_by,
    };
  } catch (error) {
    console.error('Error adding response:', error);
    return null;
  }
};
