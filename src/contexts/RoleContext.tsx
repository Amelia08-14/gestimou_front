'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'ADMIN' | 'INTERVENANT' | 'RESPONSABLE_ZONE' | 'RECOUVREMENT' | 'MANAGER' | 'HSE';

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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRoleState(parsedUser.role);
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', storedUser);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (e) {
          console.error("Error parsing stored user", e);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const isAuthed = !!user;
    if (!isAuthed) return;

    const key = 'auth_expires_at';
    const INACTIVITY_MS = 30 * 60 * 1000;
    const bump = () => {
      sessionStorage.setItem(key, String(Date.now() + INACTIVITY_MS));
    };

    bump();

    const onActivity = () => bump();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') bump();
    };

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);

    const interval = window.setInterval(() => {
      const expiresAt = Number(sessionStorage.getItem(key) || '0');
      if (expiresAt && Date.now() > expiresAt) {
        logout();
      }
    }, 5000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [user]);

  const login = (userData: User, token: string) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setRoleState(userData.role);
    router.push('/');
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_expires_at');
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
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
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
