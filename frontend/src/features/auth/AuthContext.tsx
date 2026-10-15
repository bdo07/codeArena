import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('codearena_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('codearena_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (loginInput: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', {
      login: loginInput,
      password,
    });

    const receivedUser = res.data.user;
    const receivedToken = res.data.token;

    setUser(receivedUser);
    setToken(receivedToken);
    localStorage.setItem('codearena_token', receivedToken);

    return receivedUser;
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<User> => {
    const res = await api.post('/auth/register', data);

    const receivedUser = res.data.user;
    const receivedToken = res.data.token;

    setUser(receivedUser);
    setToken(receivedToken);
    localStorage.setItem('codearena_token', receivedToken);

    return receivedUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('codearena_token');
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
