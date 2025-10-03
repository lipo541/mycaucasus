"use client";

import { useLocation } from "@/components/Locations/LocationContext";
import { LOCATIONS } from "@/config/locations";
import { useState } from "react";
import styles from "./LocationDetails.module.css";

interface LocationDetailsProps {
  locationId?: string;
}

export default function LocationDetails({
  locationId = "gudauri",
}: LocationDetailsProps) {
  const [openSections, setOpenSections] = useState<number[]>([]);
  const [showTips, setShowTips] = useState(false);

  // Try to get location from Context first
  let contextLocation;
  try {
    const ctx = useLocation();
    contextLocation = ctx.location;
  } catch {
    contextLocation = null;
  }

  // Get location data
  const location =
    contextLocation || LOCATIONS.locations.find((loc) => loc.id === locationId);
  const info = location?.info || location?.hero?.locationInfo;

  // If no location info, don't render
  if (!info) {
    return null;
  }

  const toggleSection = (index: number) => {
    setOpenSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        {/* Title and Intro */}
        <header className={styles.header}>
          <h2 className={styles.title}>{info.title}</h2>
          <p className={styles.intro}>{info.intro}</p>
        </header>

        {/* Highlights */}
        {info.highlights && info.highlights.length > 0 && (
          <div className={styles.highlights}>
            {info.highlights.map((highlight, index) => (
              <div key={index} className={styles.highlightCard}>
                <div className={styles.highlightTitle}>{highlight.title}</div>
                <div className={styles.highlightValue}>{highlight.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sections - Accordion */}
        {info.sections && info.sections.length > 0 && (
          <div className={styles.sections}>
            {info.sections.map((section, index) => (
              <div
                key={index}
                className={`${styles.section} ${
                  openSections.includes(index) ? styles.sectionOpen : ""
                }`}
              >
                <button
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(index)}
                  aria-expanded={openSections.includes(index)}
                >
                  <h3 className={styles.sectionTitle}>{section.title}</h3>
                  <span className={styles.sectionIcon}>
                    {openSections.includes(index) ? "−" : "+"}
                  </span>
                </button>
                <div
                  className={`${styles.sectionContent} ${
                    openSections.includes(index) ? styles.contentVisible : ""
                  }`}
                >
                  <p>{section.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips - Collapsible */}
        {info.tips && info.tips.length > 0 && (
          <div className={styles.tips}>
            <button
              className={styles.tipsHeader}
              onClick={() => setShowTips(!showTips)}
              aria-expanded={showTips}
            >
              <h3 className={styles.tipsTitle}>რჩევები და რეკომენდაციები</h3>
              <span className={styles.tipsIcon}>{showTips ? "−" : "+"}</span>
            </button>
            <div
              className={`${styles.tipsContent} ${
                showTips ? styles.tipsVisible : ""
              }`}
            >
              <ul className={styles.tipsList}>
                {info.tips.map((tip, index) => (
                  <li key={index} className={styles.tip}>
                    <span className={styles.checkmark}>✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
