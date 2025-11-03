/**
 * Hook React para consumo de presença
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStore } from './presenceStore';
import { PresenceClient } from './presenceClient';
import api from '@/lib/api';

interface UsePresenceResult {
  get: (userId: string) => { online: boolean; lastSeen: string } | undefined;
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string;
  isConnected: boolean;
  isLeader: boolean;
}

/**
 * Hook para consumir presença de usuários
 * @param userIds - IDs de usuários para garantir que estejam no store (opcional)
 */
export function usePresence(userIds?: string[]): UsePresenceResult {
  const { user, isAuthenticated } = useAuth();
  const store = usePresenceStore();
  const [client, setClient] = useState<PresenceClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  // Inicializar cliente de presença quando autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      return;
    }

    const presenceClient = new PresenceClient(
      () => setIsConnected(true),
      () => setIsConnected(false),
      (error) => console.error('[Presence] Error:', error),
    );

    presenceClient.connect(token);
    setClient(presenceClient);

    // Verificar liderança periodicamente
    const leaderCheckInterval = setInterval(() => {
      setIsLeader(presenceClient.getLeaderStatus());
    }, 1000);

    return () => {
      clearInterval(leaderCheckInterval);
      presenceClient.disconnect();
    };
  }, [isAuthenticated, user]);

  // Buscar presença de userIds específicos via REST (se necessário)
  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      return;
    }

    const fetchPresence = async () => {
      try {
        const idsParam = userIds.join(',');
        const response = await api.get(`/presence?ids=${idsParam}`);
        if (response.data.entries) {
          store.applySnapshot(response.data.entries);
        }
      } catch (error) {
        console.error('Error fetching presence:', error);
      }
    };

    fetchPresence();
  }, [userIds, store]);

  return {
    get: (userId: string) => {
      const entry = store.get(userId);
      return entry
        ? { online: entry.online, lastSeen: entry.lastSeen }
        : undefined;
    },
    isOnline: (userId: string) => store.isOnline(userId),
    getLastSeen: (userId: string) => store.getLastSeen(userId),
    isConnected,
    isLeader,
  };
}

