export interface User {
  userId: string;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  statusUser: string;
  statusAccount: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  validateToken: () => Promise<void>;
}
