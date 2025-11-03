/**
 * Componente StatusDot - exibe status online/offline de usuário
 */
'use client';

import React from 'react';
import { usePresence } from '@/presence/usePresence';

interface StatusDotProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export const StatusDot: React.FC<StatusDotProps> = ({
  userId,
  size = 'md',
  showTooltip = true,
}) => {
  const presence = usePresence([userId]);
  const isOnline = presence.isOnline(userId);
  const lastSeen = presence.getLastSeen(userId);

  const formatLastSeen = (timestamp: string): string => {
    if (!timestamp) return 'Nunca';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Agora';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
      if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Desconhecido';
    }
  };

  const tooltipText = isOnline
    ? 'Online'
    : lastSeen
    ? `Offline (última vez: ${formatLastSeen(lastSeen)})`
    : 'Offline';

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      }`}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};

