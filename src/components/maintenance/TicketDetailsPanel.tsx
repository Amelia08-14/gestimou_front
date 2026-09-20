'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/utils/api';

const MAX_FILES = 4;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const ACCEPT =
  'image/png,image/jpeg,image/webp,application/pdf,.doc,.docx,.xls,.xlsx';

export interface TicketAttachment {
  id: number | string;
  url: string;
  name?: string | null;
  type?: string | null;
  size: number;
  createdAt?: string;
}

interface HistoryItem {
  id: number | string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actorRole: string | null;
  actorName: string | null;
  createdAt: string;
}

interface HistoryPayload {
  history: HistoryItem[];
  startedAt: string | null;
  closedAt: string | null;
}

interface InfoMessage {
  id: number;
  kind: 'CHAT' | 'INFO';
  body: string | null;
  senderName: string | null;
  createdAt: string;
}

interface TicketLike {
  id: string;
  attachments?: TicketAttachment[];
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
}

interface Props<T extends TicketLike> {
  ticket: T;
  role?: string | null;
  onTicketChange: (ticket: T) => void;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administration',
  RESPONSABLE_ZONE: 'Responsable de zone',
  MANAGER: 'Gestionnaire',
  HSE: 'HSE',
  INTERVENANT: 'Intervenant',
  RESIDENT: 'Résident',
};

const INFO_ROLES = ['ADMIN', 'MANAGER', 'RESPONSABLE_ZONE'];

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const describe = (item: HistoryItem) => {
  switch (item.action) {
    case 'CREATED':
      return 'Ticket créé';
    case 'STATUS_CHANGED':
      return `Statut : ${item.fromStatus || '—'} → ${item.toStatus || '—'}`;
    case 'ASSIGNED':
      return item.note || 'Affectation modifiée';
    case 'INFO_MESSAGE':
      return 'Information envoyée au résident';
    case 'ATTACHMENT_ADDED':
      return item.note || 'Pièce(s) jointe(s) ajoutée(s)';
    default:
      return item.action;
  }
};

const token = () => sessionStorage.getItem('token') || '';

