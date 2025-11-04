'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, CreateTicketDto } from '@/types/tickets';
import { useTicketsStore } from '@/stores/tickets.store';
import { FontAwesomeIcon } from '@/lib/fontawesome';

interface TicketFormModalProps {
  ticket?: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const { createTicket, updateTicket } = useTicketsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError('');
  }, [ticket, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: CreateTicketDto = {
        title: title.trim(),
        description: description.trim() || undefined,
      };

      if (ticket) {
        await updateTicket(ticket.id, data);
      } else {
        await createTicket(data);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {ticket ? 'Editar Ticket' : 'Criar Ticket'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon="times" className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Título *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                       bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Digite o título do ticket"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                       bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       resize-none"
              placeholder="Digite a descrição do ticket (opcional)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                       text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700
                       transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg
                       text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                ticket ? 'Salvar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
