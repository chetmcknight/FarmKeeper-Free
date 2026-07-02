import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { backend } from '../services/mockBackend';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: { name?: string; imageUrl?: string }) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  const signup = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const newUser = await backend.signup(email, password);
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

  const updateProfile = async (updates: { name?: string; imageUrl?: string }) => {
    if (!user) return;
    const updatedUser = await backend.updateUser(user.id, updates);
    setUser(updatedUser);
  };

  const updatePassword = async (password: string) => {
    if (!user) return;
    await backend.updatePassword(password);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, deleteAccount, updateProfile, updatePassword, isLoading }}>
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