// Attachments (4 files / 10 Mo), processing history and information messages
// of one ticket, shown in the staff "Actions ticket" modal.
export default function TicketDetailsPanel<T extends TicketLike>({ ticket, role, onTicketChange }: Props<T>) {
  const uploadsBaseUrl = API_URL.replace(/\/api\/?$/, '');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [infos, setInfos] = useState<InfoMessage[]>([]);
  const [infoText, setInfoText] = useState('');
  const [sendingInfo, setSendingInfo] = useState(false);
  const canSendInfo = INFO_ROLES.includes(String(role || ''));

  const attachments: TicketAttachment[] = ticket.attachments?.length
    ? ticket.attachments
    : ticket.attachmentUrl
      ? [{ id: 'legacy', url: ticket.attachmentUrl, name: ticket.attachmentName, type: ticket.attachmentType, size: ticket.attachmentSize || 0 }]
      : [];
  const usedBytes = attachments.reduce((sum, a) => sum + (a.size || 0), 0);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/maintenance/${ticket.id}/history`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setHistory(await res.json());
    } catch {
      /* the panel stays usable without the timeline */
    }
  }, [ticket.id]);

  const loadInfos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/messages/ticket/${ticket.id}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const all: InfoMessage[] = await res.json();
        setInfos(all.filter((m) => m.kind === 'INFO'));
      }
    } catch {
      /* ignore */
    }
  }, [ticket.id]);

  useEffect(() => {
    setFiles([]);
    setInfoText('');
    setHistory(null);
    setInfos([]);
    loadHistory();
    loadInfos();
  }, [ticket.id, loadHistory, loadInfos]);

  const pickFiles = (picked: FileList | null) => {
    const list = Array.from(picked || []);
    if (list.length + attachments.length > MAX_FILES) {
      alert(`${MAX_FILES} pièces jointes maximum par ticket (${attachments.length} déjà enregistrée(s)).`);
      return;
    }
    const total = list.reduce((sum, f) => sum + f.size, 0) + usedBytes;
    if (total > MAX_TOTAL_BYTES) {
      alert('Les pièces jointes ne doivent pas dépasser 10 Mo au total.');
      return;
    }
    setFiles(list);
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const res = await fetch(`${API_URL}/maintenance/${ticket.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Upload impossible');
        return;
      }
      const fresh = await fetch(`${API_URL}/maintenance/${ticket.id}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (fresh.ok) onTicketChange({ ...ticket, ...(await fresh.json()) });
      setFiles([]);
      loadHistory();
    } catch {
      alert('Erreur technique');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachment: TicketAttachment) => {
    if (typeof attachment.id !== 'number') return; // legacy single file has no row to delete
    if (!confirm(`Supprimer « ${attachment.name || 'cette pièce jointe'} » ?`)) return;
    try {
      const res = await fetch(`${API_URL}/maintenance/${ticket.id}/attachments/${attachment.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json?.error || 'Suppression impossible');
        return;
      }
      onTicketChange({ ...ticket, attachments: attachments.filter((a) => a.id !== attachment.id) });
    } catch {
      alert('Erreur technique');
    }
  };

  const sendInfo = async () => {
    const body = infoText.trim();
    if (!body) return;
    setSendingInfo(true);
    try {
      const res = await fetch(`${API_URL}/messages/ticket/${ticket.id}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Impossible d'envoyer l'information");
        return;
      }
      setInfoText('');
      loadInfos();
      loadHistory();
    } catch {
      alert('Erreur technique');
    } finally {
      setSendingInfo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Pièces jointes</div>
          <div className="text-xs text-slate-500">
            {attachments.length}/{MAX_FILES} · {formatBytes(usedBytes)} / 10 Mo
          </div>
        </div>

        {attachments.length === 0 ? (
          <p className="text-xs text-slate-400">Aucune pièce jointe.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <a
                  href={`${uploadsBaseUrl}${a.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-sm font-medium text-brand-amber hover:underline"
                >
                  {a.name || a.url.split('/').pop()}
                </a>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  <span>{formatBytes(a.size || 0)}</span>
                  {typeof a.id === 'number' && (
                    <button onClick={() => removeAttachment(a)} className="text-red-500 hover:text-red-700">
                      Supprimer
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {attachments.length < MAX_FILES && (
          <div className="space-y-2">
            <input
              type="file"
              multiple
              accept={ACCEPT}
              onChange={(e) => {
                pickFiles(e.target.files);
                e.target.value = '';
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {files.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {files.length} fichier(s) · {formatBytes(files.reduce((s, f) => s + f.size, 0))}
                </span>
                <button
                  onClick={upload}
                  disabled={uploading}
                  className="rounded-lg bg-brand-amber px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
                >
                  {uploading ? 'Envoi…' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-900">Historique du traitement</div>
        {history && (history.startedAt || history.closedAt) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span>Début du traitement : <b>{history.startedAt ? fmtDateTime(history.startedAt) : '—'}</b></span>
            <span>Fin : <b>{history.closedAt ? fmtDateTime(history.closedAt) : '—'}</b></span>
          </div>
        )}
        {!history ? (
          <p className="text-xs text-slate-400">Chargement…</p>
        ) : (
          <ol className="space-y-3 border-l border-slate-200 pl-4">
            {history.history.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-amber" />
                <p className="text-sm text-slate-800">{describe(item)}</p>
                <p className="text-xs text-slate-500">
                  {fmtDateTime(item.createdAt)}
                  {(item.actorName || item.actorRole) && (
                    <> · {item.actorName || ROLE_LABEL[item.actorRole || ''] || item.actorRole}</>
                  )}
                </p>
                {item.action === 'INFO_MESSAGE' && item.note && (
                  <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{item.note}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {canSendInfo && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Information au résident</div>
          <p className="text-xs text-slate-500">
            Message affiché dans le détail du ticket sur l&apos;application du résident (ex. une intervention du gestionnaire est nécessaire).
          </p>
          {infos.length > 0 && (
            <ul className="space-y-2">
              {infos.map((m) => (
                <li key={m.id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {m.body}
                  <span className="mt-1 block text-[11px] text-amber-700">
                    {fmtDateTime(m.createdAt)}{m.senderName ? ` · ${m.senderName}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <textarea
            value={infoText}
            onChange={(e) => setInfoText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Ex. Le gestionnaire passera demain matin pour vérifier l'installation."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={sendInfo}
              disabled={sendingInfo || !infoText.trim()}
              className="rounded-lg bg-brand-amber px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
            >
              {sendingInfo ? 'Envoi…' : "Envoyer l'information"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
