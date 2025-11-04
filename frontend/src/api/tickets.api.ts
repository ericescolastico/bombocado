import api from '@/lib/api';
import { Ticket, CreateTicketDto, UpdateTicketDto, MoveTicketDto, TicketStatus } from '@/types/tickets';

export const ticketsApi = {
  getAll: async (status?: TicketStatus): Promise<Ticket[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Ticket[]>('/tickets', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: CreateTicketDto): Promise<Ticket> => {
    const response = await api.post<Ticket>('/tickets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTicketDto): Promise<Ticket> => {
    const response = await api.patch<Ticket>(`/tickets/${id}`, data);
    return response.data;
  },

  move: async (id: string, data: MoveTicketDto): Promise<Ticket> => {
    const response = await api.patch<Ticket>(`/tickets/${id}/move`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },
};
