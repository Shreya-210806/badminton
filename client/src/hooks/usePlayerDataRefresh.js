import { useEffect } from 'react';

export const notifyPlayerDataChanged = () => {
  window.dispatchEvent(new Event('player-data-updated'));
};

export default function usePlayerDataRefresh(refresh, intervalMs = 15000) {
  useEffect(() => {
    let requestInFlight = false;
    const refreshVisiblePage = async () => {
      if (requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;
      try {
        await refresh();
      } finally {
        requestInFlight = false;
      }
    };

    refreshVisiblePage();
    window.addEventListener('focus', refreshVisiblePage);
    window.addEventListener('player-data-updated', refreshVisiblePage);
    const intervalId = window.setInterval(refreshVisiblePage, intervalMs);

    return () => {
      window.removeEventListener('focus', refreshVisiblePage);
      window.removeEventListener('player-data-updated', refreshVisiblePage);
      window.clearInterval(intervalId);
    };
  }, [intervalMs, refresh]);
}
