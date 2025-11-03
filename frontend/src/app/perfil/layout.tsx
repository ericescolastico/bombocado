'use client';

import React from 'react';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { Avatar } from '@heroui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProfileLayoutProps {
  children: React.ReactNode;
}

function ProfileLayoutContent({ children }: ProfileLayoutProps) {
  const { user } = useAuth();
  usePageTitle('Meu Perfil');
  const pathname = usePathname();

  const navItems = [
    { id: 'editar-informacoes', label: 'Editar Informações', path: '/perfil/editar-informacoes' },
    { id: 'log-atividades', label: 'Log de Atividades', path: '/perfil/log-atividades' },
    { id: 'estatisticas', label: 'Estatísticas', path: '/perfil/estatisticas' }
  ];

  const activeTab = navItems.find(item => pathname?.startsWith(item.path))?.id || 'editar-informacoes';

  return (
    <div className="px-8 pb-16">
      {/* Grid principal */}
      <section className="mt-6 grid grid-cols-[280px_minmax(0,1fr)] gap-8">
        {/* Sidepanel local */}
        <aside className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          {/* Foto de perfil */}
          <div className="flex w-full justify-center">
            <div className="relative">
              <Avatar
                src={user?.profileImage}
                name={user?.firstName || 'Usuário'}
                size="lg"
                radius="full"
                showFallback
                classNames={{
                  base: "h-40 w-40 ring-1 ring-black/5",
                  img: "object-cover",
                }}
              />
              <button
                className="absolute -bottom-1 -right-1 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 shadow ring-1 ring-black/5 hover:bg-white dark:hover:bg-neutral-900 transition-colors"
                aria-label="Alterar foto do perfil"
              >
                <FontAwesomeIcon icon="camera" className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Submenu */}
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`
                  flex h-10 w-full items-center rounded-md px-3 text-sm transition-colors
                  ${activeTab === item.id 
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100' 
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }
                `}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Coluna direita: título e conteúdo */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {navItems.find(i => i.id === activeTab)?.label || 'Editar Informações'}
          </h2>
          {children}
        </div>
      </section>
    </div>
  );
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileLayoutContent>{children}</ProfileLayoutContent>
      </AppShell>
    </ProtectedRoute>
  );
}
