'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { AppShell } from '@/components/AppShell';
import { CreateUserModal } from '@/components/CreateUserModal';
import { api } from '@/lib/api';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { usePageTitle } from '@/hooks/usePageTitle';

interface UserWithPresence {
  userId: string;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: {
    roleId: string;
    roleName: string;
  };
  statusUser: string;
  statusAccount: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  failsLogin: number;
  online: boolean;
  lastSeen: string | null;
  currentSessionSeconds?: number; // Tempo da sessão atual em segundos
}

function PageContent() {
  usePageTitle('Painel de Controle');
  const [users, setUsers] = useState<UserWithPresence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadUsers = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const { data } = await api.get<UserWithPresence[]>('/users/with-presence');
      console.log('[Frontend] Users received from API:', data);
      data.forEach(user => {
        console.log(`[Frontend] User ${user.username}: online=${user.online}, lastSeen=${user.lastSeen}, currentSessionSeconds=${user.currentSessionSeconds}`);
      });
      setUsers(data);
    } catch (e) {
      console.error('Erro ao carregar usuários', e);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();

    // Atualizar usuários a cada 10 minutos
    const interval = setInterval(() => {
      loadUsers();
    }, 10 * 60 * 1000); // 10 minutos = 600000ms

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    loadUsers(true);
  };

  const formatSessionTime = (seconds?: number): string => {
    // Se não temos segundos ou é zero, retornar "Agora"
    if (seconds === undefined || seconds === null || seconds === 0) {
      return 'Agora';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0 && minutes === 0) {
      return 'Agora';
    }
    
    if (hours === 0) {
      return `Online a ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    
    return `Online a ${hours} hora${hours !== 1 ? 's' : ''}`;
  };

  const formatLastActivity = (lastSeen: string | null): string => {
    if (!lastSeen) return 'Nunca visto';
    
    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      const diffHours = Math.floor((diffMs % 86400000) / 3600000);
      const diffMinutes = Math.floor((diffMs % 3600000) / 60000);

      if (diffDays === 0 && diffHours === 0 && diffMinutes < 1) {
        return 'Agora';
      }
      
      if (diffDays === 0 && diffHours === 0) {
        return `Ultima atividade a ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
      }
      
      if (diffDays === 0) {
        return `Ultima atividade a ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      }
      
      return `Ultima atividade a ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    } catch {
      return 'Desconhecido';
    }
  };


  const getFullName = (user: UserWithPresence): string => {
    return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`;
  };

  return (
    <div className="px-8 pb-16">
      <section className="mt-6">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-start gap-2">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Usuários</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon="spinner" className="animate-spin h-8 w-8 text-emerald-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon="users" className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400">
                Nenhum usuário encontrado. Verifique se o backend está rodando.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-start gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                >
                  {/* Badge de status */}
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.online === true ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      aria-label={user.online === true ? 'Online' : 'Offline'}
                    />
                  </div>

                  {/* Informações do usuário */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {getFullName(user)}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        ({user.username})
                      </span>
                      {/* Ícone de edição */}
                      <FontAwesomeIcon 
                        icon="edit" 
                        className="w-3 h-3 text-neutral-400 dark:text-neutral-500"
                      />
                    </div>
                    <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {(() => {
                        const isOnline = user.online === true;
                        
                        if (isOnline) {
                          // Usar tempo da sessão atual do banco de dados
                          const sessionTime = formatSessionTime(user.currentSessionSeconds);
                          console.log(`[Render] ${user.username} is ONLINE, currentSessionSeconds=${user.currentSessionSeconds}, formatted="${sessionTime}"`);
                          return sessionTime;
                        } else {
                          // Para usuários offline, usar lastSeen
                          const result = formatLastActivity(user.lastSeen);
                          console.log(`[Render] ${user.username} is OFFLINE, calling formatLastActivity -> "${result}"`);
                          return result;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botão Criar Usuário */}
          <div className="mt-6 flex items-center justify-start gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              <FontAwesomeIcon icon="user-plus" className="w-4 h-4" />
              <span>Criar Usuário</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Atualizar lista de usuários"
            >
              <FontAwesomeIcon 
                icon="sync-alt" 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal de Criação de Usuário */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadUsers();
        }}
      />
    </div>
  );
}

export default function UsuariosPainelControlePage() {
  return (
    <ProtectedAdminRoute>
      <AppShell>
        <PageContent />
      </AppShell>
    </ProtectedAdminRoute>
  );
}

