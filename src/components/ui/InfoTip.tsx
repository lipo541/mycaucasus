"use client";
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AiOutlineExclamationCircle } from 'react-icons/ai';

type Props = {
  text: string;
  ariaLabel?: string;
  success?: boolean;
  error?: boolean;
  forceOpen?: boolean; // programmatically keep tooltip open (e.g., on validation error)
};

export function InfoTip({ text, ariaLabel = 'მინიშნება', success = false, error = false, forceOpen = false }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const BUBBLE_WIDTH = 260; // keep in sync with CSS
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  const clearHide = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = (delay = 150) => {
    clearHide();
    hideTimer.current = window.setTimeout(() => {
      if (!forceOpen) setOpen(false);
    }, delay);
  };

  const updatePosition = useCallback((force?: 'top' | 'bottom') => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let left = rect.right - BUBBLE_WIDTH; // align right edges
    let top: number;
    const which = force || placement;
    if (which === 'bottom') {
      top = rect.bottom + 6;
    } else {
      const h = bubbleRef.current?.offsetHeight ?? 120;
      top = rect.top - h - 6;
      if (top < margin) top = margin;
    }
    const maxLeft = window.innerWidth - BUBBLE_WIDTH - margin;
    if (left < margin) left = margin;
    if (left > maxLeft) left = maxLeft;
    setCoords({ top, left });
  }, [BUBBLE_WIDTH, placement]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveOpen = open || forceOpen;

  useEffect(() => {
    if (!effectiveOpen) return;
    updatePosition();
    const onScroll = () => {
      if (rafId.current != null) return;
      rafId.current = window.requestAnimationFrame(() => {
        updatePosition();
        rafId.current = null;
      });
    };
    const onResize = () => updatePosition();
    // Use non-capturing, passive scroll listener to avoid intercepting inner container scrolls
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    window.addEventListener('resize', onResize);
    return () => {
      if (rafId.current != null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
      window.removeEventListener('scroll', onScroll as any);
      window.removeEventListener('resize', onResize);
    };
  }, [effectiveOpen, updatePosition]);

  // After bubble renders, check for overflow and flip if needed
  useEffect(() => {
  if (!effectiveOpen || !coords) return;
    const margin = 8;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;
    const overflowBottom = rect.bottom > window.innerHeight - margin;
    const overflowTop = rect.top < margin;
    if (placement === 'bottom' && overflowBottom) {
      setPlacement('top');
      updatePosition('top');
    } else if (placement === 'top' && overflowTop) {
      setPlacement('bottom');
      updatePosition('bottom');
    }
  }, [effectiveOpen, coords, placement, updatePosition]);
  useEffect(() => () => clearHide(), []);

  return (
    <span className={`info-tip ${effectiveOpen ? 'info-tip--open' : ''} ${success ? 'info-tip--success' : ''} ${error ? 'info-tip--error' : ''}`}>
      <button
        ref={btnRef}
        type="button"
        className="info-tip__btn"
        aria-label={ariaLabel}
        aria-expanded={effectiveOpen}
        aria-controls={id}
        onMouseEnter={() => { clearHide(); setOpen(true); }}
        onMouseLeave={() => scheduleHide()}
        onFocus={() => { clearHide(); setOpen(true); }}
        onBlur={() => scheduleHide()}
        onClick={() => setOpen(v => !v)}
      >
        <AiOutlineExclamationCircle className="info-tip__icon" aria-hidden="true" />
      </button>
    {mounted && effectiveOpen && coords && typeof document !== 'undefined' && createPortal(
        <span
          id={id}
          role="tooltip"
          className="info-tip__bubble"
      ref={bubbleRef}
          onMouseEnter={() => { clearHide(); setOpen(true); }}
          onMouseLeave={() => scheduleHide()}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: BUBBLE_WIDTH, opacity: 1, pointerEvents: 'auto', transform: 'none' }}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}
