"use client";

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./ActiveLocations.module.css";

interface ActiveLocationsProps {
  /** Optional: exclude a specific location by id (e.g., current page location) */
  excludeId?: string;
}

interface LocationCard {
  id: string;
  href: string;
  card_name: string;
  card_region: string;
  card_tagline: string;
  card_thumbnail: string;
  card_thumbnail_webp: string;
  card_status: string;
  card_altitude: number;
  card_active: boolean;
}

export default function ActiveLocations({ excludeId }: ActiveLocationsProps) {
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.error("❌ Missing Supabase credentials");
          setLoading(false);
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
          .from("locations")
          .select(
            `
            id,
            href,
            card_thumbnail,
            card_thumbnail_webp,
            card_status,
            card_altitude,
            card_active,
            location_translations!inner (
              language_code,
              card_name,
              card_region,
              card_tagline
            )
          `
          )
          .eq("is_published", true)
          .eq("location_translations.language_code", "ka")
          .eq("card_active", true);

        if (error) {
          console.error("❌ Failed to fetch locations:", error);
          setLoading(false);
          return;
        }

        // Transform to flat structure
        const transformedLocations: LocationCard[] =
          data?.map((loc: any) => ({
            id: loc.id,
            href: loc.href,
            card_thumbnail: loc.card_thumbnail,
            card_thumbnail_webp: loc.card_thumbnail_webp,
            card_status: loc.card_status,
            card_altitude: loc.card_altitude,
            card_active: loc.card_active,
            card_name: loc.location_translations[0]?.card_name || "",
            card_region: loc.location_translations[0]?.card_region || "",
            card_tagline: loc.location_translations[0]?.card_tagline || "",
          })) || [];

        setLocations(transformedLocations);
      } catch (err) {
        console.error("❌ Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  // Filter out current location
  const visibleLocations = locations.filter((loc) => loc.id !== excludeId);

  if (loading) {
    return (
      <section className={styles.root}>
        <div className={styles.container}>
          <p style={{ textAlign: "center", padding: "2rem" }}>
            ⏳ ლოკაციების ჩატვირთვა...
          </p>
        </div>
      </section>
    );
  }

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
            return (
              <Link key={loc.id} href={loc.href} className={styles.card}>
                <div className={styles.cardThumb}>
                  <picture>
                    {loc.card_thumbnail_webp && (
                      <source
                        srcSet={loc.card_thumbnail_webp}
                        type="image/webp"
                      />
                    )}
                    <Image
                      src={loc.card_thumbnail}
                      alt={loc.card_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={styles.cardImg}
                    />
                  </picture>
                  <div className={styles.cardOverlay} />
                  <div
                    className={styles.statusBadge}
                    data-active={loc.card_active}
                    aria-label={loc.card_active ? "აქტიური ახლა" : "დაკეტილია"}
                  >
                    <span className={styles.statusDot} />
                    <span className={styles.statusLabel}>
                      {loc.card_active ? "active now" : "დაკეტილია"}
                    </span>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {loc.card_name}
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
                    {loc.card_region && (
                      <span className={styles.cardRegion}>
                        {loc.card_region}
                      </span>
                    )}
                  </div>
                  <p className={styles.cardTagline}>{loc.card_tagline}</p>

                  <div className={styles.cardMeta}>
                    {loc.card_altitude && (
                      <span className={styles.metaItem}>
                        <span className={styles.metaIcon} aria-hidden>
                          ⛰
                        </span>
                        {loc.card_altitude}მ
                      </span>
                    )}
                    <button
                      className={styles.bookBtn}
                      data-active={loc.card_active}
                      aria-label="დაჯავშნა"
                    >
                      დაჯავშნა
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
