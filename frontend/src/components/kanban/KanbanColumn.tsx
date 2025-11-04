'use client';

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Ticket, TicketStatus } from '@/types/tickets';
import { TicketCard } from './TicketCard';
import { FontAwesomeIcon } from '@/lib/fontawesome';

interface KanbanColumnProps {
  status: TicketStatus;
  title: string;
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
}

const statusColors: Record<TicketStatus, string> = {
  AGUARDANDO: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  EM_ATENDIMENTO: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  ATENDIDO: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
};

const statusHeaderColors: Record<TicketStatus, string> = {
  AGUARDANDO: 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100',
  EM_ATENDIMENTO: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100',
  ATENDIDO: 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tickets,
  onEdit,
  onDelete,
  onCreate,
}) => {
  return (
    <div className={`flex flex-col h-full rounded-lg border ${statusColors[status]}`}>
      {/* Header */}
      <div className={`px-4 py-3 rounded-t-lg ${statusHeaderColors[status]}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">{title}</h2>
          <span className="text-xs font-medium bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-4 overflow-y-auto min-h-[200px]
              transition-colors duration-200
              ${snapshot.isDraggingOver ? 'bg-white/50 dark:bg-black/20' : ''}
            `}
          >
            {/* Botão criar ticket (apenas na coluna AGUARDANDO) */}
            {onCreate && status === 'AGUARDANDO' && (
              <button
                onClick={onCreate}
                className="w-full mb-3 p-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg 
                         text-neutral-600 dark:text-neutral-400 hover:border-emerald-500 hover:text-emerald-600 
                         dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors
                         flex items-center justify-center gap-2 text-sm font-medium"
              >
                <FontAwesomeIcon icon="plus" className="w-4 h-4" />
                <span>Criar ticket</span>
              </button>
            )}

            {/* Tickets */}
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
                Nenhum ticket
              </div>
            ) : (
              tickets.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
