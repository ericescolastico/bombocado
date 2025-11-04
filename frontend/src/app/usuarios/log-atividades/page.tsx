'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { DateRangePicker } from '@heroui/react';
import { parseDateTime } from '@internationalized/date';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';

interface UserOption {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface AuditLog {
  id: string;
  event: string;
  user?: {
    username: string;
  };
  userId?: string;
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

type ActivityType = 'all' | 'entradas' | 'saidas';

function PageContent() {
  usePageTitle('Log de Atividades');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [activityType, setActivityType] = useState<ActivityType>('all');
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) map.set(u.userId, u.username);
    return map;
  }, [users]);

  useEffect(() => {
    // Aguardar até que a autenticação seja confirmada e o usuário seja ADMIN
    // IMPORTANTE: Só fazer requisições depois que o authLoading for false
    if (authLoading) {
      return; // Ainda carregando autenticação - NÃO fazer requisições ainda
    }

    // Se não está autenticado, não fazer nada (ProtectedAdminRoute vai redirecionar)
    if (!isAuthenticated) {
      return; // Não autenticado
    }

    // Se não tem usuário, não fazer requisições
    if (!user) {
      return; // Usuário não carregado
    }

    // Verificar se o usuário é ADMIN (comparação case-insensitive)
    const userRole = user.role?.toUpperCase() || '';
    if (userRole !== 'ADMIN') {
      console.warn('Usuário não é ADMIN. Role atual:', userRole);
      return; // Não é ADMIN, não fazer requisição
    }

    // Verificar se há token válido antes de fazer requisição
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('Token não encontrado no localStorage');
      return; // Sem token, não fazer requisição
    }

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data } = await api.get<UserOption[]>('/users');
        setUsers(data);
      } catch (e: any) {
        console.error('Erro ao carregar usuários', e);
        
        // Tratamento específico de erros
        if (e.response?.status === 401) {
          // Token inválido - o interceptor vai tratar o logout
          console.warn('Token inválido ao carregar usuários');
        } else if (e.response?.status === 403) {
          // Sem permissão - não fazer logout, apenas mostrar erro
          console.warn('Sem permissão para carregar usuários (403)');
        } else if (e.response?.status === 404) {
          // Endpoint não encontrado
          console.error('Endpoint /users não encontrado');
        } else {
          // Outros erros (rede, etc)
          console.error('Erro desconhecido ao carregar usuários:', e.message);
        }
        
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, [authLoading, isAuthenticated, user]);

  const formatEventDescription = (event: string): string => {
    const eventMap: Record<string, string> = {
      'user.login': 'entrou',
      'user.logout': 'saiu',
      'user.register': 'se registrou',
      'user.profile.update': 'atualizou o perfil',
    };
    return eventMap[event] || event;
  };

  const formatDateTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resetFilters = () => {
    setSelectedUserId('all');
    setActivityType('all');
    setRange({ start: null, end: null });
  };

  const fetchLogsForUser = async (userId: string): Promise<AuditLog[]> => {
    try {
      const { data } = await api.get<AuditLogsResponse>(`/audit/${userId}`, {
        params: { page: 1, limit: 50 },
      });
      // Backend não inclui userId/user no select; anexar userId aqui
      return data.data.map(l => ({ ...l, userId }));
    } catch (error: any) {
      // Se for erro 401, pode ser que o token expirou durante a requisição
      // Não fazer throw para não interromper outras requisições em paralelo
      if (error.response?.status === 401) {
        console.warn(`Token inválido ao carregar logs do usuário ${userId}`);
        // Retornar array vazio - o interceptor do axios vai tratar o logout
        return [];
      }
      // Para outros erros (403, 404, etc), apenas logar e retornar vazio
      if (error.response?.status !== 401) {
        console.error(`Erro ao carregar logs do usuário ${userId}:`, error.response?.status || error.message);
      }
      // Retornar array vazio em caso de erro
      return [];
    }
  };

  const fetchAllLogs = async () => {
    setLoadingLogs(true);
    try {
      // Verificar se ainda há token antes de fazer requisições
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('Token não encontrado ao carregar logs');
        setLogs([]);
        return;
      }

      let fetched: AuditLog[] = [];
      if (selectedUserId === 'all') {
        // Buscar logs de todos os usuários em paralelo (limitando por quantidade retornada em cada chamada)
        const ids = users.map(u => u.userId);
        if (ids.length === 0) {
          setLogs([]);
          return;
        }
        const chunks: string[][] = [];
        const chunkSize = 5;
        for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));
        for (const chunk of chunks) {
          // Verificar token antes de cada chunk
          const currentToken = localStorage.getItem('access_token');
          if (!currentToken) {
            console.warn('Token removido durante carregamento de logs');
            break;
          }
          // eslint-disable-next-line no-await-in-loop
          const results = await Promise.allSettled(chunk.map(id => fetchLogsForUser(id)));
          for (const r of results) {
            if (r.status === 'fulfilled') fetched = fetched.concat(r.value);
            // Se foi rejeitado por 401, o interceptor já tratou o logout
            // Não fazer throw para não interromper outras requisições
          }
        }
      } else {
        fetched = await fetchLogsForUser(selectedUserId);
      }
      setLogs(fetched);
    } catch (e: any) {
      console.error('Erro ao carregar logs', e);
      // Se for erro 401 ou 403, pode ser que o token expirou ou não tem permissão
      if (e.response?.status === 401 || e.response?.status === 403) {
        console.warn('Erro de autenticação ao carregar logs');
      }
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    // Aguardar até que a autenticação seja confirmada e o usuário seja ADMIN
    // IMPORTANTE: Só fazer requisições depois que o authLoading for false
    if (authLoading) {
      return; // Ainda carregando autenticação - NÃO fazer requisições ainda
    }

    // Se não está autenticado, não fazer nada
    if (!isAuthenticated) {
      return; // Não autenticado
    }

    // Se não tem usuário, não fazer requisições
    if (!user) {
      return; // Usuário não carregado
    }

    // Verificar se o usuário é ADMIN (comparação case-insensitive)
    const userRole = user.role?.toUpperCase() || '';
    if (userRole !== 'ADMIN') {
      return; // Não é ADMIN, não fazer requisição
    }

    // Verificar se há token válido antes de fazer requisição
    const token = localStorage.getItem('access_token');
    if (!token) {
      return; // Sem token, não fazer requisição
    }

    if (loadingUsers) {
      return; // Ainda carregando usuários
    }

    // Só fazer requisição se houver usuários carregados (ou se não precisar de usuários)
    fetchAllLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, users.length, authLoading, isAuthenticated, user, loadingUsers]);

  const filteredLogs = useMemo(() => {
    const byType = (log: AuditLog) => {
      if (activityType === 'all') return true;
      if (activityType === 'entradas') return log.event === 'user.login';
      if (activityType === 'saidas') return log.event === 'user.logout';
      return true;
    };
    const byRange = (log: AuditLog) => {
      if (!range.start && !range.end) return true;
      const time = new Date(log.createdAt).getTime();
      const start = range.start ? new Date(range.start).setHours(0, 0, 0, 0) : Number.NEGATIVE_INFINITY;
      const end = range.end ? new Date(range.end).setHours(23, 59, 59, 999) : Number.POSITIVE_INFINITY;
      return time >= start && time <= end;
    };
    return logs
      .filter(byType)
      .filter(byRange)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activityType, range.end, range.start, logs]);

  return (
    <div className="px-8 pb-16">
      <section className="mt-6 space-y-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Usuário */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Usuário</label>
              <select
                className="h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm text-neutral-900 dark:text-neutral-100"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="all">Todos</option>
                 {users.map(u => (
                   <option key={u.userId} value={u.userId}>
                     {u.username}
                   </option>
                 ))}
              </select>
            </div>

            {/* Tipo de atividade */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo de atividade</label>
              <select
                className="h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm text-neutral-900 dark:text-neutral-100"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
              >
                <option value="all">Todas</option>
                <option value="entradas">Entradas</option>
                <option value="saidas">Saídas</option>
              </select>
            </div>

            {/* Período */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Período</label>
              <div className="[&_*]:!text-sm">
                <DateRangePicker
                  label=""
                  aria-label="Período"
                  visibleMonths={1}
                  onChange={(val: any) => {
                    if (!val?.start || !val?.end) {
                      setRange({ start: null, end: null });
                      return;
                    }
                    // HeroUI usa CalendarDate/CalendarDateTime; converter para Date
                    try {
                      const start = 'calendar' in val.start || typeof val.start === 'string' ? new Date(val.start.toString()) : new Date();
                      const end = 'calendar' in val.end || typeof val.end === 'string' ? new Date(val.end.toString()) : new Date();
                      setRange({ start, end });
                    } catch {
                      // Fallback usando parseDateTime se necessário
                      const s = parseDateTime(String(val.start));
                      const e = parseDateTime(String(val.end));
                      setRange({ start: new Date(s.toDate('UTC').getTime()), end: new Date(e.toDate('UTC').getTime()) });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <FontAwesomeIcon icon="rotate-left" className="w-4 h-4" />
              <span>Redefinir</span>
            </button>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            >
              <FontAwesomeIcon icon="exclamation-triangle" className="w-4 h-4" />
              <span>Reportar atividade suspeita</span>
            </button>

            {loadingUsers && (
              <span className="text-sm text-neutral-500">Carregando usuários...</span>
            )}
          </div>
        </div>

        {/* ATIVIDADES */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">ATIVIDADES</h3>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon="spinner" className="animate-spin h-8 w-8 text-emerald-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400">Nenhuma atividade encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const displayName = log.userId ? (usersMap.get(log.userId) || '') : '';
                return (
                <div key={log.id} className="py-2 px-3 rounded-md bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                  {formatDateTime(log.createdAt)} |
                  {' '}
                  {displayName}
                  {' '}
                  {formatEventDescription(log.event)}
                </div>
              );})}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function UsuariosLogAtividadesPage() {
  return (
    <ProtectedAdminRoute>
      <AppShell>
        <PageContent />
      </AppShell>
    </ProtectedAdminRoute>
  );
}


