'use client';

import React, { useState, useEffect } from 'react';
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
  const [presenceClient, setPresenceClient] = useState<PresenceClient | null>(null);

  // Inicializar cliente de presença quando autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      return;
    }

    console.log('[AppShell] Initializing presence client for user:', user.username);
    const client = new PresenceClient(
      () => console.log('[AppShell] Presence client connected'),
      () => console.log('[AppShell] Presence client disconnected'),
      (error) => console.error('[AppShell] Presence client error:', error),
    );

    client.connect(token);
    setPresenceClient(client);

    return () => {
      console.log('[AppShell] Cleaning up presence client');
      client.disconnect();
    };
  }, [isAuthenticated, user]);

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
