import { create } from 'zustand';
import { Conversation, ConversationStatus } from '@/types/inbox';
import { inboxApi } from '@/api/inbox.api';

interface ConversationsState {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  loadConversations: () => Promise<void>;
  moveConversation: (id: string, toStatus: ConversationStatus) => Promise<void>;
  
  // Helpers
  getConversationsByStatus: (status: ConversationStatus) => Conversation[];
  setConversations: (conversations: Conversation[]) => void;
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  isLoading: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await inboxApi.getAllForKanban();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar conversas', 
        isLoading: false 
      });
    }
  },

  moveConversation: async (id: string, toStatus: ConversationStatus) => {
    const conversation = get().conversations.find(c => c.id === id);
    if (!conversation) return;

    // Otimista: atualizar a conversa movida
    const oldConversations = [...get().conversations];
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === id ? { ...c, status: toStatus } : c
      )
    }));

    try {
      await inboxApi.moveConversation(id, toStatus);
      // Recarregar para garantir sincronização
      await get().loadConversations();
    } catch (error: any) {
      // Rollback
      set({ conversations: oldConversations });
      set({ error: error.response?.data?.message || 'Erro ao mover conversa' });
      throw error;
    }
  },

  getConversationsByStatus: (status: ConversationStatus) => {
    return get().conversations
      .filter(c => c.status === status)
      .sort((a, b) => {
        // Ordenar por lastMessageAt desc, depois updatedAt desc
        if (a.lastMessageAt && b.lastMessageAt) {
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  },

  setConversations: (conversations: Conversation[]) => {
    set({ conversations });
  },
}));


