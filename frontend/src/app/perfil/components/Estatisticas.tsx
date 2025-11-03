'use client';

import React from 'react';
import { StatCard } from '@/components/StatCard';
import { useSessionTime } from '@/hooks/useSessionTime';

export function Estatisticas() {
  const { totalSeconds } = useSessionTime();

  // Formatar tempo no formato brasileiro: "19h25min" ou "25min"
  const formatTimeBrazilian = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h${minutes}min`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="space-y-6">
      <StatCard
        label="Tempo Total Online"
        value={formatTimeBrazilian(totalSeconds)}
        color="bg-green-100 dark:bg-green-950/20"
        labelClassName="text-green-500 dark:text-green-500"
        valueClassName="text-green-500 dark:text-green-500"
      />
    </div>
  );
}
