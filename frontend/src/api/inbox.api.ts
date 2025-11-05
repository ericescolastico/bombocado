import api from '@/lib/api';
import {
  Conversation,
  Message,
  PaginatedConversations,
  PaginatedMessages,
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsParams,
  GetMessagesParams,
} from '@/types/inbox';

export const inboxApi = {
  // Conversas
  async getConversations(
    params?: GetConversationsParams,
  ): Promise<PaginatedConversations> {
    const response = await api.get<PaginatedConversations>(
      '/inbox/conversations',
      { params },
    );
    return response.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get<Conversation>(`/inbox/conversations/${id}`);
    return response.data;
  },

  async createConversation(
    data: CreateConversationDto,
  ): Promise<Conversation> {
    const response = await api.post<Conversation>(
      '/inbox/conversations',
      data,
    );
    return response.data;
  },

  // Mensagens
  async getMessages(
    conversationId: string,
    params?: GetMessagesParams,
  ): Promise<PaginatedMessages> {
    const response = await api.get<PaginatedMessages>(
      `/inbox/conversations/${conversationId}/messages`,
      { params },
    );
    return response.data;
  },

  async sendMessage(
    conversationId: string,
    data: CreateMessageDto,
  ): Promise<Message> {
    const response = await api.post<Message>(
      `/inbox/conversations/${conversationId}/messages`,
      data,
    );
    return response.data;
  },
};
