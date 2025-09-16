type MessagesPayload = { messages?: Array<any> | null; unread: number };

const EVENT_NAME = 'mc:messages';
const STORAGE_KEY = 'mc:messages';

export function emitMessagesUpdated(messages: Array<{ unread?: boolean }> = []) {
  const unread = messages.reduce((acc, m) => acc + (m?.unread ? 1 : 0), 0);
  // Same-tab broadcast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<MessagesPayload>(EVENT_NAME, { detail: { messages, unread } }));
    try {
      // Cross-tab broadcast (other tabs only receive the storage event)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), unread }));
    } catch {}
  }
}

export function onMessagesUpdated(handler: (payload: MessagesPayload) => void) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = (e: Event) => {
    const ce = e as CustomEvent<MessagesPayload>;
    if (ce?.detail) handler(ce.detail);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const data = JSON.parse(e.newValue) as { ts: number; unread: number };
      handler({ messages: null, unread: data.unread });
    } catch {}
  };
  window.addEventListener(EVENT_NAME, onCustom as EventListener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom as EventListener);
    window.removeEventListener('storage', onStorage);
  };
}
