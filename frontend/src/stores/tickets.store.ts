import { create } from 'zustand';
import { Ticket, TicketStatus, CreateTicketDto, UpdateTicketDto, MoveTicketDto } from '@/types/tickets';
import { ticketsApi } from '@/api/tickets.api';

interface TicketsState {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  loadTickets: () => Promise<void>;
  createTicket: (data: CreateTicketDto) => Promise<Ticket>;
  updateTicket: (id: string, data: UpdateTicketDto) => Promise<Ticket>;
  moveTicket: (id: string, data: MoveTicketDto) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  
  // Helpers
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  setTickets: (tickets: Ticket[]) => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,

  loadTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await ticketsApi.getAll();
      set({ tickets, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar tickets', 
        isLoading: false 
      });
    }
  },

  createTicket: async (data: CreateTicketDto) => {
    try {
      const newTicket = await ticketsApi.create(data);
      set(state => ({
        tickets: [...state.tickets, newTicket]
      }));
      return newTicket;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Erro ao criar ticket' });
      throw error;
    }
  },

  updateTicket: async (id: string, data: UpdateTicketDto) => {
    // Otimista
    const oldTicket = get().tickets.find(t => t.id === id);
    if (oldTicket) {
      set(state => ({
        tickets: state.tickets.map(t => 
          t.id === id ? { ...t, ...data } : t
        )
      }));
    }

    try {
      const updatedTicket = await ticketsApi.update(id, data);
      set(state => ({
        tickets: state.tickets.map(t => t.id === id ? updatedTicket : t)
      }));
      return updatedTicket;
    } catch (error: any) {
      // Rollback
      if (oldTicket) {
        set(state => ({
          tickets: state.tickets.map(t => t.id === id ? oldTicket : t)
        }));
      }
      set({ error: error.response?.data?.message || 'Erro ao atualizar ticket' });
      throw error;
    }
  },

  moveTicket: async (id: string, data: MoveTicketDto) => {
    const ticket = get().tickets.find(t => t.id === id);
    if (!ticket) return;

    // Otimista: atualizar o ticket movido
    const oldTickets = [...get().tickets];
    set(state => ({
      tickets: state.tickets.map(t =>
        t.id === id ? { ...t, status: data.toStatus, position: data.toIndex } : t
      )
    }));

    try {
      await ticketsApi.move(id, data);
      // Recarregar para garantir sincronização com posições corretas
      await get().loadTickets();
    } catch (error: any) {
      // Rollback
      set({ tickets: oldTickets });
      set({ error: error.response?.data?.message || 'Erro ao mover ticket' });
      throw error;
    }
  },

  deleteTicket: async (id: string) => {
    const ticket = get().tickets.find(t => t.id === id);
    if (!ticket) return;

    // Otimista: remover do estado local
    const oldTickets = [...get().tickets];
    set(state => ({
      tickets: state.tickets
        .filter(t => t.id !== id)
        .map(t =>
          t.status === ticket.status && t.position > ticket.position
            ? { ...t, position: t.position - 1 }
            : t
        )
    }));

    try {
      await ticketsApi.delete(id);
    } catch (error: any) {
      // Rollback
      set({ tickets: oldTickets });
      set({ error: error.response?.data?.message || 'Erro ao deletar ticket' });
      throw error;
    }
  },

  getTicketsByStatus: (status: TicketStatus) => {
    return get().tickets
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position);
  },

  setTickets: (tickets: Ticket[]) => {
    set({ tickets });
  },
}));
