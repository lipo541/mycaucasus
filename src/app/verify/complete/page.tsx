"use client";
import CompleteVerification from "@/components/registration/verification/CompleteVerification";
import styles from "./page.module.css";

export default function VerifyCompletePage() {
  return (
    <section className={styles.page}>
      <CompleteVerification />
    </section>
  );
}
