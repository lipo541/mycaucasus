"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Panel {
  id: number;
  title: string;
  desc: string;
  bg: string;
}

const PANELS: Panel[] = [
  { id: 0, title: 'Tandem Flights', desc: 'Book scenic tandem experiences across the Caucasus ridgelines.', bg: '/assets/hero/wp4472199.jpg' },
  { id: 1, title: 'Licensing & Training', desc: 'Structured pilot progression, safety courses & certifications.', bg: '/assets/hero/wp4472199.jpg' },
  { id: 2, title: 'Community & Forum', desc: 'Connect with local & visiting pilots, plan group flights.', bg: '/assets/hero/wp4472199.jpg' },
];

export function HeroDynamic() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    if (prev === null) return;
    const timeout = setTimeout(() => setPrev(null), 650);
    return () => clearTimeout(timeout);
  }, [prev]);

  const onSelect = (i: number) => {
    if (i === active) return;
    setPrev(active);
    setActive(i);
  };

  return (
    <section className="hero-dynamic" aria-label="Paragliding platform highlights">
      <div className="hero-bg-stack" aria-hidden>
        {PANELS.map((p, i) => {
          const isActive = i === active;
          const wasActive = prev === i;
          return (
            <Image
              key={p.id + (wasActive ? '-prev' : '')}
              src={p.bg}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={`hero-bg-img ${isActive ? 'is-active' : ''} ${wasActive ? 'was-active' : ''}`}
            />
          );
        })}
      </div>
      <div className="hero-content">
        <div className="hero-tabs" role="tablist" aria-label="Sections">
          {PANELS.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === active}
              aria-controls={`hero-panel-${p.id}`}
              id={`hero-tab-${p.id}`}
              className={`hero-tab ${i === active ? 'is-active' : ''}`}
              onClick={() => onSelect(i)}
            >
              {p.title}
            </button>
          ))}
        </div>
        <div
          id={`hero-panel-${PANELS[active].id}`}
          role="tabpanel"
          aria-labelledby={`hero-tab-${PANELS[active].id}`}
          className="hero-text"
        >
          <h1>{PANELS[active].title}</h1>
          <p>{PANELS[active].desc}</p>
        </div>
      </div>
    </section>
  );
}
