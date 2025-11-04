export type TicketStatus = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'ATENDIDO';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  description?: string;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
}

export interface MoveTicketDto {
  toStatus: TicketStatus;
  toIndex: number;
}
