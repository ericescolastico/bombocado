'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { usePageTitle } from '@/hooks/usePageTitle';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useConversationsStore } from '@/stores/conversations.store';
import { FontAwesomeIcon } from '@/lib/fontawesome';

function FluxoAtendimentoContent() {
  usePageTitle('Fluxo de atendimento');
  const { conversations } = useConversationsStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      conversation =>
        (conversation.title?.toLowerCase().includes(query) ?? false) ||
        (conversation.contactName?.toLowerCase().includes(query) ?? false)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="px-8 pb-16 h-full flex flex-col">
      {/* Header com busca */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Busca */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon
              icon="search"
              className="w-4 h-4 text-neutral-400"
            />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                     bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                     placeholder-neutral-500 dark:placeholder-neutral-400"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0">
        <KanbanBoard conversations={searchQuery.trim() ? filteredConversations : undefined} />
      </div>
    </div>
  );
}

export default function FluxoAtendimentoPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <FluxoAtendimentoContent />
      </AppShell>
    </ProtectedRoute>
  );
}
