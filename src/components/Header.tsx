'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { AppIcon } from '@/components/ui';

const DOT_COLORS: Record<string, string> = {
  SUCCESS: '#2ecc71',
  WARNING: '#db9200',
  ERROR: '#e74c3c',
  INFO: '#5794ea',
};

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function today() {
  const d = new Date();
  const w = WEEKDAYS[d.getDay()];
  return `${w[0].toUpperCase()}${w.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// Desktop top bar. The app has no title bar on desktop — each page carries
// its own header — so this stays a quiet strip: the date on the left, the
// notification bell (AdminSquareButton) on the right.
export function Header() {
  const [open, setOpen] = useState(false);
  const [date] = useState(today);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gi-card-border bg-gi-scaffold/85 px-8 backdrop-blur-md">
      <p className="text-[13px] text-gi-muted">{date}</p>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.02] bg-black/5 text-gi-body transition-transform hover:bg-black/[0.08] active:scale-[0.88]"
        >
          <AppIcon name="bell_16" className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gi-error ring-2 ring-gi-scaffold" />
          )}
        </button>

        {open && (
          <div className="gi-appear absolute right-0 mt-2 w-[360px] overflow-hidden rounded-2xl border border-gi-card-border bg-gi-raised shadow-xl">
            <div className="flex items-center justify-between px-4 pb-3 pt-4">
              <h3 className="text-base font-semibold text-gi-body">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-md bg-brand-amber px-2 py-0.5 text-xs font-medium text-black">{unreadCount}</span>
              )}
            </div>
            <div className="max-h-96 space-y-1.5 overflow-y-auto px-2 pb-2">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-[13px] text-gi-faint">Aucune notification.</p>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      notif.isRead ? 'border-transparent hover:bg-black/[0.03]' : 'border-brand-amber/25 bg-brand-amber/[0.06]'
                    }`}
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: DOT_COLORS[notif.type] ?? '#999999' }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] ${notif.isRead ? 'text-gi-muted' : 'font-semibold text-gi-body'}`}>
                        {notif.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-gi-muted">{notif.message}</span>
                      <span className="mt-1 block text-[10px] text-gi-faint">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-gi-card-border p-2.5 text-center">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-[13px] font-semibold text-brand-amber transition-opacity disabled:opacity-40"
              >
                Tout marquer comme lu
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
