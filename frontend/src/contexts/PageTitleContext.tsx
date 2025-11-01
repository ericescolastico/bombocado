'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageTitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string>('');

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitleContext() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error('usePageTitleContext must be used within a PageTitleProvider');
  }
  return context;
}

// Hook opcional que retorna null se o contexto não estiver disponível
export function usePageTitleContextOptional() {
  return useContext(PageTitleContext);
}

