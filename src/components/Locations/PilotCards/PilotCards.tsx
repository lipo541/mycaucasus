"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./PilotCards.module.css";

interface Pilot {
  id: string;
  name: string;
  avatar_signed_url?: string;
  rating?: number;
  experience_years?: number;
  flights_count?: number;
  date_of_birth?: string;
  pilot_kind?: string;
  tandem_certificate_status?: string;
}

function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function PilotCards() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPilots() {
      try {
        const res = await fetch("/api/register/pilot-basic", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to fetch pilots:", res.statusText);
          return;
        }

        const data = await res.json();

        const tandemPilots = (data.users || []).filter((user: any) => {
          const isTandem =
            user.pilot_kind === "tandem" ||
            user.role?.toLowerCase().includes("tandem");
          const isApproved = user.tandem_certificate_status === "approved";
          return isTandem && isApproved;
        });

        setPilots(tandemPilots);
      } catch (error) {
        console.error("Error fetching pilots:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPilots();
  }, []);

  if (loading) {
    return (
      <section className={styles.root}>
        <div className={styles.container}>
          <p className={styles.loading}>იტვირთება...</p>
        </div>
      </section>
    );
  }

  if (pilots.length === 0) {
    return (
      <section className={styles.root}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>ტანდემ პილოტები</h2>
            <p className={styles.subtitle}>
              გაეცანით ჩვენს გამოცდილ პროფესიონალებს
            </p>
          </header>
          <p className={styles.emptyState}>
            პილოტები ამჟამად არ არიან ხელმისაწვდომი
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>ტანდემ პილოტები</h2>
          <p className={styles.subtitle}>
            გაეცანით ჩვენს გამოცდილ პროფესიონალებს
          </p>
        </header>

        <div className={styles.grid}>
          {pilots.map((pilot) => {
            const age = calculateAge(pilot.date_of_birth);
            const rating = pilot.rating || 4.8;

            // Generate 5-star rating display
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

            return (
              <Link
                key={pilot.id}
                href={`/pilots/${pilot.id}`}
                className={styles.card}
              >
                <div className={styles.cardThumb}>
                  {pilot.avatar_signed_url ? (
                    <Image
                      src={pilot.avatar_signed_url}
                      alt={pilot.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={styles.cardImg}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {pilot.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.cardOverlay} />
                  <div
                    className={styles.statusBadge}
                    data-active="true"
                    aria-label="აქტიური ახლა"
                  >
                    <span className={styles.statusDot} />
                    <span className={styles.statusLabel}>active now</span>
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{pilot.name}</h3>
                    <div className={styles.cardRegion}>
                      <span className={styles.stars}>
                        {Array.from({ length: fullStars }).map((_, i) => (
                          <span key={`full-${i}`}>★</span>
                        ))}
                        {hasHalfStar && <span>★</span>}
                        {Array.from({ length: emptyStars }).map((_, i) => (
                          <span key={`empty-${i}`}>☆</span>
                        ))}
                      </span>
                      <span style={{ marginLeft: "0.35rem" }}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className={styles.cardTagline}>
                    {age && `${age} წელი`}
                    {age && pilot.experience_years && " • "}
                    {pilot.experience_years && `${pilot.experience_years} წლის გამოცდილება`}
                    {pilot.flights_count && ` • ${pilot.flights_count}+ ფრენა`}
                  </p>

                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <span className={styles.metaIcon} aria-hidden>
                        ✈️
                      </span>
                      ტანდემ პილოტი
                    </span>
                    <button
                      className={styles.bookBtn}
                      data-active="true"
                      aria-label="იხილეთ ვრცლად"
                    >
                      ვრცლად
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
