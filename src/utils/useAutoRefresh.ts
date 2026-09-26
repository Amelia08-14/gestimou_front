import { useEffect, useRef } from 'react';

// Calls `refresh` every `intervalMs` while the tab is visible, and again when
// the user comes back to the tab (focus / visibility), at most once per
// MIN_GAP_MS. A hidden tab never polls.
const MIN_GAP_MS = 5000;

export function useAutoRefresh(refresh: () => void | Promise<unknown>, intervalMs = 30000) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    let lastRun = Date.now();

    const run = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRun < MIN_GAP_MS) return;
      lastRun = now;
      void latest.current();
    };

    const timer = window.setInterval(run, intervalMs);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('focus', run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('focus', run);
    };
  }, [intervalMs]);
}
