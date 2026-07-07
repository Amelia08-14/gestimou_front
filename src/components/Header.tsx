'use client';

import { Bell, Search, Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRole } from '@/contexts/RoleContext';
import Link from 'next/link';
import { API_URL } from '@/utils/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function NotifDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    SUCCESS: '#15803d',
    WARNING: '#d97706',
    ERROR: '#dc2626',
    INFO: '#0c1620',
  };
  return (
    <span
      className="mr-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full"
      style={{ backgroundColor: colors[type] ?? '#94a3b8' }}
    />
  );
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu]     = useState(false);
  const { user, logout } = useRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Notification[] = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        }
      } catch {}
    };

    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60_000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      setUnreadCount(0);
    } catch {}
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-500 hover:text-brand-navy transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden md:block w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-amber focus:bg-white focus:ring-2 focus:ring-brand-amber/20"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-brand-navy transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#db9200' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">
                    Aucune notification.
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={`flex cursor-pointer items-start px-4 py-3 hover:bg-slate-50 transition-colors ${
                        !notif.isRead ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <NotifDot type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-100 p-2 text-center">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs font-medium text-brand-amber hover:text-brand-gold transition-colors disabled:opacity-40"
                >
                  Tout marquer comme lu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-brand-navy shadow-sm" style={{ backgroundColor: '#db9200' }}>
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name || 'Utilisateur'}</p>
              <p className="text-[11px] text-slate-400">{user?.role || ''}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="p-1 space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  Mon Profil
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
