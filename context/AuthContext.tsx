import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { backend } from '../services/mockBackend';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, plan?: 'free' | 'pro') => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on load
    const initAuth = async () => {
      try {
        const currentUser = await backend.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Auth init failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    // Set up Supabase Auth Listener if using Supabase
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
           const currentUser = await backend.getCurrentUser();
           setUser(currentUser);
           setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
           setUser(null);
           setIsLoading(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const newUser = await backend.login(email, password);
      setUser(newUser);
    } catch (error) {
       console.error(error);
       throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password?: string, plan: 'free' | 'pro' = 'free') => {
    setIsLoading(true);
    try {
      const newUser = await backend.signup(email, password, plan);
      setUser(newUser);
    } catch (error) {
       console.error(error);
       throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await backend.logout();
    setUser(null);
  };
  
  const deleteAccount = async () => {
      await backend.deleteAccount();
      setUser(null);
  };

  const upgradeToPro = async () => {
    if (!user) return;
    const updatedUser = await backend.upgradePlan(user.id);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, deleteAccount, upgradeToPro, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};