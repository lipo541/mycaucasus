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
  emit(type: ToastType, message: string) {
    if (typeof window === 'undefined') return;
    const detail: ToastEventDetail = { type, message };
    window.dispatchEvent(new CustomEvent(BUS_EVENT, { detail }));
  },
  EVENT: BUS_EVENT,
} as const;

export type { ToastEventDetail };
