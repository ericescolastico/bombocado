'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageDirection } from '@/types/inbox';
import { inboxApi } from '@/api/inbox.api';
import { Spinner } from '@heroui/react';
import { useAuth } from '@/hooks/useAuth';

interface ThreadProps {
  conversationId: string | null;
  refreshKey?: number;
}

// Componente de Avatar padrão
const AvatarPlaceholder: React.FC<{ name?: string; isOut?: boolean }> = ({ name, isOut }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
        isOut
          ? 'bg-orange-600 text-white'
          : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
      }`}
    >
      {initials}
    </div>
  );
};

export const Thread: React.FC<ThreadProps> = ({ conversationId, refreshKey }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [conversation, setConversation] = useState<{ contactName: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const loadMessages = async (pageNum = 1, reset = false) => {
    if (!conversationId) return;

    const currentConversationId = conversationId;

    try {
      setLoading(true);
      setError(null);

      const result = await inboxApi.getMessages(currentConversationId, {
        page: pageNum,
        pageSize: 50,
      });

      const allMessages = result.data || [];

      if (currentConversationId === conversationId) {
        if (reset) {
          setMessages(allMessages);
        } else {
          setMessages((prev) => {
            const messageMap = new Map();
            prev.forEach((msg) => messageMap.set(msg.id, msg));
            allMessages.forEach((msg) => messageMap.set(msg.id, msg));
            const uniqueMessages = Array.from(messageMap.values()).sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return uniqueMessages;
          });
        }

        setHasMore(result.page < result.totalPages);
        setPage(pageNum);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mensagens');
      console.error(`[Thread] Erro ao carregar mensagens:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      loadMessages(1, true);
      // Carregar dados da conversa para obter contactName
      inboxApi.getConversation(conversationId)
        .then((conv) => {
          setConversation({ contactName: conv.contactName });
        })
        .catch((err) => {
          console.error('[Thread] Erro ao carregar conversa:', err);
        });
    } else {
      setMessages([]);
      setConversation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, refreshKey]);

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && conversationId) {
      loadMessages(page + 1, false);
    }
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          Selecione uma conversa para ver as mensagens
        </p>
      </div>
    );
  }

  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'Você';

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header da thread */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mensagens
        </h2>
      </div>

      {/* Lista de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
        ) : messages.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm text-center">
            Nenhuma mensagem ainda
          </div>
        ) : (
          <div className="flex flex-col">
            {hasMore && (
              <div className="text-center mb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 disabled:opacity-50 px-4 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  {loading ? 'Carregando...' : 'Carregar mensagens anteriores'}
                </button>
              </div>
            )}

            {Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                {/* Separador de data */}
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                  <span className="px-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-full py-1">
                    {formatMessageDate(dateMessages[0].createdAt)}
                  </span>
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* Mensagens do dia */}
                {dateMessages.map((message, index) => {
                  const isOut = message.direction === MessageDirection.OUT;
                  const isLastInGroup = index === dateMessages.length - 1;
                  const isFirstInGroup = index === 0;
                  const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                  const sameSender = prevMessage && prevMessage.direction === message.direction;
                  const showAvatar = isLastInGroup || !sameSender;

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2.5 mb-1 ${
                        isOut ? 'flex-row-reverse' : ''
                      } group ${isLastInGroup ? 'mb-4' : ''}`}
                    >
                      {/* Avatar - apenas na última mensagem do remetente */}
                      {!isOut && showAvatar && (
                        <div className="flex-shrink-0">
                          <AvatarPlaceholder name="Contato" isOut={false} />
                        </div>
                      )}
                      {!isOut && !showAvatar && (
                        <div className="flex-shrink-0 w-8"></div>
                      )}

                      {/* Chat Bubble - Estilo Flowbite */}
                      <div
                        className={`flex flex-col w-full max-w-[320px] leading-1.5 p-4 border shadow-sm ${
                          isOut
                            ? 'bg-orange-500 dark:bg-orange-600 rounded-e-xl rounded-es-xl text-white border-orange-600 dark:border-orange-700'
                            : 'bg-gray-100 dark:bg-gray-700 rounded-e-xl rounded-es-xl border-gray-200 dark:border-gray-600'
                        } ${!showAvatar && sameSender ? 'mt-0' : ''}`}
                      >
                        {/* Nome e hora - apenas se não for continuação */}
                        {(!sameSender || isFirstInGroup) && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`text-sm font-semibold ${
                                isOut
                                  ? 'text-white dark:text-white'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {isOut ? userName : (conversation?.contactName || 'Contato')}
                            </span>
                            <span
                              className={`text-sm font-normal ${
                                isOut
                                  ? 'text-orange-100 dark:text-orange-100'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        )}

                        {/* Corpo da mensagem */}
                        <p
                          className={`text-sm font-normal whitespace-pre-wrap break-words ${
                            isOut
                              ? 'text-white dark:text-white'
                              : 'text-gray-900 dark:text-white'
                          } ${(!sameSender || isFirstInGroup) ? 'py-2.5' : 'py-1'}`}
                        >
                          {message.body}
                        </p>

                        {/* Status de entrega (apenas para mensagens enviadas) */}
                        {isOut && (
                          <span className="text-sm font-normal text-orange-100 dark:text-orange-100 mt-1">
                            {message.readAt ? '✓✓ Lida' : '✓ Entregue'}
                          </span>
                        )}
                      </div>

                      {/* Avatar para mensagens enviadas - apenas na última mensagem */}
                      {isOut && showAvatar && (
                        <div className="flex-shrink-0">
                          <AvatarPlaceholder name={userName} isOut={true} />
                        </div>
                      )}
                      {isOut && !showAvatar && (
                        <div className="flex-shrink-0 w-8"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
