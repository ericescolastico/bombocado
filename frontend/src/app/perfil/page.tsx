'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Field } from '@/components/Field';
import { SelectTheme } from '@/components/SelectTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { api } from '@/lib/api';
import { Avatar } from '@heroui/react';

interface ProfileFormData {
  nome: string;
  apelido: string;
  usuario: string;
  senha: string;
  telefone: string;
  email: string;
  tema: string;
}

interface AuditLog {
  id: string;
  event: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function ProfileContent() {
  const { user } = useAuth();
  usePageTitle('Meu Perfil');
  
  const [activeTab, setActiveTab] = useState('editar-informacoes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    nome: user?.firstName || 'Eric Escolástico Barboza',
    apelido: user?.firstName || 'Eric Escolástico',
    usuario: user?.username || 'ericescolastico',
    senha: '**********',
    telefone: user?.phone || '(11) 98227-4859',
    email: user?.email || 'ericescolastico@gmail.com',
    tema: 'system'
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setFormData(prev => ({ ...prev, tema: savedTheme }));
  }, []);

  // Carregar logs quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'log-atividades' && user?.userId) {
      loadAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.userId]);

  const loadAuditLogs = async () => {
    if (!user?.userId) return;
    
    setLogsLoading(true);
    try {
      const response = await api.get<AuditLogsResponse>(`/audit/${user.userId}`);
      setAuditLogs(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatEventDescription = (event: string): string => {
    const eventMap: Record<string, string> = {
      'user.login': 'entrou',
      'user.logout': 'saiu',
      'user.register': 'se registrou',
      'user.profile.update': 'atualizou o perfil',
    };
    return eventMap[event] || event;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara brasileira
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, telefone: formatted }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.usuario.trim()) {
      newErrors.usuario = 'Usuário é obrigatório';
    } else if (!/^[a-z0-9._-]+$/.test(formData.usuario)) {
      newErrors.usuario = 'Usuário deve conter apenas letras minúsculas, números, pontos, hífens e underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const navItems = [
    { id: 'editar-informacoes', label: 'Editar Informações' },
    { id: 'log-atividades', label: 'Log de Atividades' },
    { id: 'estatisticas', label: 'Estatísticas' }
  ];

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
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
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
                  </button>
                ))}
              </nav>
            </aside>

            {/* Coluna direita: título e conteúdo */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {navItems.find(i => i.id === activeTab)?.label || 'Editar Informações'}
              </h2>

              {/* Conteúdo da aba Editar Informações */}
              {activeTab === 'editar-informacoes' && (
              <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {/* Cargo (pill) */}
                <div className="col-span-2">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">Cargo</label>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Super Administrador
                  </div>
                </div>

                {/* Campos do formulário */}
                <Field 
                  label="Nome" 
                  className="col-span-2" 
                  defaultValue={formData.nome}
                  onChange={handleFieldChange('nome')}
                  error={errors.nome}
                  required
                />
                
                <Field 
                  label="Apelido" 
                  defaultValue={formData.apelido}
                  onChange={handleFieldChange('apelido')}
                />
                
                <Field 
                  label="Usuário" 
                  defaultValue={formData.usuario}
                  onChange={handleFieldChange('usuario')}
                  error={errors.usuario}
                  required
                />

                {/* Senha */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      defaultValue={formData.senha}
                      className="h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/70 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <FontAwesomeIcon icon="eye-slash" className="w-4 h-4" />
                      ) : (
                        <FontAwesomeIcon icon="eye" className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Field 
                  label="Telefone" 
                  defaultValue={formData.telefone}
                  onChange={handlePhoneChange}
                />
                
                <Field 
                  label="Email" 
                  className="col-span-2" 
                  type="email"
                  defaultValue={formData.email}
                  onChange={handleFieldChange('email')}
                  error={errors.email}
                  required
                />

                {/* Tema */}
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Tema
                  </label>
                  <SelectTheme 
                    value={formData.tema}
                    onChange={(value) => setFormData(prev => ({ ...prev, tema: value }))}
                  />
                </div>
              </div>

                {/* Botão de salvar */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-500 px-4 text-white shadow hover:bg-emerald-600 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <FontAwesomeIcon icon="spinner" className="animate-spin h-4 w-4" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon="check" className="w-4 h-4" />
                        <span>Aplicar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
              )}

              {/* Conteúdo da aba Log de Atividades */}
              {activeTab === 'log-atividades' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <FontAwesomeIcon icon="spinner" className="animate-spin h-8 w-8 text-emerald-500" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Nenhuma atividade registrada ainda.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="py-2 px-3 rounded-md bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          {formatDateTime(log.createdAt)} | {user?.username} {formatEventDescription(log.event)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão de reportar atividade suspeita */}
                  {auditLogs.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                      <button className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                        <FontAwesomeIcon icon="exclamation-triangle" className="w-4 h-4" />
                        <span>Reportar Atividade Suspeita</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Conteúdo da aba Estatísticas */}
              {activeTab === 'estatisticas' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                  <div className="text-center py-12">
                    <FontAwesomeIcon icon="chart-bar" className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 dark:text-neutral-400">
                      Estatísticas em breve
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </ProtectedRoute>
  );
}