'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Search, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '@/contexts/RoleContext';
import { API_URL } from '@/utils/api';

interface Thread {
  userId: number;
  userName: string | null;
  userEmail: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: boolean;
  unit?: string | null;
  residenceId?: string | null;
}

interface ChatMessage {
  id: number;
  senderId: number;
  senderRole: string;
  senderName: string | null;
  body: string | null;
  attachments: { url: string; type: string }[];
  createdAt: string;
}

const authHeaders = () => {
  const token = sessionStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const initialsOf = (name: string | null, email: string | null) => {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Aujourd'hui";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const relativeDay = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return '1j';
  if (days < 30) return `${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export default function MessagesClient() {
  const { user } = useRole();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const res = await fetch(`${API_URL}/messages/admin/threads`, { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setThreads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const openThread = async (thread: Thread) => {
    setSelected(thread);
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/messages/admin?userId=${thread.userId}`, { headers: authHeaders() });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      if (thread.unread) {
        await fetch(`${API_URL}/messages/admin/${thread.userId}/read`, { method: 'PUT', headers: authHeaders() });
        setThreads((prev) => prev.map((t) => (t.userId === thread.userId ? { ...t, unread: false } : t)));
      }
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const send = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/messages/admin`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: selected.userId, body: draft.trim() }),
      });
      const created = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, created]);
        setDraft('');
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
        loadThreads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = useMemo(() => {
    return threads
      .filter((t) => (filter === 'unread' ? t.unread : true))
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (t.userName || '').toLowerCase().includes(q) || (t.unit || '').toLowerCase().includes(q);
      });
  }, [threads, filter, search]);

  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <div className="flex h-full">
      {/* ── Thread list ─────────────────────────────────── */}
      <div className="flex w-96 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h1 className="text-xl font-bold text-brand-navy">Messages</h1>
          {unreadCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-amber px-1.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Résident ou lot..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-amber focus:bg-white"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-4">
          {(['all', 'unread'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                filter === key ? 'bg-brand-amber text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {key === 'all' ? 'Tous' : 'Non lus'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <p className="px-5 py-6 text-sm text-slate-400">Chargement…</p>
          ) : filteredThreads.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Aucune conversation.</p>
          ) : (
            filteredThreads.map((t) => (
              <button
                key={t.userId}
                onClick={() => openThread(t)}
                className={clsx(
                  'flex w-full items-start gap-3 border-b border-slate-100 px-5 py-3.5 text-left transition-colors',
                  selected?.userId === t.userId ? 'bg-brand-amber/10' : 'hover:bg-slate-50'
                )}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-amber/15 text-xs font-bold text-brand-amber">
                  {initialsOf(t.userName, t.userEmail)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-brand-navy">{t.userName || t.userEmail}</p>
                    <span className="flex-shrink-0 text-[11px] text-slate-400">{relativeDay(t.lastMessageAt)}</span>
                  </div>
                  {t.unit && <p className="truncate text-xs font-medium text-brand-amber">{t.unit}{t.residenceId ? ` · ${t.residenceId}` : ''}</p>}
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">{t.lastMessage || '—'}</p>
                    {t.unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-amber" />}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat panel ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Sélectionnez une conversation pour l&apos;afficher.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-amber/15 text-xs font-bold text-brand-amber">
                {initialsOf(selected.userName, selected.userEmail)}
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">{selected.userName || selected.userEmail}</p>
                {selected.unit && <p className="text-xs text-slate-500">{selected.unit}{selected.residenceId ? ` · ${selected.residenceId}` : ''}</p>}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-6 py-5">
              {loadingMessages ? (
                <p className="text-sm text-slate-400">Chargement…</p>
              ) : (
                (() => {
                  let lastDay = '';
                  return messages.map((m) => {
                    const isMine = user?.id != null && String(m.senderId) === String(user.id);
                    const day = dayLabel(m.createdAt);
                    const showDivider = day !== lastDay;
                    lastDay = day;
                    return (
                      <div key={m.id}>
                        {showDivider && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500">{day}</span>
                          </div>
                        )}
                        <div className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={clsx(
                              'max-w-md rounded-2xl px-4 py-2.5 text-sm',
                              isMine ? 'bg-brand-navy text-white' : 'border border-slate-200 bg-white text-brand-navy'
                            )}
                          >
                            {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                            <p className={clsx('mt-1 text-right text-[10px]', isMine ? 'text-white/50' : 'text-slate-400')}>
                              {timeLabel(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button className="text-slate-400 hover:text-slate-600" title="Pièce jointe (bientôt disponible)" disabled>
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Écrire un message..."
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-amber focus:bg-white"
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-amber text-white transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
