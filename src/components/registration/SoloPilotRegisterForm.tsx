"use client";
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import '../auth/Login.css';
import styles from './SoloPilotRegisterForm.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { PhoneInput } from '../ui/PhoneInput';
import { Select } from '../ui/Select';
import { toast } from '../../lib/toast';
import { InfoTip } from '../ui/InfoTip';
import { MultiTextInput } from '../ui/MultiTextInput';

export function SoloPilotRegisterForm() {
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

  // Pilot details (same as tandem, minus passenger harness)
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [flightsCount, setFlightsCount] = useState<number | ''>('');
  const [experienceRaw, setExperienceRaw] = useState<string>('');
  const [flightsRaw, setFlightsRaw] = useState<string>('');
  const [wingModels, setWingModels] = useState<string[]>([]);
  const [harnessModels, setHarnessModels] = useState<string[]>([]);
  const [reserveModels, setReserveModels] = useState<string[]>([]);
  // Solo-specific: pilot type
  const [pilotType, setPilotType] = useState('');

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

  // Helpers copied from tandem form
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

  // Modal setup
  useEffect(() => {
    if (showTerms) {
      setTermsScrollEnd(false);
      requestAnimationFrame(() => {
        if (termsBodyRef.current) {
          const el = termsBodyRef.current;
          el.scrollTop = 0;
          if (el.scrollHeight <= el.clientHeight) setTermsScrollEnd(true);
        }
      });
    }
  }, [showTerms]);

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
        if (termsScrollEnd) setShowTerms(false);
        else { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      if (e.key === 'Tab') {
        const root = modalCardRef.current; if (!root) return;
        const focusables = Array.from(root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0]; const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const isShift = (e as any).shiftKey;
        if (!isShift && active === last) { e.preventDefault(); first.focus(); }
        else if (isShift && active === first) { e.preventDefault(); last.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    lastFocusedRef.current = (document.activeElement as HTMLElement) || null;
    requestAnimationFrame(() => { modalCardRef.current?.focus(); });
    const contentEl = contentRef.current;
    return () => {
      try { document.body.classList.remove('modal-open'); } catch {}
      try { contentEl?.removeAttribute('inert'); } catch {}
      window.removeEventListener('keydown', onKeyDown as any, { capture: true } as any);
      try { lastFocusedRef.current?.focus(); } catch {}
    };
  }, [showTerms, termsScrollEnd]);

  // Validation shortcuts
  const firstNameAsciiOk = isAscii(firstName);
  const lastNameAsciiOk = isAscii(lastName);
  const aboutAsciiOk = about ? isAscii(about, true) : true;
  const wingAsciiOk = wingModels.length === 0 ? false : wingModels.every(v => isAscii(v));
  const harnessAsciiOk = harnessModels.length === 0 ? false : harnessModels.every(v => isAscii(v));
  const reserveAsciiOk = reserveModels.length === 0 ? false : reserveModels.every(v => isAscii(v));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validations
    if (!validateEmail(email).ok) { toast.error('გთხოვთ, სწორი იმეილი.'); return; }
    if (!isPasswordValid(password)) { toast.error('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო, პირველი ასო დიდი და შეიცავდეს მინიმუმ 1 ციფრს.'); return; }
    if (password !== confirmPassword) { toast.error('პაროლები არ ემთხვევა.'); return; }
    if (!birthDate) { toast.error('დაბადების თარიღი აუცილებელია.'); return; }
    const computeAge = (dobStr: string) => {
      const today = new Date(); const dob = new Date(dobStr);
      let a = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--; return a;
    };
    const age = computeAge(birthDate);
    if (age < 16 || age > 100) { toast.error('ასაკი უნდა იყოს 16-100 დიაპაზონში.'); return; }
    if (!gender) { toast.error('სქესი აუცილებელია.'); return; }
    if (!pilotType) { toast.error('აირჩიეთ პილოტის ტიპი.'); return; }
    if (!phone) { toast.error('ტელეფონი აუცილებელია.'); return; }
    if (!isAscii(firstName) || !isAscii(lastName) || (about && !isAscii(about, true))) {
      toast.error('სახელი/გვარი/აღწერა ჩაწერეთ ინგლისურად (ASCII).'); return;
    }
    if (!digitsOnly(experienceRaw) || !yearsValid(experienceRaw)) { toast.error('გამოცდილება უნდა იყოს მხოლოდ ციფრებით 0-დან 60-მდე.'); return; }
    if (!digitsOnly(flightsRaw) || !flightsValid(flightsRaw)) { toast.error('ფრენების რაოდენობა უნდა იყოს მხოლოდ ციფრებით (0 ან მეტი).'); return; }
    if (wingModels.some(v=>!isAscii(v)) || harnessModels.some(v=>!isAscii(v)) || reserveModels.some(v=>!isAscii(v))) {
      toast.error('მოდელები მიუთითეთ ინგლისურად (ASCII).'); return;
    }
    if (!avatarFile) { toast.error('პროფილის სურათი აუცილებელია.'); return; }
    if (avatarTooBig) { toast.error('პროფილის სურათის ზომა არ უნდა აღემატებოდეს 6MB-ს.'); return; }
    if (licenseFiles.length < 1) { toast.error('ატვირთეთ სოლო პილოტის დამადასტურებელი დოკუმენტი (მინიმუმ 1).'); return; }
    if (licenseFiles.length > 7) { toast.error('ერთ ჯერზე ატვირთეთ მაქსიმუმ 7 დოკუმენტი.'); return; }
    if (licenseAnyTooBig) { toast.error('ყოველი დოკუმენტის ზომა არ უნდა აღემატებოდეს 5MB-ს.'); return; }
    if (!acceptedTerms) { toast.error('გთხოვთ, დაეთანხმოთ წესებსა და პირობებს.'); return; }

    try {
      const full_name = `${firstName} ${lastName}`.trim();
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'pilot',
            pilot_kind: 'solo',
            pilot_type: pilotType,
            status: 'pending',
            full_name,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: birthDate,
            age,
            gender,
            phone,
            about,
            experience_years: Number(experienceYears),
            flights_count: Number(flightsCount),
            wing_models: wingModels,
            harness_models: harnessModels,
            reserve_models: reserveModels,
            wing_model: wingModels[0] || null,
            harness_model: harnessModels[0] || null,
            reserve_model: reserveModels[0] || null,
            avatar_filename: avatarFile ? avatarFile.name : null,
            license_doc_filename: licenseFiles[0] ? licenseFiles[0].name : null,
            license_doc_filenames: licenseFiles.map(f => f.name),
            accepted_terms: acceptedTerms,
          }
        }
      });
      if (signErr) throw signErr;
      toast.success('ვერიფიკაციის ბმული გაიგზავნა იმეილზე. ანგარიში იქნება "მოლოდინის" სტატუსში დამტკიცებამდე.');
    } catch (err: any) {
      toast.error(err.message || 'დაფიქსირდა შეცდომა');
    }
  };

  return (
  <form onSubmit={onSubmit} className={`login ${styles.form}`}>
      <div aria-hidden={showTerms} ref={contentRef}>
        <h2>რეგისტრაცია — სოლო პილოტი</h2>
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
            <InfoTip success={emailOk} error={showEmailErr} text={showEmailErr ? emailVal.msg : 'სავალდებულოა მოქმედი ელფოსტა ვერიფიკაციისთვის.'} />
          </div>
          <PhoneInput value={phone} onChange={setPhone} placeholder="ტელეფონი" />
        </div>

        {/* Row 3: Auth */}
  <div className={styles.row}>
          <div className="login__field">
            <input type="password" className="login__input" name="password" placeholder="პაროლი" value={password} onChange={e=>setPassword(e.target.value)} />
            <InfoTip success={passwordOk} error={showPasswordErr} text={showPasswordErr ? 'პირველი ასო დიდი, მინ. 8 სიმბოლო და მინ. 1 ციფრი.' : 'პაროლი: პირველი ასო დიდი, მინ. 8 სიმბოლო, მინ. 1 ციფრი.'} />
          </div>
          <div className="login__field">
            <input type="password" className="login__input" name="confirm" placeholder="გაიმეორეთ პაროლი" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
            <InfoTip success={confirmOk} error={showConfirmErr} text={showConfirmErr ? 'პაროლები არ ემთხვევა.' : 'დაადასტურეთ პაროლი.'} />
          </div>
        </div>

        {/* Row 4: DOB + Gender */}
  <div className={styles.row}>
          <div className="login__field">
            <input type="date" className="login__input" name="birthDate" placeholder="დაბადების თარიღი" value={birthDate} onChange={e=>setBirthDate(e.target.value)} />
          </div>
          <div className="login__field">
            <Select
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

        {/* Solo: Pilot Type */}
  <div className={styles.row}>
          <div className="login__field">
            <Select
              value={pilotType}
              onChange={setPilotType}
              placeholder="პილოტის ტიპი"
              options={[
                { value: 'standard', label: 'ჩვეულებრივი' },
                { value: 'acro', label: 'აკრო' },
                { value: 'xc', label: 'კროს-კანთრი (XC)' },
              ]}
              ariaLabel="აირჩიეთ პილოტის ტიპი"
            />
            <input type="hidden" name="pilotType" value={pilotType} />
          </div>
        </div>

        {/* Experience (years) + Flights */}
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
              onChange={e=>{ const v = e.target.value.trim(); setExperienceRaw(v); if (digitsOnly(v)) setExperienceYears(v === '' ? '' : Number(v)); else setExperienceYears(''); }}
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
              onChange={e=>{ const v = e.target.value.trim(); setFlightsRaw(v); if (digitsOnly(v)) setFlightsCount(v === '' ? '' : Number(v)); else setFlightsCount(''); }}
            />
            <InfoTip success={flightsRaw.length>0 && flightsValid(flightsRaw)} error={showFlightsErr} text={showFlightsErr ? 'მხოლოდ ციფრებია დაშვებული (0 ან მეტი).' : 'სულ რამდენი ფრენა გაქვთ შესრულებული (შეიძლება 0-იც).'} />
          </div>
        </div>

        {/* Avatar */}
        <div className="login__field">
          <label htmlFor="avatar-file-solo" style={{display:'block', marginBottom:'.4rem'}}>ატვირთეთ პროფილის სურათი</label>
          <div className="login__field-inner">
            <input id="avatar-file-solo" name="avatar" type="file" className="login__input" onChange={e=>setAvatarFile(e.target.files?.[0] || null)} />
            <InfoTip success={!!avatarFile && !avatarTooBig} error={!avatarFile || avatarTooBig} text={!avatarFile ? "ფოტო უნდა იყოს მაღალი ხარისხის და პროფესიული გარემოში. მაქს ზომა: 6MB." : (avatarTooBig ? "ფაილი დიდია — მაქს 6MB." : "ფოტო მიღებულია (მაქს 6MB).") } />
          </div>
        </div>

        {/* About */}
        <div className="login__field">
          <textarea className="login__input" name="about" placeholder="მოკლე აღწერა" value={about} onChange={e=>setAbout(e.target.value)} rows={3} />
          <InfoTip success={about.length>0 && aboutAsciiOk} error={about.length>0 && !aboutAsciiOk} text={about.length>0 && !aboutAsciiOk ? 'ტექსტი ჩაწერეთ ინგლისურად.' : 'მოკლედ აღწერეთ გამოცდილება (ინგლისურად).'} />
        </div>

        {/* Gear lists */}
        <div className="login__field">
          <MultiTextInput values={wingModels} onChange={setWingModels} placeholder="ფრთის მოდელი (Enter)" ariaLabel="ფრთის მოდელები" inputName="wingModels" />
          <InfoTip success={wingModels.length>0 && wingAsciiOk} error={wingModels.length>0 && !wingAsciiOk} text={wingModels.length>0 && !wingAsciiOk ? 'მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ ფრთის მოდელები (ინგლისურად).'} />
        </div>
        <div className="login__field">
          <MultiTextInput values={harnessModels} onChange={setHarnessModels} placeholder="სავარძლის მოდელი" ariaLabel="სავარძლის მოდელები" inputName="harnessModels" />
          <InfoTip success={harnessModels.length>0 && harnessAsciiOk} error={harnessModels.length>0 && !harnessAsciiOk} text={harnessModels.length>0 && !harnessAsciiOk ? 'სავარძლის მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ სავარძლის მოდელები (ინგლისურად).'} />
        </div>
        <div className="login__field">
          <MultiTextInput values={reserveModels} onChange={setReserveModels} placeholder="სარეზერვო პარაშუტი" ariaLabel="სარეზერვო პარაშუტის მოდელები" inputName="reserveModels" />
          <InfoTip success={reserveModels.length>0 && reserveAsciiOk} error={reserveModels.length>0 && !reserveAsciiOk} text={reserveModels.length>0 && !reserveAsciiOk ? 'სარეზერვო მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ სარეზერვო პარაშუტის მოდელები (ინგლისურად).'} />
        </div>

        {/* Proof documents */}
        <div className="login__field">
          <label htmlFor="license-docs-solo" style={{display:'block', marginBottom:'.4rem', fontSize:'.9rem'}}>
            ატვირთეთ ლიცენზია, დიპლომი ან სერთიფიკატი.
          </label>
          <div className="login__field-inner">
            <input
              type="file"
              className="login__input"
              accept="image/*,application/pdf,.doc,.docx,.odt,.rtf"
              id="license-docs-solo"
              name="licenseDocs"
              multiple
              onChange={e=> setLicenseFiles(Array.from(e.target.files || []))}
            />
            <InfoTip
              success={licenseFiles.length >= 1 && licenseFiles.length <= 7 && !licenseAnyTooBig}
              error={licenseFiles.length === 0 || licenseFiles.length > 7 || licenseAnyTooBig}
              text={
                licenseFiles.length === 0
                  ? 'ატვირთეთ სოლო პილოტის დამადასტურებელი დოკუმენტი(ები). მინ. 1, მაქს. 7, თითო ≤5MB.'
                  : (licenseFiles.length > 7
                    ? 'შეარჩიეთ მაქსიმუმ 7 ფაილი.'
                    : (licenseAnyTooBig
                      ? 'ზომა დიდია — თითოეული ფაილი მაქს 5MB.'
                      : 'დოკუმენტები მიღებულია (მინ. 1, მაქს. 7, თითო ≤5MB).'))
              }
            />
          </div>
        </div>

        {/* Terms */}
        <div className="login__field" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <input
            id="accept-terms-solo"
            type="checkbox"
            name="acceptTerms"
            checked={acceptedTerms}
            onChange={e=>{ const v = e.target.checked; setAcceptedTerms(v); if (v) { setTermsScrollEnd(false); setShowTerms(true); } }}
            required
          />
          <label htmlFor="accept-terms-solo" style={{display:'inline-flex', gap:'.35rem', alignItems:'center', flexWrap:'wrap'}}>
            ვეთანხმები
            <a href="#" className="login__link" onClick={(e)=>{e.preventDefault(); setTermsScrollEnd(false); setShowTerms(true);}}>კონფიდენციალურობის პოლიტიკას</a>
          </label>
        </div>

        <button type="submit" className="login__button">რეგისტრაცია</button>
      </div>

      {showTerms && mounted && createPortal(
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="terms-title-solo" onClick={(e)=>{ if (e.target === e.currentTarget && termsScrollEnd) setShowTerms(false); }}>
          <div className="modal__card" ref={modalCardRef} tabIndex={-1}>
            <div className="modal__header">
              <h3 id="terms-title-solo">Terms and Conditions</h3>
              {termsScrollEnd && (<button type="button" className="modal__x" aria-label="Close" onClick={()=>setShowTerms(false)}>×</button>)}
            </div>
            <div className="modal__body" ref={termsBodyRef} onScroll={(e)=>{ if (termsScrollEnd) return; const el = e.currentTarget; const threshold = 2; const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold; if (atBottom) setTermsScrollEnd(true); }}>
              <p>Welcome to MyCaucasus. These Terms and Conditions (&quot;Terms&quot;) govern your use of our platform and services. By registering as a solo pilot and using the platform, you agree to these Terms.</p>
              <h4>1. Eligibility and Pilot Responsibilities</h4>
              <ul>
                <li>You confirm you are at least 16 years old and legally permitted to fly in your jurisdiction.</li>
                <li>You are solely responsible for the accuracy of the information you provide.</li>
                <li>You agree to maintain valid licenses, insurance, and safety equipment required by law and local regulations.</li>
              </ul>
              <h4>2. Safety and Compliance</h4>
              <ul>
                <li>You will follow all applicable laws, airspace rules, and site-specific protocols.</li>
                <li>You will refuse flights when conditions are unsafe.</li>
              </ul>
              <hr style={{opacity:.15, margin:'1rem 0'}} />
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', paddingTop:'.25rem' }}>
                <input id="accept-terms-in-modal-solo" type="checkbox" checked={acceptedTerms} onChange={(e)=> setAcceptedTerms(e.target.checked)} disabled={!termsScrollEnd} />
                <label htmlFor="accept-terms-in-modal-solo">
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

export default SoloPilotRegisterForm;
