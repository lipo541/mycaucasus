"use client";

import { useLocation } from "@/components/Locations/LocationContext";
import { LOCATIONS } from "@/config/locations";
import Image from "next/image";
import styles from "./locationshero.module.css";

interface LocationsHeroProps {
  /** Location ID to display (defaults to first location if not provided) */
  locationId?: string;
}

export default function LocationsHero({ locationId }: LocationsHeroProps) {
  // Try to get location from Context first (dynamic from database)
  let contextLocation;
  try {
    const ctx = useLocation();
    contextLocation = ctx.location;
  } catch {
    // No context provider, use static config
    contextLocation = null;
  }

  // Fallback to static LOCATIONS config if no context
  const location =
    contextLocation ||
    (locationId
      ? LOCATIONS.locations.find((loc) => loc.id === locationId)
      : LOCATIONS.locations[0]);

  if (!location) {
    return null; // No location found
  }

  const hero = location.hero;

  return (
    <section className={styles.root} aria-labelledby="locations-hero-title">
      <div className={styles.bgStack} aria-hidden>
        <Image
          src={hero.bg}
          alt={hero.headline}
          fill
          priority
          sizes="100vw"
          className={styles.bgImg}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.text}>
          <h1 id="locations-hero-title" className={styles.headline}>
            {hero.headline}
            {hero.pin && (
              <span className={styles.pin} aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  className={styles.pinSvg}
                >
                  <path
                    fill="currentColor"
                    d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6zm0 8.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 5.5 12 5.5s2.5 1.12 2.5 2.5S13.38 10.5 12 10.5z"
                  />
                </svg>
              </span>
            )}
          </h1>
          {hero.tagline && <p>{hero.tagline}</p>}
          {/* Overlay content */}
          {hero.overlayTitle && (
            <h2 className={styles.overlayTitle}>{hero.overlayTitle}</h2>
          )}
          {hero.overlayDesc && (
            <p className={styles.overlayDesc}>{hero.overlayDesc}</p>
          )}
          {hero.points && hero.points.length > 0 && (
            <ul className={styles.points}>
              {hero.points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          )}
          {hero.flyTypes && hero.flyTypes.length > 0 && (
            <div className={styles.pricing}>
              {hero.flyTypes.map((ft) => (
                <div key={ft.id} className={styles.priceCard}>
                  <div className={styles.priceName}>{ft.name}</div>
                  <div className={styles.priceValue}>₾{ft.price}</div>
                </div>
              ))}
            </div>
          )}
          {hero.meta && hero.meta.length > 0 && (
            <div className={styles.meta}>
              {hero.meta.map((m) => (
                <div key={m.label} className={styles.metaItem}>
                  <span className={styles.metaLabel}>{m.label}</span>
                  <strong className={styles.metaValue}>{m.value}</strong>
                </div>
              ))}
            </div>
          )}
          {hero.ctas && (
            <div className={styles.actions}>
              {hero.ctas.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className={`${styles.btn} ${
                    c.variant ? styles["btn-" + c.variant] : ""
                  }`}
                >
                  {c.icon === "heart" && (
                    <span className={styles.iconHeart} aria-hidden>
                      ♡
                    </span>
                  )}
                  {c.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
