import { useCallback, useEffect, useRef } from 'react';
import { searchApplications } from '../api/applicationsApi';
import type { ApplicationFilterValues, ApplicationSummary } from '../api/applicationTypes';
import { useToast } from './useToast';

// How often the open board asks the API whether something changed.
const CHECK_EVERY_MS = 30_000;
// One id, so the "updates" toast is never shown twice.
const TOAST_ID = 'board-updates';

// What the board shows, reduced to what matters for "did anything change": which cards exist,
// in which column, and when each one was last edited.
function signature(list: ApplicationSummary[]): string {
  return list
    .map((app) => `${app.id}:${app.stage}:${app.updatedAt}`)
    .sort()
    .join('|');
}

// Tells the user when the applications changed somewhere else (the extension, another tab).
// While the tab is visible it checks every 30 seconds and when the tab gets focus again; a
// hidden tab is never checked. The board's own changes (drag and drop, add) must call
// markLocalChange, so a check that started before them is thrown away instead of reported.
export function useBoardUpdates(
  filters: ApplicationFilterValues,
  shown: ApplicationSummary[],
  onRefresh: () => void,
) {
  const { showToast, dismissToast } = useToast();
  const shownRef = useRef(shown);
  const onRefreshRef = useRef(onRefresh);
  const localChanges = useRef(0);
  const checking = useRef(false);
  const filterKey = JSON.stringify(filters);

  // The checks read the latest list and callback, without restarting the timer on every render.
  useEffect(() => {
    shownRef.current = shown;
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    let stopped = false;

    async function check() {
      if (document.visibilityState !== 'visible' || checking.current) return;

      checking.current = true;
      const changesBefore = localChanges.current;
      try {
        const latest = await searchApplications(JSON.parse(filterKey) as ApplicationFilterValues);
        const changedHere = changesBefore !== localChanges.current;

        if (!stopped && !changedHere && signature(latest) !== signature(shownRef.current)) {
          showToast({
            id: TOAST_ID,
            kind: 'info',
            message: 'New updates available.',
            persistent: true,
            action: { label: 'Refresh', onClick: () => onRefreshRef.current() },
          });
        }
      } catch {
        // A failed check shows nothing; the next one tries again.
      } finally {
        checking.current = false;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        check();
      }
    }

    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [filterKey, showToast]);

  // Leaving the board closes the notice: it is about this page only.
  useEffect(() => () => dismissToast(TOAST_ID), [dismissToast]);

  const markLocalChange = useCallback(() => {
    localChanges.current += 1;
  }, []);

  // Called after the board loads again (Refresh, new filters): what it shows is current now.
  const clearNotice = useCallback(() => dismissToast(TOAST_ID), [dismissToast]);

  return { markLocalChange, clearNotice };
}
