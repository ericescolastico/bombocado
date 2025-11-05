'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ConversationList } from '@/features/inbox/ConversationList';
import { Thread } from '@/features/inbox/Thread';
import { Composer } from '@/features/inbox/Composer';
import { FontAwesomeIcon } from '@/lib/fontawesome';

function InboxContent() {
  usePageTitle('Caixa de Entrada');
  
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleMessageSent = () => {
    // Forçar refresh do Thread e da lista de conversas
    setRefreshKey((prev) => prev + 1);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Conteúdo principal - layout responsivo */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Coluna esquerda - Lista de conversas */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col`}>
          <ConversationList
            key={refreshKey}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Coluna direita - Thread e Composer */}
        <div className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900`}>
          {selectedConversationId ? (
            <>
              {/* Botão voltar para lista (apenas em mobile) */}
              <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 bg-white dark:bg-neutral-900">
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  aria-label="Voltar para lista de conversas"
                >
                  <FontAwesomeIcon icon="chevron-left" className="w-4 h-4" />
                  Voltar para lista
                </button>
              </div>
              <Thread
                conversationId={selectedConversationId}
                refreshKey={refreshKey}
              />
              <Composer
                conversationId={selectedConversationId}
                onMessageSent={handleMessageSent}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon="comments" className="w-8 h-8 text-neutral-400" />
                </div>
                <h2 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Nenhuma conversa selecionada
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">
                  Selecione uma conversa da lista para começar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <InboxContent />
      </AppShell>
    </ProtectedRoute>
  );
}
