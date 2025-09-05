"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { HERO_PANELS, HeroPanel } from '../../config/heroPanels';
import './hero.css';

// Panels enhanced with runtime background resolution & load state
interface RuntimePanel extends HeroPanel { _resolved: string; _failed?: boolean; }
const pickVariant = (panel: HeroPanel, vw: number): string => {
  if (!panel.variants || panel.variants.length === 0) return panel.bg;
  // choose smallest variant whose width >= vw, else largest
  const sorted = [...panel.variants].sort((a,b)=>a.width-b.width);
  for (const v of sorted) {
    if (v.width >= vw) return v.webp || v.jpg || panel.bg;
  }
  return sorted[sorted.length - 1].webp || sorted[sorted.length - 1].jpg || panel.bg;
};

const enhance = (panel: HeroPanel): RuntimePanel => ({ ...panel, _resolved: panel.bg });
const PANELS: RuntimePanel[] = HERO_PANELS.map(enhance);

export function HeroDynamic() {
  const [active, setActive] = useState<number>(0);
  const autoRotateRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  // Touch gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDragging = useRef(false);
  // Mouse drag refs
  const mouseStartX = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);
  const mouseDragging = useRef(false);
  const [dragging, setDragging] = useState(false);

  // (Removed fade previous logic since we now slide horizontally)

  const stopAuto = useCallback(() => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    if (autoRotateRef.current) return;
    autoRotateRef.current = window.setInterval(() => {
      setActive(a => (a + 1) % PANELS.length);
  }, 5000); // 5s interval as requested
  }, []);

  const recomputeActiveVariant = useCallback(() => {
    const vw = window.innerWidth || 1920;
    PANELS.forEach((rp, idx) => {
      const base = HERO_PANELS[idx];
      const chosen = pickVariant(base, vw);
      rp._resolved = chosen;
    });
  }, []);

  const onSelect = (i: number) => {
    if (i === active) return;
    setActive(i);
    userInteractedRef.current = true;
    stopAuto();
  };

  // Keyboard arrow navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelect((active + 1) % PANELS.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelect((active - 1 + PANELS.length) % PANELS.length);
    }
  };

  // Preload images (lightweight hint)
  useEffect(() => {
    // Initial variant resolution + resize listener
    recomputeActiveVariant();
    const handler = () => recomputeActiveVariant();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [recomputeActiveVariant]);

  // Preload only adjacent slides instead of all (reduces aborted fetch noise)
  useEffect(() => {
    const preload = (index: number) => {
      if (index < 0 || index >= PANELS.length) return;
      const img = new window.Image();
      img.src = PANELS[index]._resolved;
    };
    preload((active + 1) % PANELS.length);
    preload((active - 1 + PANELS.length) % PANELS.length);
  }, [active]);

  // Auto-rotation enabled (stops permanently after any manual user switch)
  useEffect(() => { startAuto(); return stopAuto; }, [startAuto, stopAuto]);

  // Touch handlers (basic horizontal swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // ignore multi-touch
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchDragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging.current || touchStartX.current == null || touchStartY.current == null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    // If horizontal intent stronger and some distance, optionally prevent vertical scroll bounce
    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragging.current || touchStartX.current == null || touchStartY.current == null) return;
    const changed = e.changedTouches[0];
    const dx = changed.clientX - touchStartX.current;
    const dy = changed.clientY - touchStartY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 48; // swipe distance
    if (absX > threshold && absX > absY) {
      if (dx < 0) {
        // swipe left -> next
        onSelect((active + 1) % PANELS.length);
      } else if (dx > 0) {
        onSelect((active - 1 + PANELS.length) % PANELS.length);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDragging.current = false;
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left button
    // ignore if starting from interactive element (buttons/tabs)
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
    mouseDragging.current = true;
    setDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!mouseDragging.current || mouseStartX.current == null || mouseStartY.current == null) return;
    const dx = e.clientX - mouseStartX.current;
    const dy = e.clientY - mouseStartY.current;
    // If horizontal movement dominates we can prevent accidental text selection
    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  };
  const finishMouseDrag = (e: React.MouseEvent) => {
    if (!mouseDragging.current || mouseStartX.current == null || mouseStartY.current == null) { setDragging(false); return; }
    const dx = e.clientX - mouseStartX.current;
    const dy = e.clientY - mouseStartY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 48;
    if (absX > threshold && absX > absY) {
      if (dx < 0) {
        onSelect((active + 1) % PANELS.length);
      } else if (dx > 0) {
        onSelect((active - 1 + PANELS.length) % PANELS.length);
      }
    }
    mouseStartX.current = null;
    mouseStartY.current = null;
    mouseDragging.current = false;
    setDragging(false);
  };

  // Use class-based transforms (no inline style): see hero.css .hero-bg-slider.active-X rules
  const sliderClass = `hero-bg-slider active-${active} ${dragging ? 'is-dragging' : ''}`;

  return (
    <section
      className={`hero-dynamic ${dragging ? 'is-dragging' : ''}`}
      aria-label="Paragliding platform highlights"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finishMouseDrag}
      onMouseLeave={finishMouseDrag}
    >
      <div className="hero-bg-stack" aria-hidden>
  <div className={sliderClass} data-active={active}>
          {PANELS.map((p, i) => (
            <div className="hero-slide" key={p.id}>
              <Image
                src={p._resolved}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                // We manually manage responsive variants, so disable Next.js optimizer to avoid AbortError noise
                unoptimized
                className="hero-bg-img"
                onError={(e) => {
                  const fallback = HERO_PANELS[i].fallbackBg;
                  if (fallback && PANELS[i]._resolved !== fallback) {
                    PANELS[i]._resolved = fallback;
                    (e.target as HTMLImageElement).src = fallback;
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <h1>{PANELS[active].title}</h1>
          <p>{PANELS[active].desc}</p>
          {PANELS[active].ctas && (
            <div className="hero-ctas">
              {PANELS[active].ctas!.map((c, idx) => (
                <a
                  key={idx}
                  href={c.href}
                  className={`btn ${c.variant === 'primary' ? 'btn-primary' : ''}`}
                  aria-label={c.ariaLabel || c.label}
                >
                  {c.label}
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Floating thumbnail switcher (bottom-right) */}
        <div className="hero-thumbs" role="list" aria-label="Quick section preview thumbnails">
          {PANELS.map((p, i) => (
            <button
              key={p.id + '-thumb'}
              role="listitem"
              aria-label={p.title}
              aria-current={i === active ? 'true' : undefined}
              className={`hero-thumb ${i === active ? 'is-active' : ''}`}
              onClick={() => onSelect(i)}
            >
              { (p.thumbWebp || p.thumb) && (
                <picture>
                  {p.thumbWebp && <source srcSet={p.thumbWebp} type="image/webp" />}
                  {p.thumb && <img src={p.thumb} alt={p.title} loading="lazy" />}
                </picture>
              )}
              {i === active && <span className="hero-thumb-indicator" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
