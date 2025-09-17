import { VISIT_SESSION_KEY, VISIT_SENT_PREFIX, VISIT_TRACK_ENDPOINT } from './constants';
import type { VisitLogPayload } from './types';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sid = localStorage.getItem(VISIT_SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(VISIT_SESSION_KEY, sid);
  }
  return sid;
}

function alreadySent(path: string): boolean {
  if (typeof window === 'undefined') return true;
  return sessionStorage.getItem(VISIT_SENT_PREFIX + path) === '1';
}

function markSent(path: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(VISIT_SENT_PREFIX + path, '1');
}

export async function trackVisit(payload: VisitLogPayload) {
  if (typeof window === 'undefined') return;
  const path = payload.path || window.location.pathname;
  if (alreadySent(path)) return; // one per page load per session
  try {
    const sessionId = getOrCreateSessionId();
    await fetch(VISIT_TRACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
      body: JSON.stringify({ ...payload, path, ts: Date.now(), session_id: sessionId })
    });
    markSent(path);
  } catch (e) {
    // silent
  }
}

export function getSessionId() { return getOrCreateSessionId(); }
