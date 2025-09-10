"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { HERO_PANELS } from '../../config/heroPanels';
// styles now provided via legacy-globals.css

// Directly use panels (single high-res bg; Next.js will create responsive variants)
const PANELS = HERO_PANELS;

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

  // No variant recomputation needed now

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
  // Removed variant resize effect

  // Preload only adjacent slides instead of all (reduces aborted fetch noise)
  // Optional: could preload next/prev with Image component priority tweaks; keeping simple

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
      aria-label="პარაგლაიდინგის პლატფორმის მთავარი შეთავაზებები"
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
                src={p.bg}
                alt={p.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="hero-bg-img"
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
  <div className="hero-thumbs" role="list" aria-label="სექციების სწრაფი წინასწარ ნახვის თუმბნეილები">
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
