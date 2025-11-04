'use client';

import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Ticket } from '@/types/tickets';
import { FontAwesomeIcon } from '@/lib/fontawesome';

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  index,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este ticket?')) {
      setIsDeleting(true);
      try {
        await onDelete(ticket.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Draggable draggableId={ticket.id} index={index}>
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
                {ticket.title}
              </h3>
              {ticket.description && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                  {ticket.description}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(ticket);
                }}
                className="p-1.5 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                aria-label="Editar ticket"
              >
                <FontAwesomeIcon icon="edit" className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                aria-label="Excluir ticket"
              >
                <FontAwesomeIcon 
                  icon={isDeleting ? 'spinner' : 'trash'} 
                  className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
