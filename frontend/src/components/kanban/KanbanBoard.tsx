'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Ticket, TicketStatus } from '@/types/tickets';
import { useTicketsStore } from '@/stores/tickets.store';
import { KanbanColumn } from './KanbanColumn';
import { TicketFormModal } from './TicketFormModal';

const COLUMNS: Array<{ status: TicketStatus; title: string }> = [
  { status: 'AGUARDANDO', title: 'Aguardando' },
  { status: 'EM_ATENDIMENTO', title: 'Em Atendimento' },
  { status: 'ATENDIDO', title: 'Atendido' },
];

interface KanbanBoardProps {
  tickets?: Ticket[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tickets: propTickets }) => {
  const { tickets: storeTickets, isLoading, loadTickets, moveTicket, deleteTicket, getTicketsByStatus, error } = useTicketsStore();
  const tickets = propTickets ?? storeTickets;
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    // Permitir apenas arrasto horizontal (entre colunas diferentes)
    // Bloquear arrasto vertical (na mesma coluna)
    if (destination.droppableId === source.droppableId) {
      return;
    }

    const toStatus = destination.droppableId as TicketStatus;
    const toIndex = destination.index;

    try {
      await moveTicket(draggableId, { toStatus, toIndex });
    } catch (error) {
      console.error('Erro ao mover ticket:', error);
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTicket(id);
    } catch (error) {
      console.error('Erro ao deletar ticket:', error);
    }
  };

  const handleCloseModal = () => {
    setEditingTicket(null);
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Carregando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {COLUMNS.map(({ status, title }) => (
            <KanbanColumn
              key={status}
              status={status}
              title={title}
              tickets={tickets.filter(t => t.status === status).sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={status === 'AGUARDANDO' ? () => setIsCreateModalOpen(true) : undefined}
            />
          ))}
        </div>
      </DragDropContext>

      {(editingTicket || isCreateModalOpen) && (
        <TicketFormModal
          ticket={editingTicket}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};
