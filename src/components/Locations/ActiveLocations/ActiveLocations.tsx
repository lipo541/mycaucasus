"use client";

import { LOCATIONS } from "@/config/locations";
import Image from "next/image";
import Link from "next/link";
import styles from "./ActiveLocations.module.css";

interface ActiveLocationsProps {
  /** Optional: exclude a specific location by id (e.g., current page location) */
  excludeId?: string;
}

export default function ActiveLocations({ excludeId }: ActiveLocationsProps) {
  // Filter out current location if excludeId is provided
  const visibleLocations = LOCATIONS.locations.filter(
    (loc) => loc.id !== excludeId
  );

  if (visibleLocations.length === 0) {
    return null; // Don't render section if no locations to show
  }

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>აქტიური ლოკაციები</h2>
          <p className={styles.subtitle}>
            აირჩიე ლოკაცია და იხილე ფრენის შესაძლებლობები
          </p>
        </header>

        <div className={styles.grid}>
          {visibleLocations.map((loc) => {
            const card = loc.card;
            return (
              <Link key={loc.id} href={loc.href} className={styles.card}>
                <div className={styles.cardThumb}>
                  <picture>
                    {card.thumbnailWebp && (
                      <source srcSet={card.thumbnailWebp} type="image/webp" />
                    )}
                    <Image
                      src={card.thumbnail}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={styles.cardImg}
                    />
                  </picture>
                  <div className={styles.cardOverlay} />
                  <div
                    className={styles.statusBadge}
                    data-active={card.active}
                    aria-label={card.active ? "აქტიური ახლა" : "დაკეტილია"}
                  >
                    <span className={styles.statusDot} />
                    <span className={styles.statusLabel}>
                      {card.active ? "active now" : "დაკეტილია"}
                    </span>
                  </div>
                </div>{" "}
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {card.name}
                      <span className={styles.pin} aria-hidden>
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          className={styles.pinSvg}
                        >
                          <path
                            fill="currentColor"
                            d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6zm0 8.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 5.5 12 5.5s2.5 1.12 2.5 2.5S13.38 10.5 12 10.5z"
                          />
                        </svg>
                      </span>
                    </h3>
                    {card.region && (
                      <span className={styles.cardRegion}>{card.region}</span>
                    )}
                  </div>
                  <p className={styles.cardTagline}>{card.tagline}</p>

                  <div className={styles.cardMeta}>
                    {card.altitude && (
                      <span className={styles.metaItem}>
                        <span className={styles.metaIcon} aria-hidden>
                          ⛰
                        </span>
                        {card.altitude}მ
                      </span>
                    )}
                    <button
                      className={styles.bookBtn}
                      data-active={card.active}
                      aria-label="დაჯავშნე"
                    >
                      დაჯავშნე
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
