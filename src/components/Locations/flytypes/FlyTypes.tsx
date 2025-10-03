"use client";

import { LOCATIONS } from "@/config/locations";
import styles from "./FlyTypes.module.css";

interface FlyTypesProps {
  locationId?: string;
}

export default function FlyTypes({ locationId = "gudauri" }: FlyTypesProps) {
  // Get location data
  const location = LOCATIONS.locations.find((loc) => loc.id === locationId);
  const flyTypes = location?.hero.flyTypes || [];

  // If no fly types, don't render
  if (flyTypes.length === 0) {
    return null;
  }

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>ფრენის ტიპები</h2>
          {/* <p className={styles.subtitle}>აირჩიე შენთვის შესაფერისი ფრენა</p> */}
        </header>

        <div className={styles.grid}>
          {flyTypes.map((type) => (
            <div
              key={type.id}
              className={`${styles.card} ${
                type.recommended ? styles.recommended : ""
              }`}
            >
              {type.recommended && (
                <div className={styles.badge}>პოპულარული</div>
              )}

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{type.name}</h3>
                  <p className={styles.duration}>{type.duration}</p>
                </div>

                <div className={styles.priceSection}>
                  <span className={styles.price}>₾{type.price}</span>
                  <span className={styles.priceLabel}>/ პირი</span>
                </div>

                <p className={styles.description}>{type.description}</p>

                <ul className={styles.features}>
                  {type.features.map((feature, index) => (
                    <li key={index} className={styles.feature}>
                      <span className={styles.checkmark}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`${styles.bookBtn} ${
                  type.recommended ? styles.recommended : ""
                }`}
              >
                დაჯავშნე ახლავე
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
