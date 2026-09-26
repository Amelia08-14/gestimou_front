// The API sends timestamps as UTC instants (ISO, "...Z"). They are always shown
// in the company's time zone, not the viewer's device zone: a browser or PC set
// to another zone (or a VPN) would otherwise shift every hour on screen.
export const APP_TIME_ZONE = 'Africa/Algiers';

const toDate = (value: string | number | Date | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value: string | number | Date | null | undefined) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString('fr-FR', { timeZone: APP_TIME_ZONE }) : '';
};

export const formatTime = (value: string | number | Date | null | undefined) => {
  const d = toDate(value);
  return d ? d.toLocaleTimeString('fr-FR', { timeZone: APP_TIME_ZONE, hour: '2-digit', minute: '2-digit' }) : '';
};

export const formatDateTime = (value: string | number | Date | null | undefined) => {
  const d = toDate(value);
  return d
    ? d.toLocaleString('fr-FR', {
        timeZone: APP_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
};

// Calendar day ("YYYY-MM-DD") of an instant in the company's time zone, to
// compare with <input type="date"> values.
export const dayKey = (value: string | number | Date | null | undefined) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString('en-CA', { timeZone: APP_TIME_ZONE }) : '';
};
