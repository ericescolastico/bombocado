'use client';

import React from 'react';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FontAwesomeIcon } from '@/lib/fontawesome';

function DashboardContent() {
  usePageTitle('Dashboard');

  return (
    <div className="px-8 pb-16">
      {/* Conteúdo vazio conforme especificação */}
      <div className="mt-6 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon="briefcase" className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Dashboard em construção
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Esta área será preenchida com métricas e informações importantes
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}
