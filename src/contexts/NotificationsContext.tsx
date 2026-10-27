'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL } from '@/utils/api';
import { useRole } from '@/contexts/RoleContext';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// One poll shared by the header bell, the sidebar badge and the mobile "Plus"
// tab, instead of each of them fetching the same list on its own.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useRole();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    // Deferred so the first fetch runs outside the effect body, like the
    // interval ticks after it.
    const first = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [user, refresh]);

  const markAsRead = async (id: number) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const markAllAsRead = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  // Signed out: hide the previous account's list without an extra render.
  const visible = user ? notifications : [];
  const unreadCount = visible.filter((n) => !n.isRead).length;

  return (
    <NotificationsContext.Provider value={{ notifications: visible, unreadCount, markAsRead, markAllAsRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
