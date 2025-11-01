'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Field } from '@/components/Field';
import { SelectTheme } from '@/components/SelectTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FontAwesomeIcon } from '@/lib/fontawesome';

interface ProfileFormData {
  nome: string;
  apelido: string;
  usuario: string;
  senha: string;
  telefone: string;
  email: string;
  tema: string;
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

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setFormData(prev => ({ ...prev, tema: savedTheme }));
  }, []);

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
      
      // Mostrar toast de sucesso (implementar depois)
      console.log('Perfil atualizado com sucesso!');
      
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
                  <div className="h-40 w-40 overflow-hidden rounded-full shadow ring-1 ring-black/5">
                    <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-6xl text-white font-bold">
                      {user?.firstName?.[0]?.toUpperCase() || 'E'}
                    </div>
                  </div>
                  <button
                    className="absolute -bottom-1 -right-1 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/5 hover:bg-white transition-colors"
                    aria-label="Alterar foto do perfil"
                  >
                    <FontAwesomeIcon icon="camera" className="w-5 h-5 text-neutral-600" />
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