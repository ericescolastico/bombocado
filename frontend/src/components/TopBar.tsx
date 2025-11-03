'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitleContext } from '@/contexts/PageTitleContext';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';

export function TopBar() {
  const { logout } = useAuth();
  const { title } = usePageTitleContext();
  const pathname = usePathname();

  // Função para gerar breadcrumbs baseado no pathname
  const generateBreadcrumbs = (): Array<{ key: string; href: string; label: string; isLast: boolean }> => {
    if (!pathname) return [];

    const segments = pathname.split('/').filter(Boolean);
    
    // Mapeamento de rotas para nomes amigáveis
    const routeNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'perfil': 'Perfil',
      'pedidos': 'Pedidos',
      'produtos': 'Produtos',
      'clientes': 'Clientes',
      'editar-informacoes': 'Editar Informações',
      'novo': 'Novo',
      'editar': 'Editar',
    };

    const breadcrumbs: Array<{ key: string; href: string; label: string; isLast: boolean }> = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      breadcrumbs.push({
        key: segment,
        href: currentPath,
        label: routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 min-h-14 flex items-center justify-between px-3 bg-transparent py-1">
      {/* Título da página e breadcrumb alinhados à esquerda */}
      <div className="flex flex-col items-start flex-1 min-w-0 pl-4">
        {title && (
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
        )}
        {breadcrumbItems.length > 0 && (
          <Breadcrumbs
            size="sm"
            variant="light"
            color="foreground"
            underline="none"
            classNames={{
              base: "mt-0.5",
              list: "gap-1",
              separator: "text-neutral-400 dark:text-neutral-500",
            }}
          >
            {breadcrumbItems.map((item) => (
              <BreadcrumbItem
                key={item.key}
                href={item.isLast ? undefined : item.href}
                isCurrent={item.isLast}
                classNames={{
                  base: "text-xs",
                  item: "text-xs text-neutral-500 dark:text-neutral-400",
                }}
              >
                {item.label}
              </BreadcrumbItem>
            ))}
          </Breadcrumbs>
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
      <a href="/dashboard" className="flex items-center ml-8 cursor-pointer" aria-label="Ir para o Dashboard">
        <Image
          src="/logo.svg"
          alt="BomBocado Logo"
          width={200}
          height={60}
          className="h-12 w-auto"
        />
      </a>
    </header>
  );
}
