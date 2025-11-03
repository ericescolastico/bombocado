'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  event: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function LogAtividades() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      loadAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const loadAuditLogs = async () => {
    if (!user?.userId) return;
    
    setLogsLoading(true);
    try {
      const response = await api.get<AuditLogsResponse>(`/audit/${user.userId}`);
      setAuditLogs(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatEventDescription = (event: string): string => {
    const eventMap: Record<string, string> = {
      'user.login': 'entrou',
      'user.logout': 'saiu',
      'user.register': 'se registrou',
      'user.profile.update': 'atualizou o perfil',
    };
    return eventMap[event] || event;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
      {logsLoading ? (
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon="spinner" className="animate-spin h-8 w-8 text-emerald-500" />
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Nenhuma atividade registrada ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="py-2 px-3 rounded-md bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
            >
              {formatDateTime(log.createdAt)} | {user?.username} {formatEventDescription(log.event)}
            </div>
          ))}
        </div>
      )}

      {/* Botão de reportar atividade suspeita */}
      {auditLogs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
            <FontAwesomeIcon icon="exclamation-triangle" className="w-4 h-4" />
            <span>Reportar Atividade Suspeita</span>
          </button>
        </div>
      )}
    </div>
  );
}
