'use client';

import React from 'react';
import { useSessionTime } from '@/hooks/useSessionTime';

interface SessionTimeDisplayProps {
  /**
   * Qual tempo exibir:
   * - 'current': tempo da sessão atual
   * - 'daily': tempo total do dia
   * - 'total': tempo total de todos os dias
   */
  mode?: 'current' | 'daily' | 'total';
  /**
   * Mostrar label
   */
  showLabel?: boolean;
  /**
   * Tamanho do texto
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Classe CSS customizada
   */
  className?: string;
}

/**
 * Componente para exibir tempo online do usuário
 */
export function SessionTimeDisplay({
  mode = 'current',
  showLabel = true,
  size = 'md',
  className = '',
}: SessionTimeDisplayProps) {
  const { currentSessionSeconds, dailySeconds, totalSeconds, formatTime } = useSessionTime();

  const getSeconds = () => {
    switch (mode) {
      case 'current':
        return currentSessionSeconds;
      case 'daily':
        return dailySeconds;
      case 'total':
        return totalSeconds;
      default:
        return currentSessionSeconds;
    }
  };

  const getLabel = () => {
    switch (mode) {
      case 'current':
        return 'Tempo nesta sessão';
      case 'daily':
        return 'Tempo hoje';
      case 'total':
        return 'Tempo total';
      default:
        return 'Tempo online';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const seconds = getSeconds();
  const timeString = formatTime(seconds);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {showLabel && (
        <span className={`text-neutral-600 dark:text-neutral-400 ${getSizeClass()}`}>
          {getLabel()}
        </span>
      )}
      <span className={`font-mono font-semibold text-emerald-600 dark:text-emerald-400 ${getSizeClass()}`}>
        {timeString}
      </span>
    </div>
  );
}

/**
 * Componente compacto (inline) para exibir apenas o tempo
 */
export function SessionTimeInline({
  mode = 'current',
  className = '',
}: Omit<SessionTimeDisplayProps, 'showLabel' | 'size'>) {
  const { currentSessionSeconds, dailySeconds, totalSeconds, formatTime } = useSessionTime();

  const getSeconds = () => {
    switch (mode) {
      case 'current':
        return currentSessionSeconds;
      case 'daily':
        return dailySeconds;
      case 'total':
        return totalSeconds;
      default:
        return currentSessionSeconds;
    }
  };

  const seconds = getSeconds();
  const timeString = formatTime(seconds);

  return (
    <span className={`font-mono text-emerald-600 dark:text-emerald-400 ${className}`}>
      {timeString}
    </span>
  );
}

