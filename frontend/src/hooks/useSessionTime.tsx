'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import api from '@/lib/api';

export interface SessionTimeStats {
  currentSessionSeconds: number;
  dailySeconds: number;
  totalSeconds: number;
}

export interface DailyStat {
  date: Date;
  seconds: number;
}

export interface UseSessionTimeReturn {
  // Tempo da sessão atual (em segundos)
  currentSessionSeconds: number;
  // Tempo total do dia atual (em segundos)
  dailySeconds: number;
  // Tempo total de todos os dias (em segundos)
  totalSeconds: number;
  // Estatísticas diárias (últimos N dias)
  dailyStats: DailyStat[];
  // Funções utilitárias
  formatTime: (seconds: number) => string;
  // Recarregar dados
  refresh: () => Promise<void>;
  // Carregar estatísticas diárias
  loadDailyStats: (days?: number) => Promise<void>;
  // Estado de carregamento
  isLoading: boolean;
}

/**
 * Hook para rastrear tempo online do usuário
 * 
 * Rastreia:
 * - Tempo da sessão atual
 * - Tempo total do dia
 * - Tempo total de todos os dias
 * - Estatísticas por dia
 */
export function useSessionTime(): UseSessionTimeReturn {
  const { isAuthenticated } = useAuth();
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
  const [dailySeconds, setDailySeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Formatar tempo em formato legível (HH:MM:SS ou MM:SS)
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Carregar tempo da sessão atual
  const loadCurrentSession = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/session-time/current');
      setCurrentSessionSeconds(response.data.seconds || 0);
    } catch (error) {
      console.error('Erro ao carregar tempo da sessão atual:', error);
    }
  }, [isAuthenticated]);

  // Carregar tempo do dia
  const loadDailyTime = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/session-time/daily');
      setDailySeconds(response.data.seconds || 0);
    } catch (error) {
      console.error('Erro ao carregar tempo diário:', error);
    }
  }, [isAuthenticated]);

  // Carregar tempo total
  const loadTotalTime = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/session-time/total');
      setTotalSeconds(response.data.seconds || 0);
    } catch (error) {
      console.error('Erro ao carregar tempo total:', error);
    }
  }, [isAuthenticated]);

  // Carregar estatísticas diárias
  const loadDailyStats = useCallback(async (days: number = 30) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/session-time/stats?days=${days}`);
      const stats = (response.data.stats || []).map((stat: any) => ({
        date: new Date(stat.date),
        seconds: stat.seconds,
      }));
      setDailyStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas diárias:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Atualizar sessão no backend (a cada 30 segundos)
  const updateSession = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await api.post('/session-time/update');
      // Recarregar dados após atualizar
      await Promise.all([
        loadCurrentSession(),
        loadDailyTime(),
        loadTotalTime(),
      ]);
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
    }
  }, [isAuthenticated, loadCurrentSession, loadDailyTime, loadTotalTime]);

  // Recarregar todos os dados
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    await Promise.all([
      loadCurrentSession(),
      loadDailyTime(),
      loadTotalTime(),
    ]);
  }, [isAuthenticated, loadCurrentSession, loadDailyTime, loadTotalTime]);

  // Inicializar quando o usuário estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      // Limpar estados quando não autenticado
      setCurrentSessionSeconds(0);
      setDailySeconds(0);
      setTotalSeconds(0);
      setDailyStats([]);
      return;
    }

    // Carregar dados iniciais
    refresh();

    // Atualizar tempo da sessão local a cada segundo (para UI responsiva)
    intervalRef.current = setInterval(() => {
      setCurrentSessionSeconds(prev => prev + 1);
      // Atualizar também o tempo diário e total localmente (aproximação)
      setDailySeconds(prev => prev + 1);
      setTotalSeconds(prev => prev + 1);
    }, 1000);

    // Atualizar sessão no backend a cada 30 segundos
    updateIntervalRef.current = setInterval(() => {
      updateSession();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isAuthenticated, refresh, updateSession]);

  // Atualizar quando a página fica visível (detectar quando usuário volta)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recarregar dados quando a página fica visível
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refresh]);

  // Finalizar sessão ao fazer logout ou fechar página
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = async () => {
      // Tentar finalizar sessão (usando fetch keepalive para garantir que seja enviada)
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          // Usar fetch com keepalive para garantir que a requisição seja enviada
          fetch(`${apiUrl}/session-time/end`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            keepalive: true,
          }).catch(() => {
            // Ignorar erros em beforeunload
          });
        }
      } catch (error) {
        // Ignorar erros em beforeunload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]);

  return {
    currentSessionSeconds,
    dailySeconds,
    totalSeconds,
    dailyStats,
    formatTime,
    refresh,
    loadDailyStats,
    isLoading,
  };
}

