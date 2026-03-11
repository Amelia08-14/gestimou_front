'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'ADMIN' | 'INTERVENANT' | 'RESPONSABLE_ZONE' | 'RECOUVREMENT' | 'HSE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface RoleContextType {
  role: Role | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setRole: (role: Role) => void; // Deprecated, kept for compatibility
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token on mount
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRoleState(parsedUser.role);
        } catch (e) {
          console.error("Error parsing stored user", e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setRoleState(userData.role);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRoleState(null);
    router.push('/login');
  };

  const setRole = (newRole: Role) => {
    // Deprecated: Update local state only
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      setRoleState(newRole);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <RoleContext.Provider value={{ role, user, isAuthenticated: !!user, isLoading, login, logout, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
