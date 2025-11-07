'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Conversation } from '@/types/inbox';

interface ConversationCardProps {
  conversation: Conversation;
  index: number;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  index,
}) => {
  const displayTitle = conversation.title || conversation.contactName || 'Sem título';
  const formattedDate = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date(conversation.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  return (
    <Draggable draggableId={conversation.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700
            p-4 mb-3 cursor-grab active:cursor-grabbing
            transition-all duration-200
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-500 rotate-2' : 'hover:shadow-md'}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-1 line-clamp-2">
                {displayTitle}
              </h3>
              {conversation.messagesCount !== undefined && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  {conversation.messagesCount} {conversation.messagesCount === 1 ? 'mensagem' : 'mensagens'}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};


