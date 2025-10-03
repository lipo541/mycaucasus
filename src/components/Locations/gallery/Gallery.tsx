"use client";

import { LOCATIONS } from "@/config/locations";
import Image from "next/image";
import { useState } from "react";
import styles from "./Gallery.module.css";

interface GalleryProps {
  locationId?: string;
}

export default function Gallery({ locationId = "gudauri" }: GalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find the location by ID
  const location = LOCATIONS.locations.find((loc) => loc.id === locationId);
  const gallery = location?.hero.gallery || [];

  if (gallery.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % gallery.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  // Show first 6 images in preview
  const previewImages = gallery.slice(0, 6);

  return (
    <>
      <section className={styles.root}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>გალერეა</h2>
            {/* <p className={styles.subtitle}>ფოტოები ლოკაციიდან</p> */}
          </header>

          {/* Desktop: Bento Grid */}
          <div className={styles.desktopGrid}>
            {previewImages.map((image, index) => (
              <div
                key={index}
                className={`${styles.imageCard} ${
                  index === 0 ? styles.featured : ""
                }`}
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className={styles.image}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>

          {/* Mobile: Horizontal Scroll */}
          <div className={styles.mobileScroll}>
            {previewImages.map((image, index) => (
              <div
                key={index}
                className={styles.mobileCard}
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={280}
                  height={210}
                  className={styles.mobileImage}
                />
              </div>
            ))}
          </div>

          {gallery.length > 6 && (
            <div className={styles.viewAllWrapper}>
              <button
                className={styles.viewAllBtn}
                onClick={() => openLightbox(0)}
              >
                ყველა ნახვა ({gallery.length})
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button
            className={styles.closeBtn}
            onClick={closeLightbox}
            aria-label="დახურვა"
          >
            ✕
          </button>

          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="წინა"
          >
            ‹
          </button>

          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="შემდეგი"
          >
            ›
          </button>

          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={gallery[currentIndex].src}
              alt={gallery[currentIndex].alt}
              width={1920}
              height={1440}
              className={styles.lightboxImage}
              priority
            />
            <p className={styles.imageCaption}>{gallery[currentIndex].alt}</p>
            <p className={styles.imageCounter}>
              {currentIndex + 1} / {gallery.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
