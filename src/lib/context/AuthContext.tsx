'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { exchangeCodeForToken } from '@/lib/services/auth/api';
import {
  storeAccessToken,
  removeAccessToken,
  cleanAuthCodeFromUrl,
  isAuthenticated as checkAuthStatus,
  extractAuthCodeFromUrl,
} from '@/lib/utils/auth';
import { resetSessionExpiredHandling } from '@/lib/services/axios-client';
import { clearPrototypeSession, signInPrototype } from '@/lib/prototype/session';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  completePrototypeSignIn: (email: string) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = () => {
      try {
        const hasToken = checkAuthStatus();
        setIsAuthenticated(hasToken);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  useEffect(() => {
    const handleAuthCode = async () => {
      const code = extractAuthCodeFromUrl();

      if (code && !isAuthenticated) {
        try {
          setIsLoading(true);
          const tokenResponse = await exchangeCodeForToken(code);
          storeAccessToken(tokenResponse.access_token, tokenResponse?.refresh_token);
          resetSessionExpiredHandling();
          cleanAuthCodeFromUrl();
          setIsAuthenticated(true);
        } catch (err) {
          cleanAuthCodeFromUrl();
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleAuthCode();
  }, [isAuthenticated]);

  const completePrototypeSignIn = (email: string) => {
    signInPrototype(email);
    resetSessionExpiredHandling();
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    removeAccessToken();
    clearPrototypeSession();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, completePrototypeSignIn, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
