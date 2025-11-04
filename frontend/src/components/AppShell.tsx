'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PrimarySidebar } from './PrimarySidebar';
import { TopBar } from './TopBar';
import { PageTitleProvider } from '@/contexts/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import { PresenceClient } from '@/presence/presenceClient';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const presenceClientRef = useRef<PresenceClient | null>(null);

  // Inicializar cliente de presença quando autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Se desautenticado, desconectar cliente existente
      if (presenceClientRef.current) {
        console.log('[AppShell] User logged out, disconnecting presence client');
        presenceClientRef.current.disconnect();
        presenceClientRef.current = null;
      }
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      console.warn('[AppShell] No token found, cannot initialize presence client');
      return;
    }

    // Se já existe um cliente e está conectado ou conectando, não criar outro
    if (presenceClientRef.current) {
      const isConnected = presenceClientRef.current.getConnected();
      console.log(`[AppShell] Presence client already exists, connected=${isConnected}`);
      if (isConnected) {
        return;
      }
      // Se existe mas não está conectado, desconectar antes de criar novo
      console.log('[AppShell] Existing client not connected, cleaning up');
      presenceClientRef.current.disconnect();
      presenceClientRef.current = null;
    }

    console.log('[AppShell] Initializing presence client for user:', user.username, 'userId:', user.userId);
    const client = new PresenceClient(
      () => {
        console.log('[AppShell] Presence client connected successfully');
        // Enviar primeiro heartbeat imediatamente após conexão
        setTimeout(() => {
          if (client.getConnected() && client.getLeaderStatus()) {
            console.log('[AppShell] Client is leader, will send heartbeat');
          }
        }, 500);
      },
      () => {
        console.log('[AppShell] Presence client disconnected');
      },
      (error) => {
        console.error('[AppShell] Presence client error:', error);
      },
    );

    client.connect(token);
    presenceClientRef.current = client;

    return () => {
      console.log('[AppShell] Cleaning up presence client');
      // Verificar se o cliente ainda existe antes de desconectar
      if (presenceClientRef.current) {
        presenceClientRef.current.disconnect();
        presenceClientRef.current = null;
      }
    };
  }, [isAuthenticated, user?.userId]); // Usar user?.userId em vez de user inteiro para evitar re-renders desnecessários

  // Toggle sidebar com Ctrl/Cmd + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  return (
    <PageTitleProvider>
      <div className="flex min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {/* Primary Sidebar */}
        <PrimarySidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </PageTitleProvider>
  );
}
