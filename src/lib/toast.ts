// Lightweight toast event bus + helpers.
// - toast.emit: dispatches a global CustomEvent consumed by the UI Toaster
// - toast.once: deduplicates the same toast key within a TTL (sessionStorage)
// - toast.flashSet/flashConsume: pass a one-time toast across a redirect
export type ToastType = 'success' | 'error' | 'info';

const BUS_EVENT = 'app_toast_event';

type ToastEventDetail = {
  type: ToastType;
  message: string;
};

export const toast = {
  success(message: string) {
    this.emit('success', message);
  },
  error(message: string) {
    this.emit('error', message);
  },
  info(message: string) {
    this.emit('info', message);
  },
  /**
   * Show a toast only once for a given key within optional TTL (ms).
   * Uses sessionStorage so it resets after the tab is closed.
   * Example: toast.once('auth_signed_in', 'success', 'ავტორიზაცია წარმატებულია', 10_000)
   */
  once(key: string, type: ToastType, message: string, ttlMs: number = 10_000) {
    if (typeof window === 'undefined') return;
    try {
      const now = Date.now();
      const raw = sessionStorage.getItem('toast_once');
      const store = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const last = store[key] || 0;
      if (!last || now - last > ttlMs) {
        store[key] = now;
        sessionStorage.setItem('toast_once', JSON.stringify(store));
        this.emit(type, message);
      }
    } catch {
      // Fallback: emit directly
      this.emit(type, message);
    }
  },
  /**
   * Flash helpers: set/read one-time messages across redirects using sessionStorage.
   * Usage: call flashSet before redirect, then flashConsume on the landing page.
   */
  flashSet(type: ToastType, message: string) {
    if (typeof window === 'undefined') return;
    try { sessionStorage.setItem('toast_flash', JSON.stringify({ type, message })); } catch {}
  },
  flashConsume() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('toast_flash');
      if (!raw) return null;
      sessionStorage.removeItem('toast_flash');
      const { type, message } = JSON.parse(raw) as { type: ToastType; message: string };
      this.emit(type, message);
      return { type, message };
    } catch { return null; }
  },
  emit(type: ToastType, message: string) {
    if (typeof window === 'undefined') return;
    const detail: ToastEventDetail = { type, message };
    window.dispatchEvent(new CustomEvent(BUS_EVENT, { detail }));
  },
  EVENT: BUS_EVENT,
} as const;

export type { ToastEventDetail };
