'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@heroui/react';
import { FontAwesomeIcon } from '@/lib/fontawesome';

export default function LoginPage() {
  const [username, setUsername] = useState('ericescolastico');
  const [password, setPassword] = useState('**********');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação básica
    if (!username.trim()) {
      setError('Por favor, insira seu usuário');
      return;
    }

    if (!password.trim()) {
      setError('Por favor, insira sua senha');
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
    } catch (err: any) {
      // Tratamento de erros
      if (err.response?.status === 401) {
        setError('Usuário ou senha incorretos');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Não foi possível conectar. Tente novamente.');
      } else {
        setError(err.message || 'Erro ao fazer login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-white dark:bg-zinc-900">
      <div className="w-full flex flex-col items-center">
        <div className="w-[90%] max-w-[420px] md:max-w-[480px] mx-auto flex flex-col items-center space-y-6 md:space-y-8">
          {/* Logo */}
          <header className="mx-auto block w-full max-w-[280px] aspect-[1036/766] mt-12 md:mt-0 mb-4 md:mb-6">
            <img 
              src="/Logo_COMPLETO.svg" 
              alt="BomBocado Doces e Salgados"
              className="w-full h-auto object-contain"
              loading="eager"
              style={{ maxHeight: '200px' }}
            />
          </header>

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Campo Usuário */}
            <div className="relative">
              <div className="relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 pt-2 pb-2 focus-within:ring-2 focus-within:ring-emerald-400 dark:focus-within:ring-emerald-500 transition">
                <label 
                  htmlFor="username" 
                  className="text-xs text-gray-500 dark:text-zinc-400 block mb-0.5"
                >
                  Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-zinc-100 placeholder:text-gray-400"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  autoCapitalize="none"
                  inputMode="text"
                  disabled={isLoading}
                  aria-invalid={error.includes('usuário') || error.includes('Usuário') ? 'true' : 'false'}
                  aria-describedby={error ? 'username-error' : undefined}
                />
              </div>
              {error && (error.includes('usuário') || error.includes('Usuário')) && (
                <p id="username-error" className="mt-1 text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="relative">
              <div className="relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 pt-2 pb-2 focus-within:ring-2 focus-within:ring-emerald-400 dark:focus-within:ring-emerald-500 transition">
                <label 
                  htmlFor="password" 
                  className="text-xs text-gray-500 dark:text-zinc-400 block mb-0.5"
                >
                  Senha
                </label>
                <div className="flex items-center">
                  <input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 flex-1"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-invalid={error.includes('senha') || error.includes('Senha') || error.includes('incorretos') ? 'true' : 'false'}
                    aria-describedby={error ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {passwordVisible ? (
                      <FontAwesomeIcon icon="eye-slash" className="w-5 h-5" />
                    ) : (
                      <FontAwesomeIcon icon="eye" className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              {error && (error.includes('senha') || error.includes('Senha') || error.includes('incorretos')) && (
                <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Mensagem de erro geral */}
            {error && !error.includes('usuário') && !error.includes('senha') && !error.includes('Usuário') && !error.includes('Senha') && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded" role="alert">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Botão Fazer Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-70 disabled:pointer-events-none disabled:cursor-not-allowed w-full hover:-translate-y-[1px] transition-transform"
              aria-busy={isLoading}
              aria-live="polite"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="animate-spin h-5 w-5" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="user" className="w-5 h-5" />
                  <span>Fazer Login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}