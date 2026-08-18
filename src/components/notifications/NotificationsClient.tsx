'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { API_URL } from '@/utils/api';

interface Notif {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

const authHeaders = () => {
  const token = sessionStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const typeStyle: Record<Notif['type'], { icon: typeof Bell; bg: string; fg: string }> = {
  WARNING: { icon: AlertTriangle, bg: 'bg-brand-amber/15', fg: 'text-brand-amber' },
  SUCCESS: { icon: CheckCircle2, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  ERROR: { icon: XCircle, bg: 'bg-red-100', fg: 'text-red-600' },
  INFO: { icon: Bell, bg: 'bg-blue-100', fg: 'text-blue-600' },
};

const relativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
};

export default function NotificationsClient() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications`, { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markRead = async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers: authHeaders() });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-brand-navy">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-amber px-1.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">Aucune notification.</p>
        ) : (
          items.map((n, i) => {
            const style = typeStyle[n.type] || typeStyle.INFO;
            const Icon = style.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={clsx(
                  'flex w-full items-start gap-4 px-6 py-4 text-left transition-colors',
                  i > 0 && 'border-t border-slate-100',
                  !n.isRead ? 'bg-brand-amber/5 hover:bg-brand-amber/10' : 'hover:bg-slate-50'
                )}
              >
                <div className={clsx('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', style.bg)}>
                  <Icon className={clsx('h-4.5 w-4.5', style.fg)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-navy">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1.5 text-xs text-slate-400">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-amber" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
