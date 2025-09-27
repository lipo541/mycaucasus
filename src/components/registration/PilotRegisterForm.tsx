"use client";
import {
  removeStoragePaths,
  uploadAvatar,
  uploadDocuments,
} from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "../../lib/toast";
import "../auth/Login.css";
import { FileUpload } from "../ui/FileUpload";
import { InfoTip } from "../ui/InfoTip";
import { MultiTextInput } from "../ui/MultiTextInput";
import styles from "./PilotRegisterForm.module.css";

export function PilotRegisterForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  // About + Pilot details (tandem specific)
  const [about, setAbout] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [flightsCount, setFlightsCount] = useState<number | "">("");
  const [experienceRaw, setExperienceRaw] = useState<string>("");
  const [flightsRaw, setFlightsRaw] = useState<string>("");
  const [wingModels, setWingModels] = useState<string[]>([]);
  const [harnessModels, setHarnessModels] = useState<string[]>([]);
  const [reserveModels, setReserveModels] = useState<string[]>([]);
  const [passengerHarnessModels, setPassengerHarnessModels] = useState<
    string[]
  >([]);
  // Media
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [wingSerialFiles, setWingSerialFiles] = useState<File[]>([]);
  const [harnessSerialFiles, setHarnessSerialFiles] = useState<File[]>([]);
  const [passengerHarnessSerialFiles, setPassengerHarnessSerialFiles] =
    useState<File[]>([]);
  const [reserveCertificateFiles, setReserveCertificateFiles] = useState<
    File[]
  >([]);
  const [tandemCertificateFiles, setTandemCertificateFiles] = useState<File[]>(
    []
  );
  const [hasTandemCertificate, setHasTandemCertificate] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  // Terms modal (like in PilotBasicInfoForm but with different text)
  const [showTerms, setShowTerms] = useState(false);
  const [termsScrollEnd, setTermsScrollEnd] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement | null>(null);
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset and pre-compute scroll-end when opening
  useEffect(() => {
    if (showTerms) {
      setTermsScrollEnd(false);
      requestAnimationFrame(() => {
        if (termsBodyRef.current) {
          const el = termsBodyRef.current;
          el.scrollTop = 0;
          if (el.scrollHeight <= el.clientHeight) {
            setTermsScrollEnd(true);
          }
        }
      });
    }
  }, [showTerms]);

  // Focus trap and background inert, allow close only after scroll end
  useEffect(() => {
    if (!showTerms) {
      try {
        document.body.classList.remove("modal-open");
      } catch {}
      try {
        contentRef.current?.removeAttribute("inert");
      } catch {}
      return;
    }
    try {
      document.body.classList.add("modal-open");
    } catch {}
    try {
      contentRef.current?.setAttribute("inert", "");
    } catch {}

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (termsScrollEnd) {
          setShowTerms(false);
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (e.key === "Tab") {
        const root = modalCardRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const isShift = (e as any).shiftKey;
        if (!isShift && active === last) {
          e.preventDefault();
          first.focus();
        } else if (isShift && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    lastFocusedRef.current = (document.activeElement as HTMLElement) || null;
    requestAnimationFrame(() => {
      modalCardRef.current?.focus();
    });
    const contentEl = contentRef.current;
    return () => {
      try {
        document.body.classList.remove("modal-open");
      } catch {}
      try {
        contentEl?.removeAttribute("inert");
      } catch {}
      window.removeEventListener(
        "keydown",
        onKeyDown as any,
        { capture: true } as any
      );
      try {
        lastFocusedRef.current?.focus();
      } catch {}
    };
  }, [showTerms, termsScrollEnd]);

  // Validation helpers (basic fields validation removed)
  // English-only (ASCII) helper. allowNL for textarea support.
  const isAscii = (s: string, allowNL = false) => {
    const re = allowNL ? /^[\x09\x0A\x0D\x20-\x7E]*$/ : /^[\x20-\x7E]*$/;
    return re.test(s || "");
  };
  const digitsOnly = (s: string) => /^\d+$/.test(s);
  const yearsValid = (s: string) =>
    digitsOnly(s) && Number(s) >= 0 && Number(s) <= 60;
  const flightsValid = (s: string) => digitsOnly(s) && Number(s) >= 0;
  const MAX_AVATAR = 6 * 1024 * 1024; // 6MB
  const MAX_LICENSE = 5 * 1024 * 1024; // 5MB
  const showYearsErr = experienceRaw.length > 0 && !yearsValid(experienceRaw);
  const showFlightsErr = flightsRaw.length > 0 && !flightsValid(flightsRaw);
  const avatarTooBig = !!avatarFile && avatarFile.size > MAX_AVATAR;
  const tooBig = (arr: File[]) => (arr || []).some((f) => f.size > MAX_LICENSE);
  const wingSerialTooBig = tooBig(wingSerialFiles);
  const harnessSerialTooBig = tooBig(harnessSerialFiles);
  const passengerHarnessSerialTooBig = tooBig(passengerHarnessSerialFiles);
  const reserveCertificateTooBig = tooBig(reserveCertificateFiles);
  const tandemCertificateTooBig = tooBig(tandemCertificateFiles);
  // English-only checks per field
  const aboutAsciiOk = about.length === 0 ? false : isAscii(about, true);
  const wingAsciiOk =
    wingModels.length === 0 ? false : wingModels.every((v) => isAscii(v));
  const harnessAsciiOk =
    harnessModels.length === 0 ? false : harnessModels.every((v) => isAscii(v));
  const passengerHarnessAsciiOk =
    passengerHarnessModels.length === 0
      ? false
      : passengerHarnessModels.every((v) => isAscii(v));
  const reserveAsciiOk =
    reserveModels.length === 0 ? false : reserveModels.every((v) => isAscii(v));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // English-only checks for text fields
    const asciiErr = (() => {
      if (about && !isAscii(about, true))
        return "აღწერა ჩაწერეთ ინგლისურად (ASCII).";
      if (wingModels.some((v) => !isAscii(v)))
        return "ფრთის მოდელები მიუთითეთ ინგლისურად (ASCII).";
      if (harnessModels.some((v) => !isAscii(v)))
        return "სავარძლის მოდელები მიუთითეთ ინგლისურად (ASCII).";
      if (passengerHarnessModels.some((v) => !isAscii(v)))
        return "მგზავრის სავარძლის მოდელები მიუთითეთ ინგლისურად (ASCII).";
      if (reserveModels.some((v) => !isAscii(v)))
        return "სარეზერვო პარაშუტის მოდელები მიუთითეთ ინგლისურად (ASCII).";
      return null;
    })();
    if (asciiErr) {
      setError(asciiErr);
      return;
    }
    if (!digitsOnly(experienceRaw) || !yearsValid(experienceRaw)) {
      setError("გამოცდილება უნდა იყოს მხოლოდ ციფრებით 0-დან 60-მდე.");
      return;
    }
    if (!digitsOnly(flightsRaw) || !flightsValid(flightsRaw)) {
      setError("ფრენების რაოდენობა უნდა იყოს მხოლოდ ციფრებით (0 ან მეტი).");
      return;
    }
    if (!avatarFile) {
      setError("პროფილის სურათი აუცილებელია.");
      return;
    }
    if (avatarTooBig) {
      setError("პროფილის სურათის ზომა არ უნდა აღემატებოდეს 6MB-ს.");
      return;
    }
    if (wingSerialFiles.length < 1) {
      setError("ატვირთეთ თქვენი ფრთის სერიული ნომრის სურათი.");
      return;
    }
    if (wingSerialTooBig) {
      setError("ფრთის სერიული ნომრის ფაილი დიდია — თითო ≤5MB.");
      return;
    }
    if (harnessSerialFiles.length < 1) {
      setError("ატვირთეთ თქვენი სავარძლის სერიული ნომერი ან სურათი.");
      return;
    }
    if (harnessSerialTooBig) {
      setError("სავარძლის სერიული ფაილი დიდია — თითო ≤5MB.");
      return;
    }
    if (passengerHarnessSerialFiles.length < 1) {
      setError("ატვირთეთ თქვენი მგზავრის სავარძლის სერიული ნომერი ან სურათი.");
      return;
    }
    if (passengerHarnessSerialTooBig) {
      setError("მგზავრის სავარძლის სერიული ფაილი დიდია — თითო ≤5MB.");
      return;
    }
    if (reserveCertificateFiles.length < 1) {
      setError("ატვირთეთ სარეზერვო პარაშუტის გადაკეცვის სერთიფიკატი.");
      return;
    }
    if (reserveCertificateTooBig) {
      setError("სარეზერვო სერთიფიკატის ფაილი დიდია — თითო ≤5MB.");
      return;
    }
    if (hasTandemCertificate) {
      if (tandemCertificateFiles.length < 1) {
        setError("მონიშნულია ტანდემ სერთიფიკატი — ატვირთეთ სერთიფიკატი.");
        return;
      }
      if (tandemCertificateTooBig) {
        setError("ტანდემ სერთიფიკატის ფაილი დიდია — თითო ≤5MB.");
        return;
      }
    }
    if (!agreeTerms) {
      setError("გთხოვთ დაეთანხმოთ წესებსა და პირობებს.");
      return;
    }
    try {
      setLoading(true);
      // Get current user id (for storage paths)
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      if (!userId) throw new Error("მიმდინარე მომხმარებელი ვერ მოიძებნა.");

      // Fetch current metadata to remove old storage files if present
      const { data: me } = await supabase.auth.getUser();
      const md = (me.user?.user_metadata || {}) as any;
      const oldAvatarPath = md.avatar_storage_path
        ? String(md.avatar_storage_path)
        : null;
      const oldWingSerialPaths: string[] = Array.isArray(
        md.wing_serial_doc_paths
      )
        ? md.wing_serial_doc_paths
        : [];
      const oldHarnessSerialPaths: string[] = Array.isArray(
        md.harness_serial_doc_paths
      )
        ? md.harness_serial_doc_paths
        : [];
      const oldPassengerHarnessSerialPaths: string[] = Array.isArray(
        md.passenger_harness_serial_doc_paths
      )
        ? md.passenger_harness_serial_doc_paths
        : [];
      const oldReserveCertPaths: string[] = Array.isArray(
        md.reserve_packing_certificate_paths
      )
        ? md.reserve_packing_certificate_paths
        : [];
      const oldTandemCertPaths: string[] = Array.isArray(
        md.tandem_certificate_doc_paths
      )
        ? md.tandem_certificate_doc_paths
        : [];

      // Upload new media
      const avatarRes = await uploadAvatar(userId, avatarFile);
      const wingSerialRes = wingSerialFiles.length
        ? await uploadDocuments(userId, wingSerialFiles)
        : [];
      const harnessSerialRes = harnessSerialFiles.length
        ? await uploadDocuments(userId, harnessSerialFiles)
        : [];
      const passengerHarnessSerialRes = passengerHarnessSerialFiles.length
        ? await uploadDocuments(userId, passengerHarnessSerialFiles)
        : [];
      const reserveCertRes = reserveCertificateFiles.length
        ? await uploadDocuments(userId, reserveCertificateFiles)
        : [];
      const tandemCertRes =
        hasTandemCertificate && tandemCertificateFiles.length
          ? await uploadDocuments(userId, tandemCertificateFiles)
          : [];

      // Overwrite full verification fields; set status back to pending
      const { error: updErr } = await supabase.auth.updateUser({
        data: {
          role: "pilot",
          pilot_kind: "tandem",
          status: "pending",
          about,
          experience_years:
            experienceYears === "" ? null : Number(experienceYears),
          flights_count: flightsCount === "" ? null : Number(flightsCount),
          wing_models: wingModels,
          harness_models: harnessModels,
          reserve_models: reserveModels,
          passenger_harness_models: passengerHarnessModels,
          wing_model: wingModels[0] || null,
          harness_model: harnessModels[0] || null,
          reserve_model: reserveModels[0] || null,
          passenger_harness_model: passengerHarnessModels[0] || null,
          avatar_storage_path: avatarRes.path,
          has_tandem_certificate: hasTandemCertificate,
          tandem_certificate_doc_paths: tandemCertRes.map((d) => d.path),
          wing_serial_doc_paths: wingSerialRes.map((d) => d.path),
          harness_serial_doc_paths: harnessSerialRes.map((d) => d.path),
          passenger_harness_serial_doc_paths: passengerHarnessSerialRes.map(
            (d) => d.path
          ),
          reserve_packing_certificate_paths: reserveCertRes.map((d) => d.path),
        },
      });
      if (updErr) throw updErr;

      // Best-effort: delete old files after successful update
      if (oldAvatarPath && oldAvatarPath !== avatarRes.path) {
        await removeStoragePaths("avatars", [oldAvatarPath]);
      }
      if (wingSerialRes.length && oldWingSerialPaths.length)
        await removeStoragePaths("documents", oldWingSerialPaths);
      if (harnessSerialRes.length && oldHarnessSerialPaths.length)
        await removeStoragePaths("documents", oldHarnessSerialPaths);
      if (
        passengerHarnessSerialRes.length &&
        oldPassengerHarnessSerialPaths.length
      )
        await removeStoragePaths("documents", oldPassengerHarnessSerialPaths);
      if (reserveCertRes.length && oldReserveCertPaths.length)
        await removeStoragePaths("documents", oldReserveCertPaths);
      if (tandemCertRes.length && oldTandemCertPaths.length)
        await removeStoragePaths("documents", oldTandemCertPaths);
      toast.success(
        'ვერიფიკაციის დასრულების მოთხოვნა გაგზავნილია. სტატუსი განახლდა: "მოლოდინი".'
      );
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || "დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/");
  };

  return (
    <form onSubmit={onSubmit} className={`login ${styles.form}`}>
      <div aria-hidden={showTerms} ref={contentRef}>
        <h2>ტანდემ პილოტის ვერიფიკაცია</h2>
        {/* 1. Avatar (required) */}
        <div className="login__field">
          <FileUpload
            label="ატვირთეთ პროფილის სურათი"
            ariaLabel="პროფილის სურათის ატვირთვა"
            accept="image/*"
            multiple={false}
            files={avatarFile ? [avatarFile] : []}
            onChange={(f) => setAvatarFile(f[0] || null)}
            hint="მაღალი ხარისხი, პროფესიულ გარემოში. მაქს ზომა 6MB."
          />
          <InfoTip
            success={!!avatarFile && !avatarTooBig}
            error={!avatarFile || avatarTooBig}
            text={
              !avatarFile
                ? "ფოტო უნდა იყოს მაღალი ხარისხის და პროფესიული საქმიანობის დროს — ჩანდეს მხოლოდ პილოტი.\nკარგი ფოტოებს მეტი მარკეტინგული ეფექტი აქვს და ზრდის ნდობას.\nმაქს ზომა: 6MB."
                : avatarTooBig
                ? "ფაილი დიდია — მაქს 6MB."
                : "ფოტო კარგ ხარისხში (მაქს 6MB), პროფესიულ გარემოში — ჩანდეს მხოლოდ პილოტი."
            }
          />
        </div>

        {/* 2. Experience (years) + 3. Flights (side-by-side) */}
        <div className={styles.row}>
          <div className="login__field">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="login__input"
              placeholder="გამოცდილება (წ.)"
              name="experienceYears"
              value={experienceRaw}
              onChange={(e) => {
                const v = e.target.value.trim();
                setExperienceRaw(v);
                if (digitsOnly(v))
                  setExperienceYears(v === "" ? "" : Number(v));
                else setExperienceYears("");
              }}
            />
            <InfoTip
              success={experienceRaw.length > 0 && yearsValid(experienceRaw)}
              error={showYearsErr}
              text={
                showYearsErr
                  ? !digitsOnly(experienceRaw)
                    ? "მხოლოდ ციფრებია დაშვებული (0-60)."
                    : "მიუთითეთ 0-60 დიაპაზონში."
                  : "მიუთითეთ გამოცდილება წლებში (0-60)."
              }
            />
          </div>
          <div className="login__field">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="login__input"
              placeholder="ფრენების რაოდენობა"
              name="flightsCount"
              value={flightsRaw}
              onChange={(e) => {
                const v = e.target.value.trim();
                setFlightsRaw(v);
                if (digitsOnly(v)) setFlightsCount(v === "" ? "" : Number(v));
                else setFlightsCount("");
              }}
            />
            <InfoTip
              success={flightsRaw.length > 0 && flightsValid(flightsRaw)}
              error={showFlightsErr}
              text={
                showFlightsErr
                  ? "მხოლოდ ციფრებია დაშვებული (0 ან მეტი)."
                  : "სულ რამდენი ფრენა გაქვთ შესრულებული (შეიძლება 0-იც)."
              }
            />
          </div>
        </div>

        {/* 4. Experience Info (full width) */}
        <div className="login__field">
          <textarea
            className="login__input"
            name="about"
            placeholder="გამოცდილების შესახებ ინფორმაცია"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
          />
          <InfoTip
            success={about.length > 0 && aboutAsciiOk}
            error={about.length > 0 && !aboutAsciiOk}
            text={
              about.length > 0 && !aboutAsciiOk
                ? "ტექსტი ჩაწერეთ ინგლისურად."
                : "მოკლედ აღწერეთ თქვენი გამოცდილება (ინგლისურად)."
            }
          />
        </div>

        {/* 5. Wing model + serial upload */}
        <div className="login__field">
          <MultiTextInput
            values={wingModels}
            onChange={setWingModels}
            placeholder="ფრთის მოდელი (Enter)"
            ariaLabel="ფრთის მოდელები"
            inputName="wingModels"
          />
          <InfoTip
            success={wingModels.length > 0 && wingAsciiOk}
            error={wingModels.length > 0 && !wingAsciiOk}
            text={
              wingModels.length > 0 && !wingAsciiOk
                ? "მოდელები მიუთითეთ ინგლისურად."
                : "დაამატეთ ფრთის მოდელები (ინგლისურად)."
            }
          />
        </div>

        {/* 6. Pilot harness model + serial upload */}
        <div className="login__field">
          <MultiTextInput
            values={harnessModels}
            onChange={setHarnessModels}
            placeholder="სავარძლის მოდელი"
            ariaLabel="სავარძლის მოდელები"
            inputName="harnessModels"
          />
          <InfoTip
            success={harnessModels.length > 0 && harnessAsciiOk}
            error={harnessModels.length > 0 && !harnessAsciiOk}
            text={
              harnessModels.length > 0 && !harnessAsciiOk
                ? "სავარძლის მოდელები მიუთითეთ ინგლისურად."
                : "დაამატეთ სავარძლის მოდელები (ინგლისურად)."
            }
          />
        </div>

        {/* 7. Passenger harness model + serial upload */}
        <div className="login__field">
          <MultiTextInput
            values={passengerHarnessModels}
            onChange={setPassengerHarnessModels}
            placeholder="მგზავრის სავარძელი"
            ariaLabel="მგზავრის სავარძლის მოდელები"
            inputName="passengerHarnessModels"
          />
          <InfoTip
            success={
              passengerHarnessModels.length > 0 && passengerHarnessAsciiOk
            }
            error={
              passengerHarnessModels.length > 0 && !passengerHarnessAsciiOk
            }
            text={
              passengerHarnessModels.length > 0 && !passengerHarnessAsciiOk
                ? "მგზავრის სავარძლის მოდელები მიუთითეთ ინგლისურად."
                : "დაამატეთ მგზავრის სავარძლის მოდელები (ინგლისურად)."
            }
          />
        </div>

        {/* 8. Reserve parachute model + packing certificate */}
        <div className="login__field">
          <MultiTextInput
            values={reserveModels}
            onChange={setReserveModels}
            placeholder="სარეზერვო პარაშუტი"
            ariaLabel="სარეზერვო პარაშუტის მოდელები"
            inputName="reserveModels"
          />
          <InfoTip
            success={reserveModels.length > 0 && reserveAsciiOk}
            error={reserveModels.length > 0 && !reserveAsciiOk}
            text={
              reserveModels.length > 0 && !reserveAsciiOk
                ? "სარეზერვო მოდელები მიუთითეთ ინგლისურად."
                : "დაამატეთ სარეზერვო პარაშუტის მოდელები (ინგლისურად)."
            }
          />
        </div>

        {/* Wing Serial Upload */}
        <div className="login__field">
          <FileUpload
            label="ატვირთეთ თქვენი ფრთის სერიული ნომრის სურათი"
            ariaLabel="ფრთის სერიული ნომრის ატვირთვა"
            accept="image/*,application/pdf"
            multiple
            files={wingSerialFiles}
            onChange={setWingSerialFiles}
            hint="სურათი ან PDF. თითო ფაილი ≤ 5MB."
          />
          <InfoTip
            success={wingSerialFiles.length > 0 && !wingSerialTooBig}
            error={wingSerialFiles.length === 0 || wingSerialTooBig}
            text={
              wingSerialFiles.length === 0
                ? "მინიმუმ 1 ფაილი. სურათი ან PDF."
                : wingSerialTooBig
                ? "ფაილი დიდია — თითო ≤5MB."
                : "ფაილები მიღებულია. თითო ≤5MB."
            }
          />
        </div>

        {/* Harness Serial Upload */}
        <div className="login__field">
          <FileUpload
            label="ატვირთეთ თქვენი სავარძლის სერიული ნომერი ან სურათი"
            ariaLabel="სავარძლის სერიული ნომრის ატვირთვა"
            accept="image/*,application/pdf"
            multiple
            files={harnessSerialFiles}
            onChange={setHarnessSerialFiles}
            hint="სურათი ან PDF. თითო ფაილი ≤ 5MB."
          />
          <InfoTip
            success={harnessSerialFiles.length > 0 && !harnessSerialTooBig}
            error={harnessSerialFiles.length === 0 || harnessSerialTooBig}
            text={
              harnessSerialFiles.length === 0
                ? "მინიმუმ 1 ფაილი."
                : harnessSerialTooBig
                ? "ფაილი დიდია — თითო ≤5MB."
                : "ფაილები მიღებულია. თითო ≤5MB."
            }
          />
        </div>

        {/* Passenger Harness Serial Upload */}
        <div className="login__field">
          <FileUpload
            label="ატვირთეთ თქვენი მგზავრის სავარძლის სერიული ნომერი ან სურათი"
            ariaLabel="მგზავრის სავარძლის სერიული ნომრის ატვირთვა"
            accept="image/*,application/pdf"
            multiple
            files={passengerHarnessSerialFiles}
            onChange={setPassengerHarnessSerialFiles}
            hint="სურათი ან PDF. თითო ფაილი ≤ 5MB."
          />
          <InfoTip
            success={
              passengerHarnessSerialFiles.length > 0 &&
              !passengerHarnessSerialTooBig
            }
            error={
              passengerHarnessSerialFiles.length === 0 ||
              passengerHarnessSerialTooBig
            }
            text={
              passengerHarnessSerialFiles.length === 0
                ? "მინიმუმ 1 ფაილი."
                : passengerHarnessSerialTooBig
                ? "ფაილი დიდია — თითო ≤5MB."
                : "ფაილები მიღებულია. თითო ≤5MB."
            }
          />
        </div>

        {/* Reserve Packing Certificate Upload */}
        <div className="login__field">
          <FileUpload
            label="ატვირთეთ თქვენი სარეზერვო პარაშუტის გადაკეცვის სერთიფიკატი"
            ariaLabel="სარეზერვო პარაშუტის სერთიფიკატის ატვირთვა"
            accept="image/*,application/pdf"
            multiple
            files={reserveCertificateFiles}
            onChange={setReserveCertificateFiles}
            hint="სურათი ან PDF. თითო ფაილი ≤ 5MB."
          />
          <InfoTip
            success={
              reserveCertificateFiles.length > 0 && !reserveCertificateTooBig
            }
            error={
              reserveCertificateFiles.length === 0 || reserveCertificateTooBig
            }
            text={
              reserveCertificateFiles.length === 0
                ? "მინიმუმ 1 ფაილი."
                : reserveCertificateTooBig
                ? "ფაილი დიდია — თითო ≤5MB."
                : "ფაილები მიღებულია. თითო ≤5MB."
            }
          />
        </div>

        {/* 9. Tandem certificate question + conditional upload */}
        <div className="login__field">
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={hasTandemCertificate}
              onChange={(e) => setHasTandemCertificate(e.target.checked)}
            />
            <span>გაქვთ ტანდემ სერთიფიკატი?</span>
          </label>
        </div>
        {hasTandemCertificate && (
          <div className="login__field">
            <FileUpload
              label="ატვირთეთ თქვენი სერთიფიკატის ფოტო"
              ariaLabel="ტანდემ სერთიფიკატის ატვირთვა"
              accept="image/*,application/pdf"
              multiple
              files={tandemCertificateFiles}
              onChange={setTandemCertificateFiles}
              hint="სურათი ან PDF. თითო ფაილი ≤ 5MB."
            />
            <InfoTip
              success={
                tandemCertificateFiles.length > 0 && !tandemCertificateTooBig
              }
              error={
                tandemCertificateFiles.length === 0 || tandemCertificateTooBig
              }
              text={
                tandemCertificateFiles.length === 0
                  ? "მინიმუმ 1 ფაილი."
                  : tandemCertificateTooBig
                  ? "ფაილი დიდია — თითო ≤5MB."
                  : "ფაილები მიღებულია. თითო ≤5MB."
              }
            />
          </div>
        )}

        {/* 10. Terms & Conditions */}
        <div className="login__field">
          <label className={styles.checkboxLabel}>
            <input
              id="accept-terms-tandem"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                const v = e.target.checked;
                setAgreeTerms(v);
                if (v) {
                  setTermsScrollEnd(false);
                  setShowTerms(true);
                }
              }}
            />
            <span>ვთვალისწინებ და ვეთანხმები წესებსა და პირობებს</span>
          </label>
        </div>
        {/* Submit */}
        <button type="submit" className="login__button" disabled={loading}>
          {loading ? "გაგზავნა..." : "გაგზავნა"}
        </button>
        {error && (
          <div
            className={`login__status login__status--error ${styles.statusErr}`}
          >
            {error}
          </div>
        )}

        {showSuccess && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <h3>მოთხოვნა გადაიგზავნა ადმინისტრატორთან</h3>
              <p className={styles.modalText}>
                დადებითი ან უარყოფითი პასუხის შემთხვევაში მიიღებთ შეტყობინებას.
                შეტყობინებების სექციაში შეძლებთ ნახვას.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="login__button"
                  onClick={handleSuccessClose}
                >
                  გასაგებია
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTerms &&
        mounted &&
        createPortal(
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title-tandem"
            onClick={(e) => {
              if (e.target === e.currentTarget && termsScrollEnd)
                setShowTerms(false);
            }}
          >
            <div className="modal__card" ref={modalCardRef} tabIndex={-1}>
              <div className="modal__header">
                <h3 id="terms-title-tandem">
                  წესები და პირობები — ტანდემ ვერიფიკაცია
                </h3>
                {termsScrollEnd && (
                  <button
                    type="button"
                    className="modal__x"
                    aria-label="დახურვა"
                    onClick={() => setShowTerms(false)}
                  >
                    ×
                  </button>
                )}
              </div>
              <div
                className="modal__body"
                ref={termsBodyRef}
                onScroll={(e) => {
                  if (termsScrollEnd) return;
                  const el = e.currentTarget as HTMLDivElement;
                  const threshold = 2;
                  const atBottom =
                    el.scrollTop + el.clientHeight >=
                    el.scrollHeight - threshold;
                  if (atBottom) setTermsScrollEnd(true);
                }}
              >
                <p>
                  ტანდემ პილოტის ვერიფიკაციის ფარგლებში თქვენ ადასტურებთ, რომ
                  მიწოდებული ყველა ინფორმაცია და ატვირთული დოკუმენტი სწორია და
                  ეკუთვნის თქვენ. ჩვენ შეიძლება შევადაროთ მონაცემები გარე
                  წყაროებს ან მოვითხოვოთ დამატებითი დადასტურება.
                </p>
                <h4>1) უსაფრთხოება და პასუხისმგებლობა</h4>
                <ul>
                  <li>
                    პასენჯირის უსაფრთხოება არის თქვენი უმაღლესი პასუხისმგებლობა.
                  </li>
                  <li>
                    ფრენების შესრულებისას იცავთ ადგილობრივ კანონებსა და
                    რეგულაციებს.
                  </li>
                  <li>
                    გამოიყენებთ გამართული, მწარმოებლის მითითებებით მოვლილ
                    აღჭურვილობას.
                  </li>
                </ul>
                <h4>2) დოკუმენტები და სერთიფიკატები</h4>
                <ul>
                  <li>
                    ატვირთული სურათები/ფაილები (სერიული ნომრები, სერთიფიკატები
                    და სხვ.) უნდა იყოს მკაფიო და წაკითხვადი.
                  </li>
                  <li>
                    ტანდემ სერთიფიკატის არსებულობის მონიშვნისას, სერთიფიკატის
                    ატვირთვაც სავალდებულოა.
                  </li>
                  <li>
                    ცრუ ინფორმაციის მიწოდება ხდება რეგისტრაციის უარყოფის
                    საფუძველი.
                  </li>
                </ul>
                <h4>3) კონფიდენციალურობა და მონაცემთა გამოყენება</h4>
                <ul>
                  <li>
                    თქვენი მონაცემები მუშავდება ვერიფიკაციისა და ანგარიშის
                    უსაფრთხოების მიზნებისთვის.
                  </li>
                  <li>
                    პროფილის ფოტო შეიძლება გამოჩნდეს პლატფორმაზე თქვენი პროფილის
                    გვერდზე.
                  </li>
                  <li>დეტალები იხილეთ კონფიდენციალურობის პოლიტიკაში.</li>
                </ul>
                <div className={styles.termsRow}>
                  <input
                    id="accept-terms-in-modal-tandem"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    disabled={!termsScrollEnd}
                  />
                  <label htmlFor="accept-terms-in-modal-tandem">
                    ვადასტურებ, რომ წავიკითხე და ვეთანხმები ზემოთ ჩამოთვლილ
                    წესებსა და პირობებს
                    {!termsScrollEnd && (
                      <span className={styles.termsHint}>
                        (გადააქროლეთ ტექსტი ბოლომდე გასაგრძელებლად)
                      </span>
                    )}
                  </label>
                </div>
              </div>
              {termsScrollEnd && (
                <div className="modal__footer">
                  <button
                    type="button"
                    className="login__button"
                    onClick={() => setShowTerms(false)}
                  >
                    დახურვა
                  </button>
                </div>
              )}
            </div>
          </div>,
          typeof document !== "undefined"
            ? document.body
            : (globalThis as any).document?.body
        )}
    </form>
  );
}
