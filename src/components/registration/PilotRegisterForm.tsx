"use client";
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import '../auth/Login.css';
import styles from './PilotRegisterForm.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { PhoneInput } from '../ui/PhoneInput';
import { Select } from '../ui/Select';
import { toast } from '../../lib/toast';
import { InfoTip } from '../ui/InfoTip';
import { MultiTextInput } from '../ui/MultiTextInput';

export function PilotRegisterForm() {
  const supabase = createSupabaseBrowserClient();
  // Base auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [about, setAbout] = useState('');

  // Pilot details
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [flightsCount, setFlightsCount] = useState<number | ''>('');
  const [experienceRaw, setExperienceRaw] = useState<string>('');
  const [flightsRaw, setFlightsRaw] = useState<string>('');
  const [wingModels, setWingModels] = useState<string[]>([]);
  const [harnessModels, setHarnessModels] = useState<string[]>([]);
  const [reserveModels, setReserveModels] = useState<string[]>([]);
  const [passengerHarnessModels, setPassengerHarnessModels] = useState<string[]>([]);

  // Media
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsScrollEnd, setTermsScrollEnd] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement | null>(null);
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Ensure modal always starts at the top when opened
  useEffect(() => {
    if (showTerms) {
      setTermsScrollEnd(false);
      // wait for modal to paint; reset only modal scroll, do not change page scroll
      requestAnimationFrame(() => {
        if (termsBodyRef.current) {
          const el = termsBodyRef.current;
          el.scrollTop = 0;
          // If content doesn't overflow, enable closing immediately
          if (el.scrollHeight <= el.clientHeight) {
            setTermsScrollEnd(true);
          }
        }
      });
    }
  }, [showTerms]);

  // Lock background scroll while modal is open and handle ESC key
  useEffect(() => {
    if (!showTerms) {
      try { document.body.classList.remove('modal-open'); } catch {}
      try { contentRef.current?.removeAttribute('inert'); } catch {}
      return;
    }
    try { document.body.classList.add('modal-open'); } catch {}
    try { contentRef.current?.setAttribute('inert', ''); } catch {}

  const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (termsScrollEnd) {
          setShowTerms(false);
        } else {
          // prevent closing before reaching bottom
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (e.key === 'Tab') {
        const root = modalCardRef.current;
        if (!root) return;
        const focusables = Array.from(root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const isShift = e.shiftKey;
        if (!isShift && active === last) { e.preventDefault(); first.focus(); }
        else if (isShift && active === first) { e.preventDefault(); last.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    // Remember last focused element and focus the modal container for accessibility
    lastFocusedRef.current = (document.activeElement as HTMLElement) || null;
    requestAnimationFrame(() => {
      modalCardRef.current?.focus();
    });
    const contentEl = contentRef.current;
    return () => {
      try { document.body.classList.remove('modal-open'); } catch {}
      try { contentEl?.removeAttribute('inert'); } catch {}
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      // Restore focus to the previously focused element (e.g., the checkbox/link)
      try { lastFocusedRef.current?.focus(); } catch {}
    };
  }, [showTerms, termsScrollEnd]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation helpers
  const validateEmail = (s: string) => {
    const t = (s || '').trim();
    if (t === '') return { ok: false, code: 'empty', msg: 'შეიყვანეთ ელფოსტა.' };
    if (/\s/.test(t)) return { ok: false, code: 'spaces', msg: 'იმეილი არ უნდა შეიცავდეს სიცარიელეს.' };
    const atCount = (t.match(/@/g) || []).length;
    if (atCount === 0) return { ok: false, code: 'missingAt', msg: 'გამორჩა @ სიმბოლო.' };
    if (atCount > 1) return { ok: false, code: 'multipleAt', msg: 'მხოლოდ ერთი @ გამოიყენეთ.' };
    const [local, domain] = t.split('@');
    if (!local) return { ok: false, code: 'missingLocal', msg: 'აკლია მომხმარებლის ნაწილი (@-ამდე).' };
    if (!domain) return { ok: false, code: 'missingDomain', msg: 'აკლია დომენი (@-ის შემდეგ).' };
    if (domain.indexOf('.') === -1) return { ok: false, code: 'missingDot', msg: 'დომენი უნდა შეიცავდეს წერტილს (.).' };
    const tld = domain.split('.').pop() || '';
    if (tld.length < 2) return { ok: false, code: 'tldShort', msg: 'დომენი უნდა მთავრდებოდეს მინ. 2 ასოზე.' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) return { ok: false, code: 'invalid', msg: 'იმეილის ფორმატი არასწორია.' };
    return { ok: true, code: 'ok', msg: '' };
  };
  // English-only (ASCII) helper. allowNL for textarea support.
  const isAscii = (s: string, allowNL = false) => {
    const re = allowNL ? /^[\x09\x0A\x0D\x20-\x7E]*$/ : /^[\x20-\x7E]*$/;
    return re.test(s || '');
  };
  const isPasswordValid = (pwd: string) => {
    if (!pwd || pwd.length < 8) return false;
    const first = pwd.charAt(0);
    const isLetter = first.toLowerCase() !== first.toUpperCase();
    const isUpper = first === first.toUpperCase();
    const hasDigit = /\d/.test(pwd);
    return isLetter && isUpper && hasDigit;
  };
  const digitsOnly = (s: string) => /^\d+$/.test(s);
  const yearsValid = (s: string) => digitsOnly(s) && Number(s) >= 0 && Number(s) <= 60;
  const flightsValid = (s: string) => digitsOnly(s) && Number(s) >= 0;
  const MAX_AVATAR = 6 * 1024 * 1024; // 6MB
  const MAX_LICENSE = 5 * 1024 * 1024; // 5MB
  const passwordViolations = (pwd: string): string[] => {
    const issues: string[] = [];
    if (!pwd || pwd.length < 8) issues.push('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო.');
    if (pwd) {
      const first = pwd.charAt(0);
      const isLetter = first.toLowerCase() !== first.toUpperCase();
      const isUpper = first === first.toUpperCase();
      if (!(isLetter && isUpper)) issues.push('პირველი ასო უნდა იყოს დიდი.');
      if (!/\d/.test(pwd)) issues.push('პაროლი უნდა შეიცავდეს მინიმუმ 1 ციფრს.');
    }
    return issues;
  };
  const emailVal = validateEmail(email);
  const emailOk = emailVal.ok;
  const showEmailErr = email.length > 0 && !emailOk;
  const passwordOk = isPasswordValid(password);
  const confirmOk = passwordOk && confirmPassword === password;
  const showPasswordErr = password.length > 0 && !passwordOk;
  const showConfirmErr = confirmPassword.length > 0 && !confirmOk;
  const showYearsErr = experienceRaw.length > 0 && !yearsValid(experienceRaw);
  const showFlightsErr = flightsRaw.length > 0 && !flightsValid(flightsRaw);
  const avatarTooBig = !!avatarFile && avatarFile.size > MAX_AVATAR;
  const licenseAnyTooBig = (licenseFiles || []).some(f => f.size > MAX_LICENSE);
  const licenseCountInvalid = licenseFiles.length < 1 || licenseFiles.length > 7;
  // English-only checks per field
  const firstNameAsciiOk = firstName.length === 0 ? false : isAscii(firstName);
  const lastNameAsciiOk = lastName.length === 0 ? false : isAscii(lastName);
  // Tandem ID can be in any language; treat as valid when provided
  // Tandem ID removed from UI (kept proofs uploader)
  const aboutAsciiOk = about.length === 0 ? false : isAscii(about, true);
  const wingAsciiOk = wingModels.length === 0 ? false : wingModels.every(v => isAscii(v));
  const harnessAsciiOk = harnessModels.length === 0 ? false : harnessModels.every(v => isAscii(v));
  const passengerHarnessAsciiOk = passengerHarnessModels.length === 0 ? false : passengerHarnessModels.every(v => isAscii(v));
  const reserveAsciiOk = reserveModels.length === 0 ? false : reserveModels.every(v => isAscii(v));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Required checks
    if (!email || !password || !confirmPassword || !firstName || !lastName) { setError('აუცილებელია ძირითადი ველები.'); return; }
  if (!validateEmail(email).ok) { setError('გთხოვთ, სწორი იმეილი.'); return; }
  if (!isPasswordValid(password)) { setError('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო, პირველი ასო დიდი და შეიცავდეს მინიმუმ 1 ციფრს.'); return; }
    if (password !== confirmPassword) { setError('პაროლები არ ემთხვევა.'); return; }
  // Validate DOB: required and age between 16 and 100
    if (!birthDate) { setError('დაბადების თარიღი აუცილებელია.'); return; }
    const computeAge = (dobStr: string) => {
      const today = new Date();
      const dob = new Date(dobStr);
      let a = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
      return a;
    };
    const computedAge = computeAge(birthDate);
  if (computedAge < 16 || computedAge > 100) { setError('ასაკი უნდა იყოს 16-100 დიაპაზონში.'); return; }
    if (!gender) { setError('სქესი აუცილებელია.'); return; }
  if (!phone) { setError('ტელეფონი აუცილებელია.'); return; }
    // English-only checks for text fields
    const asciiErr = (() => {
      if (!isAscii(firstName)) return 'სახელი ჩაწერეთ ინგლისურად (ASCII).';
      if (!isAscii(lastName)) return 'გვარი ჩაწერეთ ინგლისურად (ASCII).';
      if (about && !isAscii(about, true)) return 'აღწერა ჩაწერეთ ინგლისურად (ASCII).';
  // Tandem ID is allowed in any language
      if (wingModels.some(v=>!isAscii(v))) return 'ფრთის მოდელები მიუთითეთ ინგლისურად (ASCII).';
      if (harnessModels.some(v=>!isAscii(v))) return 'სავარძლის მოდელები მიუთითეთ ინგლისურად (ASCII).';
      if (passengerHarnessModels.some(v=>!isAscii(v))) return 'მგზავრის სავარძლის მოდელები მიუთითეთ ინგლისურად (ASCII).';
      if (reserveModels.some(v=>!isAscii(v))) return 'სარეზერვო პარაშუტის მოდელები მიუთითეთ ინგლისურად (ASCII).';
      return null;
    })();
    if (asciiErr) { setError(asciiErr); return; }
  if (!digitsOnly(experienceRaw) || !yearsValid(experienceRaw)) { setError('გამოცდილება უნდა იყოს მხოლოდ ციფრებით 0-დან 60-მდე.'); return; }
  if (!digitsOnly(flightsRaw) || !flightsValid(flightsRaw)) { setError('ფრენების რაოდენობა უნდა იყოს მხოლოდ ციფრებით (0 ან მეტი).'); return; }
    if (!avatarFile) { setError('პროფილის სურათი აუცილებელია.'); return; }
    if (avatarTooBig) { setError('პროფილის სურათის ზომა არ უნდა აღემატებოდეს 6MB-ს.'); return; }
    if (licenseFiles.length < 1) { setError('ატვირთეთ ტანდემ პილოტის დამადასტურებელი დოკუმენტი (მინიმუმ 1).'); return; }
    if (licenseFiles.length > 7) { setError('ერთ ჯერზე ატვირთეთ მაქსიმუმ 7 დოკუმენტი.'); return; }
    if (licenseAnyTooBig) { setError('ყოველი დოკუმენტის ზომა არ უნდა აღემატებოდეს 5MB-ს.'); return; }
  if (!acceptedTerms) { setError('გთხოვთ, დაეთანხმოთ წესებსა და პირობებს.'); return; }
    try {
      setLoading(true);
      const full_name = `${firstName} ${lastName}`.trim();
      // Note: Uploads typically require an authenticated session. We'll store filenames in metadata now.
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'pilot',
            pilot_kind: 'tandem',
            status: 'pending',
            full_name,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: birthDate,
            age: computedAge,
            gender,
            phone,
            about,
            
            experience_years: Number(experienceYears),
            flights_count: Number(flightsCount),
            // license_id removed; using uploaded proof docs instead
            // arrays
            wing_models: wingModels,
            harness_models: harnessModels,
            reserve_models: reserveModels,
            passenger_harness_models: passengerHarnessModels,
            // backward-compatibility first items
            wing_model: wingModels[0] || null,
            harness_model: harnessModels[0] || null,
            reserve_model: reserveModels[0] || null,
            passenger_harness_model: passengerHarnessModels[0] || null,
            avatar_filename: avatarFile ? avatarFile.name : null,
            // Tandem proof docs — keep first filename for backward compatibility and add array
            license_doc_filename: licenseFiles[0] ? licenseFiles[0].name : null,
            license_doc_filenames: licenseFiles.map(f => f.name),
            accepted_terms: acceptedTerms,
          }
        }
      });
      if (signErr) throw signErr;
  toast.success('ვერიფიკაციის ბმული გაიგზავნა იმეილზე. ანგარიში იქნება \"მოლოდინის\" სტატუსში დამტკიცებამდე.');
    } catch (err: any) {
      setError(err.message || 'დაფიქსირდა შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  return (
  <form onSubmit={onSubmit} className={`login ${styles.form}`}>
  <div aria-hidden={showTerms} ref={contentRef}>
      <h2>რეგისტრაცია — პილოტი</h2>
      {/* Row 1: Names */}
  <div className={styles.row}>
        <div className="login__field">
          <input className="login__input" name="firstName" placeholder="სახელი" value={firstName} onChange={e=>setFirstName(e.target.value)} />
          <InfoTip success={firstName.length>0 && firstNameAsciiOk} error={firstName.length>0 && !firstNameAsciiOk} text={firstName.length>0 && !firstNameAsciiOk ? 'გამოიყენეთ მხოლოდ ინგლისური ასოები.' : 'შეიყვანეთ თქვენი სახელი (ინგლისურად).'} />
        </div>
        <div className="login__field">
          <input className="login__input" name="lastName" placeholder="გვარი" value={lastName} onChange={e=>setLastName(e.target.value)} />
          <InfoTip success={lastName.length>0 && lastNameAsciiOk} error={lastName.length>0 && !lastNameAsciiOk} text={lastName.length>0 && !lastNameAsciiOk ? 'გამოიყენეთ მხოლოდ ინგლისური ასოები.' : 'შეიყვანეთ თქვენი გვარი (ინგლისურად).'} />
        </div>
      </div>

      {/* Row 2: Contact */}
  <div className={styles.row}>
        <div className="login__field">
          <input type="email" className="login__input" name="email" placeholder="ელფოსტა" value={email} onChange={e=>setEmail(e.target.value)} />
          <InfoTip
            success={emailOk}
            error={showEmailErr}
            text={showEmailErr ? emailVal.msg : 'სავალდებულოა მოქმედი ელფოსტა ვერიფიკაციისთვის.'}
          />
        </div>
        <PhoneInput value={phone} onChange={setPhone} placeholder="ტელეფონი" />
      </div>

      {/* Row 3: Auth */}
  <div className={styles.row}>
        <div className="login__field">
          <input type="password" className="login__input" name="password" placeholder="პაროლი" value={password} onChange={e=>setPassword(e.target.value)} />
          <InfoTip success={passwordOk} error={showPasswordErr} text={(showPasswordErr ? passwordViolations(password).map((m,i)=>`• ${m}`).join('\n') : 'მინ. 8 სიმბოლო; პირველი ასო დიდი; მინ. 1 ციფრი. რეკომენდებულია ასოები, ციფრები და სიმბოლოები.')} />
        </div>
        <div className="login__field">
          <input type="password" className="login__input" name="confirmPassword" placeholder="გაიმეორე პაროლი" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
          <InfoTip success={confirmOk} error={showConfirmErr} text={showConfirmErr ? 'პაროლები არ ემთხვევა.' : 'გაიმეორეთ ზუსტად იგივე პაროლი.'} />
        </div>
      </div>

      {/* Row 4: Personal */}
  <div className={styles.row}>
  <div className="login__field">
          {(() => {
            const today = new Date();
            const toISO = (d: Date) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const da = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${da}`;
            };
            const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
            const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
            return (
              <input
                type="date"
                className="login__input"
                aria-label="დაბადების თარიღი"
                name="birthDate"
                value={birthDate}
                onChange={e=>setBirthDate(e.target.value)}
                min={toISO(minDate)}
                max={toISO(maxDate)}
              />
            );
          })()}
            {/* <InfoTip text="დაბადების თარიღი: ასაკი უნდა იყოს 16-100." /> */}
        </div>
        <div className="login__field">
          <Select
            ariaLabel="სქესი"
            value={gender}
            onChange={setGender}
            placeholder="აირჩიე სქესი"
            options={[
              { value: 'male', label: 'კაცი' },
              { value: 'female', label: 'ქალი' },
            ]}
          />
          <input type="hidden" name="gender" value={gender} />
        </div>
      </div>

      {/* Experience (years) + Flights (side-by-side) */}
  <div className={styles.row}>
        <div className="login__field">
          <input
            type="text"
            inputMode="numeric"
            pattern="\\d*"
            className="login__input"
            placeholder="გამოცდილება (წ.)"
            name="experienceYears"
            value={experienceRaw}
            onChange={e=>{
              const v = e.target.value.trim();
              setExperienceRaw(v);
              if (digitsOnly(v)) setExperienceYears(v === '' ? '' : Number(v));
              else setExperienceYears('');
            }}
          />
          <InfoTip success={experienceRaw.length>0 && yearsValid(experienceRaw)} error={showYearsErr} text={showYearsErr ? (!digitsOnly(experienceRaw) ? 'მხოლოდ ციფრებია დაშვებული (0-60).' : 'მიუთითეთ 0-60 დიაპაზონში.') : 'მიუთითეთ გამოცდილება წლებში (0-60).'} />
        </div>
        <div className="login__field">
          <input
            type="text"
            inputMode="numeric"
            pattern="\\d*"
            className="login__input"
            placeholder="ფრენების რაოდენობა"
            name="flightsCount"
            value={flightsRaw}
            onChange={e=>{
              const v = e.target.value.trim();
              setFlightsRaw(v);
              if (digitsOnly(v)) setFlightsCount(v === '' ? '' : Number(v));
              else setFlightsCount('');
            }}
          />
          <InfoTip success={flightsRaw.length>0 && flightsValid(flightsRaw)} error={showFlightsErr} text={showFlightsErr ? 'მხოლოდ ციფრებია დაშვებული (0 ან მეტი).' : 'სულ რამდენი ფრენა გაქვთ შესრულებული (შეიძლება 0-იც).'} />
        </div>
      </div>
      {/* Avatar (required) */}
      <div className="login__field">
        <label htmlFor="avatar-file" style={{display:'block', marginBottom:'.4rem'}}>ატვირთეთ პროფილის სურათი</label>
        <div className="login__field-inner">
          <input id="avatar-file" name="avatar" type="file" className="login__input" onChange={e=>setAvatarFile(e.target.files?.[0] || null)} />
          <InfoTip
            success={!!avatarFile && !avatarTooBig}
            error={!avatarFile || avatarTooBig}
            text={!avatarFile ? "ფოტო უნდა იყოს მაღალი ხარისხის და პროფესიული საქმიანობის დროს — ჩანდეს მხოლოდ პილოტი.\nკარგი ფოტოებს მეტი მარკეტინგული ეფექტი აქვს და ზრდის ნდობას.\nმაქს ზომა: 6MB." : (avatarTooBig ? "ფაილი დიდია — მაქს 6MB." : "ფოტო კარგ ხარისხში (მაქს 6MB), პროფესიულ გარემოში — ჩანდეს მხოლოდ პილოტი.")}
          />
        </div>
      </div>

      {/* About (full width) */}
      <div className="login__field">
        <textarea className="login__input" name="about" placeholder="მოკლე აღწერა" value={about} onChange={e=>setAbout(e.target.value)} rows={3} />
        <InfoTip success={about.length>0 && aboutAsciiOk} error={about.length>0 && !aboutAsciiOk} text={about.length>0 && !aboutAsciiOk ? 'ტექსტი ჩაწერეთ ინგლისურად.' : 'მოკლედ აღწერეთ გამოცდილება (ინგლისურად).'} />
      </div>

      {/* Wing (full width) */}
      <div className="login__field">
  <MultiTextInput values={wingModels} onChange={setWingModels} placeholder="ფრთის მოდელი (Enter)" ariaLabel="ფრთის მოდელები" inputName="wingModels" />
        <InfoTip success={wingModels.length>0 && wingAsciiOk} error={wingModels.length>0 && !wingAsciiOk} text={wingModels.length>0 && !wingAsciiOk ? 'მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ ფრთის მოდელები (ინგლისურად).'} />
      </div>

      {/* Pilot Harness (full width) */}
      <div className="login__field">
  <MultiTextInput values={harnessModels} onChange={setHarnessModels} placeholder="სავარძლის მოდელი" ariaLabel="სავარძლის მოდელები" inputName="harnessModels" />
        <InfoTip success={harnessModels.length>0 && harnessAsciiOk} error={harnessModels.length>0 && !harnessAsciiOk} text={harnessModels.length>0 && !harnessAsciiOk ? 'სავარძლის მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ სავარძლის მოდელები (ინგლისურად).'} />
      </div>

      {/* Passenger Harness (full width) */}
      <div className="login__field">
  <MultiTextInput values={passengerHarnessModels} onChange={setPassengerHarnessModels} placeholder="მგზავრის სავარძელი" ariaLabel="მგზავრის სავარძლის მოდელები" inputName="passengerHarnessModels" />
        <InfoTip success={passengerHarnessModels.length>0 && passengerHarnessAsciiOk} error={passengerHarnessModels.length>0 && !passengerHarnessAsciiOk} text={passengerHarnessModels.length>0 && !passengerHarnessAsciiOk ? 'მგზავრის სავარძლის მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ მგზავრის სავარძლის მოდელები (ინგლისურად).'} />
      </div>

      {/* Reserve Parachute (full width) */}
      <div className="login__field">
  <MultiTextInput values={reserveModels} onChange={setReserveModels} placeholder="სარეზერვო პარაშუტი" ariaLabel="სარეზერვო პარაშუტის მოდელები" inputName="reserveModels" />
        <InfoTip success={reserveModels.length>0 && reserveAsciiOk} error={reserveModels.length>0 && !reserveAsciiOk} text={reserveModels.length>0 && !reserveAsciiOk ? 'სარეზერვო მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ სარეზერვო პარაშუტის მოდელები (ინგლისურად).'} />
      </div>

  {/* Tandem Pilot ID input removed by request */}
      {/* Tandem proof documents (visible by default) */}
      <div className="login__field">
        <label htmlFor="license-docs" style={{display:'block', marginBottom:'.4rem', fontSize:'.9rem'}}>
          ატვირთეთ ლიცენზია, დიპლომი ან სერთიფიკატი.
        </label>
        <div className="login__field-inner">
          <input
            type="file"
            className="login__input"
            accept="image/*,application/pdf,.doc,.docx,.odt,.rtf"
            id="license-docs"
            name="licenseDocs"
            multiple
            onChange={e=> setLicenseFiles(Array.from(e.target.files || []))}
          />
          <InfoTip
            success={licenseFiles.length >= 1 && licenseFiles.length <= 7 && !licenseAnyTooBig}
            error={licenseFiles.length === 0 || licenseFiles.length > 7 || licenseAnyTooBig}
            text={
              licenseFiles.length === 0
                ? 'ატვირთეთ ტანდემ პილოტის დამადასტურებელი დოკუმენტი(ები). შეიძლება იყოს ლიცენზია, დიპლომი, სერთიფიკატი. მინ. 1, მაქს. 7, თითო ≤5MB.'
                : (licenseFiles.length > 7
                  ? 'შეარჩიეთ მაქსიმუმ 7 ფაილი.'
                  : (licenseAnyTooBig
                    ? 'ზომა დიდია — თითოეული ფაილი მაქს 5MB.'
                    : 'დოკუმენტები მიღებულია (მინ. 1, მაქს. 7, თითო ≤5MB).'))
            }
          />
        </div>
      </div>

  {/* Certificate inputs removed by request */}

      {/* Terms (required) — show only Privacy Policy link that opens Terms modal */}
      <div className="login__field" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <input
          id="accept-terms"
          type="checkbox"
          name="acceptTerms"
          checked={acceptedTerms}
          onChange={e=>{
            const v = e.target.checked;
            setAcceptedTerms(v);
            if (v) { setTermsScrollEnd(false); setShowTerms(true); }
          }}
          required
        />
        <label htmlFor="accept-terms" style={{display:'inline-flex', gap:'.35rem', alignItems:'center', flexWrap:'wrap'}}>
          ვეთანხმები
          <a href="#" className="login__link" onClick={(e)=>{e.preventDefault(); setTermsScrollEnd(false); setShowTerms(true);}}>კონფიდენციალურობის პოლიტიკას</a>
        </label>
      </div>

    {/* Submit and meta inside content wrapper */}
    <button type="submit" className="login__button" disabled={loading}>{loading ? 'გაგზავნა...' : 'რეგისტრაცია'}</button>
    {error && <div className="login__status login__status--error" style={{marginTop:'.75rem'}}>{error}</div>}
  <p className="login__meta">რეგისტრაციის შემდეგ თქვენი ანგარიში იქნება &quot;მოლოდინის&quot; სტატუსში. ადმინისტრატორის დასტურის შემდეგ შეძლებთ სრულ ფუნქციონირებას.</p>
    <p className="login__meta">უკვე გაქვს ექაუნთი? <Link className="login__link" href="/login">შესვლა</Link></p>
    </div>

    {showTerms && mounted && createPortal(
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-title"
          onClick={(e)=>{ if (e.target === e.currentTarget && termsScrollEnd) setShowTerms(false); }}
        >
          <div className="modal__card" ref={modalCardRef} tabIndex={-1}>
            <div className="modal__header">
              <h3 id="terms-title">Terms and Conditions</h3>
              {termsScrollEnd && (
                <button type="button" className="modal__x" aria-label="Close" onClick={()=>setShowTerms(false)}>×</button>
              )}
            </div>
            <div
              className="modal__body"
              ref={termsBodyRef}
              onScroll={(e)=>{
                if (termsScrollEnd) return; // prevent repeated state updates
                const el = e.currentTarget;
                // Use a small threshold to avoid jitter near the bottom
                const threshold = 2;
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
                if (atBottom) setTermsScrollEnd(true);
              }}
            >
              <p>Welcome to MyCaucasus. These Terms and Conditions (&quot;Terms&quot;) govern your use of our platform and services. By registering as a tandem pilot and using the platform, you agree to these Terms.</p>
              <h4>1. Eligibility and Pilot Responsibilities</h4>
              <ul>
                <li>You confirm you are at least 16 years old and legally permitted to provide flight services in your jurisdiction.</li>
                <li>You are solely responsible for the accuracy of the information you provide, including certificates, IDs, and experience.</li>
                <li>You agree to maintain valid licenses, insurance, and safety equipment required by law and local regulations.</li>
                <li>You understand that aviation activities carry inherent risks and you will operate with due care and professional standards.</li>
              </ul>
              <h4>2. Safety and Compliance</h4>
              <ul>
                <li>You will follow all applicable laws, airspace rules, and site-specific protocols.</li>
                <li>You will brief passengers on safety procedures and refuse services when conditions are unsafe.</li>
                <li>You will keep your equipment in safe working condition and perform regular checks.</li>
              </ul>
              <h4>3. Bookings, Payments, and Cancellations</h4>
              <ul>
                <li>Platform tools may facilitate bookings; any payment arrangements are between you and the customer unless otherwise stated.</li>
                <li>You agree to post clear pricing and cancellation terms where applicable.</li>
                <li>We may cancel or reschedule activities for safety, compliance, or operational reasons.</li>
              </ul>
              <h4>4. Content and Intellectual Property</h4>
              <ul>
                <li>By uploading content (photos, videos, text), you grant us a non-exclusive, worldwide license to use it for platform operations and marketing, subject to your privacy settings and applicable law.</li>
                <li>You represent that you have the rights to the content you upload and that it does not infringe third-party rights.</li>
                <li>Trademarks, logos, and design elements on the platform are owned by their respective holders. No rights are transferred to you.</li>
              </ul>
              <h4>5. Data and Privacy</h4>
              <ul>
                <li>We process your personal data according to our Privacy Policy. Please review it carefully.</li>
                <li>We may collect operational data to improve safety and service quality.</li>
                <li>You are responsible for protecting account credentials and for activities under your account.</li>
              </ul>
              <h4>6. Liabilities and Disclaimers</h4>
              <ul>
                <li>The platform provides tools to connect pilots and customers. We are not a carrier and do not provide flight services.</li>
                <li>To the maximum extent permitted by law, we are not liable for any loss, injury, or damages arising from aviation activities or third-party actions.</li>
                <li>You agree to indemnify and hold us harmless from claims related to your services, content, or breach of these Terms.</li>
              </ul>
              <h4>7. Suspensions and Termination</h4>
              <ul>
                <li>We may suspend or terminate accounts that violate these Terms, pose safety risks, or engage in fraud or abuse.</li>
                <li>We may request additional verification of identity, licenses, or insurance at any time.</li>
              </ul>
              <h4>8. Changes to These Terms</h4>
              <ul>
                <li>We may update these Terms from time to time. Continued use of the platform constitutes acceptance of the updated Terms.</li>
              </ul>
              <h4>9. Contact</h4>
              <ul>
                <li>For questions or concerns about these Terms, contact our support team.</li>
              </ul>
              <hr style={{opacity:.15, margin:'1rem 0'}} />
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', paddingTop:'.25rem' }}>
                <input
                  id="accept-terms-in-modal"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e)=> setAcceptedTerms(e.target.checked)}
                  disabled={!termsScrollEnd}
                />
                <label htmlFor="accept-terms-in-modal">
                  I have read and agree to the Terms and Conditions
                  {!termsScrollEnd && <span style={{marginLeft:'.5rem', opacity:.8}}>(scroll to the bottom to enable)</span>}
                </label>
              </div>
            </div>
            {termsScrollEnd && (
              <div className="modal__footer">
                <button type="button" className="login__button" onClick={()=>setShowTerms(false)}>Close</button>
              </div>
            )}
          </div>
        </div>,
        typeof document !== 'undefined' ? document.body : (globalThis as any).document?.body
      )}
    </form>
  );
}