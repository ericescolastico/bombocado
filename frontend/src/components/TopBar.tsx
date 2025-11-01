'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitleContext } from '@/contexts/PageTitleContext';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import Image from 'next/image';

export function TopBar() {
  const { logout } = useAuth();
  const { title } = usePageTitleContext();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-3 bg-transparent">
      {/* Título da página alinhado à esquerda */}
      <div className="flex items-center flex-1 min-w-0 pl-4">
        {title && (
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
        )}
      </div>
      
      {/* Ícones de notificação e ações */}
      <div className="flex items-center gap-1">
        {/* Ícone de mensagens */}
        <button
          className="relative flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Mensagens"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <FontAwesomeIcon icon="envelope" className="w-8 h-8" />
          </div>
        </button>

        {/* Ícone de notificações */}
        <button
          className="relative flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Notificações"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <FontAwesomeIcon icon="bell" className="w-8 h-8" />
            {/* Badge de notificação vermelho com borda branca sobre o ícone */}
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 border-2 border-white"></span>
          </div>
        </button>
      </div>

      {/* Logo */}
      <div className="flex items-center ml-8">
        <Image
          src="/logo.svg"
          alt="BomBocado Logo"
          width={200}
          height={60}
          className="h-12 w-auto"
        />
      </div>
    </header>
  );
}
