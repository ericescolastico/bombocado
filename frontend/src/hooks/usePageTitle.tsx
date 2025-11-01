'use client';

import { useEffect } from 'react';
import { usePageTitleContext } from '@/contexts/PageTitleContext';

export function usePageTitle(title: string) {
  const { setTitle } = usePageTitleContext();

  useEffect(() => {
    setTitle(title);
    // Limpar título quando componente desmontar
    return () => setTitle('');
  }, [title, setTitle]);
}

