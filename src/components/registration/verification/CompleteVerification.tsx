"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../../auth/Login.css";
import { PilotRegisterForm } from "../PilotRegisterForm";
import { SoloPilotRegisterForm } from "../SoloPilotRegisterForm";
import styles from "./CompleteVerification.module.css";

export default function CompleteVerification() {
  const [mode, setMode] = useState<"tandem" | "solo" | null>(null);
  const router = useRouter();

  return (
    <section className={styles.container}>
      <div className={styles.backBar}>
        <button
          className={styles.backBtn}
          type="button"
          onClick={() => router.back()}
          aria-label="უკან დაბრუნება"
        >
          <span aria-hidden>←</span>
          <span>უკან დაბრუნება</span>
        </button>
      </div>
      <h2 className={styles.title}>დაასრულე ვერიფიკაცია</h2>
      <p className={styles.subtitle}>
        აირჩიე რომელი ტიპის პროფილს დაასრულებ: ტანდემ პილოტი თუ სოლო პილოტი.
      </p>

      {!mode && (
        <div className={styles.choicesGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>ტანდემ პილოტი</h3>
            <p className={styles.cardDesc}>
              მგზავრებთან ფრენები, ლიცენზიით და გამოცდილებით.
            </p>
            <button
              type="button"
              className={`login__button ${styles.cardAction}`}
              onClick={() => setMode("tandem")}
            >
              გაგრძელება
            </button>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>მოსწავლე</h3>
            <p className={styles.cardDesc}>პილოტებისთვის, ტანდემის გარეშე.</p>
            <button
              type="button"
              className={`login__button ${styles.cardAction}`}
              onClick={() => setMode("solo")}
            >
              გაგრძელება
            </button>
          </div>
        </div>
      )}

      {mode && (
        <div className={styles.formHeader}>
          <span className={styles.modePill}>
            {mode === "tandem" ? "ტანდემ პილოტი" : "სოლო პილოტი"}
          </span>
          <button
            className={styles.linkReset}
            type="button"
            onClick={() => setMode(null)}
          >
            ← არჩევის შეცვლა
          </button>
        </div>
      )}

      {mode === "tandem" && (
        <div className={styles.formWrap}>
          <PilotRegisterForm />
        </div>
      )}
      {mode === "solo" && (
        <div className={styles.formWrap}>
          <SoloPilotRegisterForm />
        </div>
      )}
    </section>
  );
}
