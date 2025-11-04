import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona token automaticamente nas requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Flag para evitar múltiplos logouts simultâneos
let isLoggingOut = false;
let pending401Count = 0;
let logoutTimeout: NodeJS.Timeout | null = null;

// Intercepta erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 = Unauthorized (token inválido/expirado)
    // 403 = Forbidden (sem permissão, mas token válido)
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== 'undefined') {
        // Verificar se já estamos na página de login para evitar loops
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && !isLoggingOut) {
          // Não fazer logout automático para requisições de validação ou login
          // O useAuth já trata esses erros adequadamente
          const requestUrl = error.config?.url || '';
          const isAuthEndpoint = requestUrl.includes('/auth/validate') || requestUrl.includes('/auth/login');
          
          if (!isAuthEndpoint) {
            // Só fazer logout se houver um token (para evitar logout em erros de rede)
            const token = localStorage.getItem('access_token');
            if (token && error.response) {
              // Incrementar contador de 401s pendentes
              pending401Count++;
              
              // Limpar timeout anterior se existir
              if (logoutTimeout) {
                clearTimeout(logoutTimeout);
              }
              
              // Aguardar um pouco mais para permitir que outras requisições terminem
              // Especialmente importante para requisições paralelas como /audit
              logoutTimeout = setTimeout(() => {
                // Verificar novamente se ainda há token (pode ter sido removido)
                const currentToken = localStorage.getItem('access_token');
                if (currentToken && !isLoggingOut) {
                  isLoggingOut = true;
                  console.warn(`Token inválido ou expirado (${pending401Count} requisições falharam). Fazendo logout...`);
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                  isLoggingOut = false;
                }
                pending401Count = 0;
                logoutTimeout = null;
              }, 500); // Aumentado de 100ms para 500ms para dar mais tempo
            }
          }
        }
      }
    }
    // 403 = Forbidden - não fazer logout, apenas rejeitar a promessa
    // O componente que fez a requisição deve tratar esse erro
    return Promise.reject(error);
  }
);

export default api;

