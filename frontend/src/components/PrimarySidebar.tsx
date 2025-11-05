'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { Avatar } from '@heroui/react';
import { Badge } from '@heroui/react';

interface PrimarySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <FontAwesomeIcon icon="briefcase" className="w-5 h-5" />,
    path: '/dashboard'
  },
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    icon: <FontAwesomeIcon icon="headset" className="w-5 h-5" />,
    path: '/atendimentos',
    children: [
      {
        id: 'caixa-entrada',
        label: 'Caixa de Entrada',
        icon: <FontAwesomeIcon icon="inbox" className="w-4 h-4" />,
        path: '/atendimentos/inbox'
      },
      {
        id: 'fluxo-atendimento',
        label: 'Fluxo de atendimento',
        icon: <FontAwesomeIcon icon="columns" className="w-4 h-4" />,
        path: '/atendimentos/fluxo'
      }
    ]
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    icon: <FontAwesomeIcon icon="users" className="w-5 h-5" />,
    path: '/usuarios',
    children: [
      {
        id: 'painel-controle',
        label: 'Painel Geral de Controle',
        icon: <FontAwesomeIcon icon="tachometer-alt" className="w-4 h-4" />,
        path: '/usuarios/painel-controle'
      },
      {
        id: 'log-atividades',
        label: 'Log de atividades',
        icon: <FontAwesomeIcon icon="history" className="w-4 h-4" />,
        path: '/usuarios/log-atividades'
      }
    ]
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <FontAwesomeIcon icon="cog" className="w-5 h-5" />,
    path: '/configuracoes',
    children: [
      {
        id: 'configuracoes-perfil',
        label: 'Configurações de perfil',
        icon: <FontAwesomeIcon icon="user-cog" className="w-4 h-4" />,
        path: '/perfil'
      }
    ]
  }
];

export function PrimarySidebar({ collapsed, onToggle }: PrimarySidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const toggleExpanded = (itemId: string) => {
    // Se o menu estiver colapsado e tiver filhos, expandir o menu primeiro
    if (collapsed) {
      onToggle();
      // Aguardar a animação do sidebar expandir antes de abrir o dropdown
      setTimeout(() => {
        setExpandedItems(new Set([itemId]));
      }, 200);
      return;
    }
    
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isItemActive = (item: NavItem): boolean => {
    if (pathname === item.path) return true;
    if (item.children) {
      return item.children.some(child => pathname.startsWith(child.path));
    }
    return false;
  };

  // Fechar dropdowns quando o sidebar for colapsado
  useEffect(() => {
    if (collapsed) {
      setExpandedItems(new Set());
    }
  }, [collapsed]);

  return (
    <aside
      id="primary-sidebar"
      className={`group flex flex-col border-r border-neutral-200 dark:border-neutral-800 transition-[width] duration-200 ease-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      aria-label="Navegação principal"
    >
      {/* Avatar e informações do usuário */}
      <div className="p-3 flex items-center gap-3">
        {/* Coluna 1: Avatar com Badge de status */}
        <button
          className="relative"
          aria-label="Abrir menu"
          onClick={() => handleNavigation('/perfil')}
        >
          <Badge
            content=""
            color={user?.statusUser === 'ONLINE' ? 'success' : user?.statusUser === 'AUSENTE' ? 'warning' : 'danger'}
            shape="circle"
            placement="bottom-right"
            size="sm"
            classNames={{
              base: "border-0",
              badge: "border-0",
            }}
          >
            <Avatar
              src={user?.profileImage}
              name={user?.firstName || 'Usuário'}
              size="md"
              radius="full"
              showFallback
              classNames={{
              }}
            />
          </Badge>
        </button>

        {/* Se expandido, mostrar informações em colunas */}
        {!collapsed && (
          <div className="flex flex-1 items-center min-w-0">
            {/* Coluna 2: Nome e cargo (duas linhas) */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 leading-tight truncate max-w-[140px]">
                {user?.firstName || 'Usuário'}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[140px]">
                {user?.role || 'Cargo indefinido'}
              </div>
            </div>
            {/* Coluna 3: Ícone editar perfil */}
            <button
              className="ml-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors p-1"
              aria-label="Editar perfil"
              onClick={() => handleNavigation('/perfil')}
              tabIndex={0}
              type="button"
            >
              <FontAwesomeIcon icon="edit" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="mt-4 flex-1 space-y-1 px-2">
        {navItems
          .filter((item) => {
            // Filtrar item "usuarios" se o usuário não for ADMIN
            if (item.id === 'usuarios' && user?.role !== 'ADMIN') {
              return false;
            }
            return true;
          })
          .map((item) => {
          const isActive = isItemActive(item);
          const isExpanded = expandedItems.has(item.id);
          const hasChildren = item.children && item.children.length > 0;
          
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => hasChildren ? toggleExpanded(item.id) : handleNavigation(item.path)}
                className={`
                  flex h-10 w-full items-center rounded-md px-3 text-sm transition-colors
                  ${isActive 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }
                  ${collapsed ? 'justify-center' : 'gap-3'}
                `}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                      <FontAwesomeIcon 
                        icon="chevron-down" 
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </>
                )}
              </button>
              
              {/* Subitens */}
              {hasChildren && !collapsed && isExpanded && item.children && (
                <div className="ml-4 space-y-1 border-l-2 border-neutral-200 dark:border-neutral-800 pl-2">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.path;
                    return (
                      <button
                        key={child.id}
                        onClick={() => handleNavigation(child.path)}
                        className={`
                          flex h-9 w-full items-center rounded-md px-3 text-sm transition-colors
                          ${isChildActive 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium' 
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                          }
                          gap-3
                        `}
                        aria-current={isChildActive ? 'page' : undefined}
                      >
                        {child.icon}
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Controles inferiores: Toggle e Logout fixados ao rodapé */}
      <div className="mt-auto p-2 space-y-2">
        {/* Logout */}
        <button
          onClick={logout}
          className={`
            ${collapsed ? 'h-10 w-10 justify-center rounded-full' : 'h-10 w-full rounded-full px-4 justify-between'}
            flex items-center bg-amber-400 hover:bg-amber-500 text-black transition-colors
          `}
          aria-label="Sair da conta"
          title={collapsed ? 'Sair' : undefined}
        >
          {!collapsed && (
            <span className="text-sm font-medium">Sair</span>
          )}
          <FontAwesomeIcon icon="sign-out-alt" className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${collapsed ? '' : 'ml-3'}`} />
        </button>
        {/* Toggle */}
        <button
          onClick={onToggle}
          className="flex h-9 w-full items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-expanded={!collapsed}
          aria-controls="primary-sidebar"
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <FontAwesomeIcon
            icon="chevron-left"
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>
    </aside>
  );
}
