'use client';

import React, { useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Conversation, ConversationStatus } from '@/types/inbox';
import { useConversationsStore } from '@/stores/conversations.store';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS: Array<{ status: ConversationStatus; title: string }> = [
  { status: ConversationStatus.AGUARDANDO, title: 'Aguardando' },
  { status: ConversationStatus.EM_ATENDIMENTO, title: 'Em Atendimento' },
  { status: ConversationStatus.ATENDIDO, title: 'Atendido' },
];

interface KanbanBoardProps {
  conversations?: Conversation[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ conversations: propConversations }) => {
  const { 
    conversations: storeConversations, 
    isLoading, 
    loadConversations, 
    moveConversation, 
    getConversationsByStatus
  } = useConversationsStore();
  const conversations = propConversations ?? storeConversations;

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    // Permitir apenas arrasto horizontal (entre colunas diferentes)
    // Bloquear arrasto vertical (na mesma coluna)
    if (destination.droppableId === source.droppableId) {
      return;
    }

    const toStatus = destination.droppableId as ConversationStatus;

    try {
      await moveConversation(draggableId, toStatus);
    } catch (error) {
      console.error('Erro ao mover conversa:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {COLUMNS.map(({ status, title }) => (
          <KanbanColumn
            key={status}
            status={status}
            title={title}
            conversations={getConversationsByStatus(status)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
