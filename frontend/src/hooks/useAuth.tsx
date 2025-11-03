'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, LoginCredentials, AuthResponse, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Carrega dados do localStorage na inicialização
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Valida o token com o backend
  const validateToken = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const response = await api.post('/auth/validate');
      if (response.data.valid) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      logout();
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { access_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Usuário ou senha inválidos');
      } else if (error.response?.status === 423) {
        throw new Error('Usuário bloqueado. Entre em contato com o administrador.');
      }
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, validateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

