'use client';

import React, { useState, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Conversation, ConversationStatus } from '@/types/inbox';
import { inboxApi } from '@/api/inbox.api';
import { Input, Select, SelectItem, Spinner } from '@heroui/react';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversationId,
  onSelectConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'ALL'>(
    'ALL',
  );
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadConversations = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: pageNum,
        pageSize: 20,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      const result = await inboxApi.getConversations(params);

      if (reset) {
        setConversations(result.data);
      } else {
        setConversations((prev) => [...prev, ...result.data]);
      }

      setHasMore(result.page < result.totalPages);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations(1, true);
  }, [statusFilter, searchQuery]);

  const formatLastMessage = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadConversations(page + 1, false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header com busca e filtro */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Input
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="sm"
          variant="flat"
          classNames={{
            inputWrapper: '!border-0 !border-none !shadow-none focus-within:!border-0 focus-within:!shadow-none',
          }}
        />
        <Select
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setStatusFilter(value as ConversationStatus | 'ALL');
          }}
          size="sm"
          variant="bordered"
          aria-label="Filtrar conversas por status"
          placeholder="Status"
        >
          <SelectItem key="ALL">
            Todas
          </SelectItem>
          <SelectItem key={ConversationStatus.OPEN}>
            Abertas
          </SelectItem>
          <SelectItem key={ConversationStatus.CLOSED}>
            Fechadas
          </SelectItem>
        </Select>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-hidden">
        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center p-8 h-full">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm text-center">
            Nenhuma conversa encontrada
          </div>
        ) : (
          <Virtuoso
            totalCount={conversations.length}
            itemContent={(index) => {
              const conv = conversations[index];
              return (
                <div
                  onClick={() => onSelectConversation(conv.id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedConversationId === conv.id
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {conv.title || conv.contactName || 'Sem título'}
                    </h3>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatLastMessage(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conv.contactName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {conv.contactName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        conv.status === ConversationStatus.OPEN
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {conv.status === ConversationStatus.OPEN ? 'Aberta' : 'Fechada'}
                    </span>
                    {conv.messagesCount !== undefined && conv.messagesCount > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {conv.messagesCount} mensagem{conv.messagesCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
            endReached={() => {
              if (!loading && hasMore) {
                handleLoadMore();
              }
            }}
            components={{
              Footer: () => {
                if (hasMore && loading) {
                  return (
                    <div className="p-4 text-center">
                      <Spinner size="sm" />
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        Carregando...
                      </span>
                    </div>
                  );
                }
                return null;
              },
            }}
            style={{ height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};
