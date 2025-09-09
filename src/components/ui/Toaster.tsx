"use client";
import { useEffect, useState } from 'react';
import { toast as toastBus, type ToastEventDetail } from '../../lib/toast';

type Item = ToastEventDetail & { id: number };

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let id = 0;
    const onEvt = (e: Event) => {
      const detail = (e as CustomEvent<ToastEventDetail>).detail;
      if (!detail) return;
      const next: Item = { id: ++id, ...detail };
      setItems(prev => [...prev, next]);
      // auto-remove after 3s
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== next.id));
      }, 3000);
    };
    window.addEventListener(toastBus.EVENT, onEvt as EventListener);
    return () => window.removeEventListener(toastBus.EVENT, onEvt as EventListener);
  }, []);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="true">
      {items.map(i => (
        <div key={i.id} className={`toast toast--${i.type}`} role="status">
          <span className="toast__icon" aria-hidden="true">
            {i.type === 'success' ? '✓' : i.type === 'error' ? '⚠' : 'ℹ'}
          </span>
          <span className="toast__msg">{i.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
