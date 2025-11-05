export enum ConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum MessageDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string | null;
  title: string | null;
  contactName: string | null;
  channel: string;
  createdAt: string;
  updatedAt: string;
  messagesCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedConversations {
  data: Conversation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedMessages {
  data: Message[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateConversationDto {
  title?: string;
  contactName?: string;
}

export interface CreateMessageDto {
  body: string;
}

export interface GetConversationsParams {
  status?: ConversationStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface GetMessagesParams {
  page?: number;
  pageSize?: number;
}
