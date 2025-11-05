'use client';

import React, { useState } from 'react';
import { inboxApi } from '@/api/inbox.api';
import { Textarea, Button } from '@heroui/react';

interface ComposerProps {
  conversationId: string | null;
  onMessageSent: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  conversationId,
  onMessageSent,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!conversationId || !message.trim() || sending) return;

    try {
      setSending(true);
      setError(null);

      await inboxApi.sendMessage(conversationId, {
        body: message.trim(),
      });

      setMessage('');
      onMessageSent();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enviar com Ctrl+Enter ou Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return null;
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-sm">
      {error && (
        <div className="mb-2 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}
      <div className="flex gap-2">
        <Textarea
          placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          maxRows={4}
          variant="flat"
          disabled={sending}
          classNames={{
            input: 'resize-none',
            inputWrapper: '!border-0 !border-none !shadow-none focus-within:!border-0 focus-within:!shadow-none',
          }}
        />
        <Button
          color="primary"
          onPress={handleSend}
          isLoading={sending}
          isDisabled={!message.trim() || sending}
          className="self-end"
        >
          Enviar
        </Button>
      </div>
    </div>
  );
};
