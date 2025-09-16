"use client";
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import '../auth/Login.css';
import styles from './PilotBasicInfoForm.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { PhoneInput } from '../ui/PhoneInput';
import { Select } from '../ui/Select';
import { toast } from '../../lib/toast';
import { InfoTip } from '../ui/InfoTip';

// A lightweight registration form that collects only basic pilot info
// Fields: first name, last name, email, phone, age (number), gender
// Note: This does not include password/signup here unless needed; we'll create the user via magic link

export type PilotBasicInfoData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  age: number; // computed from birthDate
  gender: 'male' | 'female' | '';
};

export function PilotBasicInfoForm(props: { onSubmit?: (data: PilotBasicInfoData) => void | Promise<void> }) {
  const { onSubmit: onSubmitProp } = props;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsScrollEnd, setTermsScrollEnd] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement | null>(null);
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Validations copied from PilotRegisterForm (subset)
  const validateEmail = (s: string) => {
    const t = (s || '').trim();
    if (t === '') return { ok: false, code: 'empty', msg: 'შეიყვანეთ ელფოსტა.' } as const;
    if (/\s/.test(t)) return { ok: false, code: 'spaces', msg: 'იმეილი არ უნდა შეიცავდეს სიცარიელეს.' } as const;
    const atCount = (t.match(/@/g) || []).length;
    if (atCount === 0) return { ok: false, code: 'missingAt', msg: 'გამორჩა @ სიმბოლო.' } as const;
    if (atCount > 1) return { ok: false, code: 'multipleAt', msg: 'მხოლოდ ერთი @ გამოიყენეთ.' } as const;
    const [local, domain] = t.split('@');
    if (!local) return { ok: false, code: 'missingLocal', msg: 'აკლია მომხმარებლის ნაწილი (@-ამდე).' } as const;
    if (!domain) return { ok: false, code: 'missingDomain', msg: 'აკლია დომენი (@-ის შემდეგ).' } as const;
    if (domain.indexOf('.') === -1) return { ok: false, code: 'missingDot', msg: 'დომენი უნდა შეიცავდეს წერტილს (.).' } as const;
    const tld = domain.split('.').pop() || '';
    if (tld.length < 2) return { ok: false, code: 'tldShort', msg: 'დომენი უნდა მთავრდებოდეს მინ. 2 ასოზე.' } as const;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) return { ok: false, code: 'invalid', msg: 'იმეილის ფორმატი არასწორია.' } as const;
    return { ok: true, code: 'ok', msg: '' } as const;
  };
  const isAscii = (s: string, allowNL = false) => {
    const re = allowNL ? /^[\x09\x0A\x0D\x20-\x7E]*$/ : /^[\x20-\x7E]*$/;
    return re.test(s || '');
  };

  // Password rules (copied from PilotRegisterForm)
  const isPasswordValid = (pwd: string) => {
    if (!pwd || pwd.length < 8) return false;
    const first = pwd.charAt(0);
    const isLetter = first.toLowerCase() !== first.toUpperCase();
    const isUpper = first === first.toUpperCase();
    const hasDigit = /\d/.test(pwd);
    return isLetter && isUpper && hasDigit;
  };
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
  const firstNameAsciiOk = firstName.length === 0 ? false : isAscii(firstName);
  const lastNameAsciiOk = lastName.length === 0 ? false : isAscii(lastName);
  const passwordOk = isPasswordValid(password);
  const confirmOk = passwordOk && confirmPassword === password;
  const showPasswordErr = password.length > 0 && !passwordOk;
  const showConfirmErr = confirmPassword.length > 0 && !confirmOk;

  // Terms modal effects similar to PilotRegisterForm
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
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (e.key === 'Tab') {
        const root = modalCardRef.current; if (!root) return;
        const focusables = Array.from(root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Basic checks
    if (!firstName || !lastName || !email || !phone || !birthDate || !gender) {
      setError('შეავსეთ ყველა ველი.');
      return;
    }
    if (!validateEmail(email).ok) { setError('გთხოვთ, სწორი იმეილი.'); return; }
    // Validate DOB: required and age between 16 and 100 (as in PilotRegisterForm)
    const computeAge = (dobStr: string) => {
      const today = new Date();
      const dob = new Date(dobStr);
      let a = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
      return a;
    };
    const age = computeAge(birthDate);
    if (age < 16 || age > 100) { setError('ასაკი უნდა იყოს 16-100 დიაპაზონში.'); return; }
  if (!gender) { setError('სქესი აუცილებელია.'); return; }
  if (!phone) { setError('ტელეფონი აუცილებელია.'); return; }
  if (!isPasswordValid(password)) { setError('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო, პირველი ასო დიდი და შეიცავდეს მინიმუმ 1 ციფრს.'); return; }
  if (password !== confirmPassword) { setError('პაროლები არ ემთხვევა.'); return; }
  if (!acceptedTerms) { setError('გთხოვთ, დაეთანხმოთ წესებსა და პირობებს.'); return; }
    // English-only checks for text fields (same messaging)
    if (!isAscii(firstName)) { setError('სახელი ჩაწერეთ ინგლისურად (ASCII).'); return; }
    if (!isAscii(lastName)) { setError('გვარი ჩაწერეთ ინგლისურად (ASCII).'); return; }

    try {
      setLoading(true);
      const payload: PilotBasicInfoData = {
        firstName,
        lastName,
        email,
        phone: phone!,
        birthDate,
        age,
        gender: gender as any,
      };
      if (onSubmitProp) await onSubmitProp(payload);
      // Sign up via Supabase with password; email confirmation will be required by Supabase project settings
      const supabase = createSupabaseBrowserClient();
      const full_name = `${firstName} ${lastName}`.trim();
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Deliberately do NOT set role for now
            status: 'inactive',
            full_name,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: birthDate,
            age,
            gender,
            phone,
            accepted_terms: acceptedTerms,
          }
        }
      });
      if (signErr) throw signErr;
      toast.success('ვერიფიკაციის ბმული გაიგზავნა იმეილზე.');
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
      {/* Names */}
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

      {/* Contact */}
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

      {/* Auth: Password + Confirm */}
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

      {/* DOB + Gender (as in PilotRegisterForm) */}
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

      {/* Terms (required) — open Privacy Policy modal like in PilotRegisterForm */}
      <div className="login__field" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <input
          id="accept-terms-basic"
          type="checkbox"
          name="acceptTerms"
          checked={acceptedTerms}
          onChange={e=>{ const v = e.target.checked; setAcceptedTerms(v); if (v) { setTermsScrollEnd(false); setShowTerms(true); } }}
          required
        />
        <label htmlFor="accept-terms-basic" style={{display:'inline-flex', gap:'.35rem', alignItems:'center', flexWrap:'wrap'}}>
          ვეთანხმები
          <a href="#" className="login__link" onClick={(e)=>{e.preventDefault(); setTermsScrollEnd(false); setShowTerms(true);}}>კონფიდენციალურობის პოლიტიკას</a>
        </label>
      </div>

      <button type="submit" className="login__button" disabled={loading}>{loading ? 'გაგზავნა...' : 'რეგისტრაცია'}</button>
      {error && <div className="login__status login__status--error" style={{marginTop:'.75rem'}}>{error}</div>}
      <p className="login__meta">უკვე გაქვს ექაუნთი? <Link className="login__link" href="/login">შესვლა</Link></p>
      </div>

      {showTerms && mounted && createPortal(
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-title-basic"
          onClick={(e)=>{ if (e.target === e.currentTarget && termsScrollEnd) setShowTerms(false); }}
        >
          <div className="modal__card" ref={modalCardRef} tabIndex={-1}>
            <div className="modal__header">
              <h3 id="terms-title-basic">Terms and Conditions</h3>
              {termsScrollEnd && (
                <button type="button" className="modal__x" aria-label="Close" onClick={()=>setShowTerms(false)}>×</button>
              )}
            </div>
            <div
              className="modal__body"
              ref={termsBodyRef}
              onScroll={(e)=>{
                if (termsScrollEnd) return;
                const el = e.currentTarget as HTMLDivElement;
                const threshold = 2;
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
                if (atBottom) setTermsScrollEnd(true);
              }}
            >
              <p>Welcome to MyCaucasus. These Terms and Conditions (&quot;Terms&quot;) govern your use of our platform and services. By registering and using the platform, you agree to these Terms.</p>
              <h4>1. Eligibility and Responsibilities</h4>
              <ul>
                <li>You confirm you are at least 16 years old and legally permitted to use our services.</li>
                <li>You are solely responsible for the accuracy of the information you provide.</li>
                <li>You agree to comply with safety rules and local regulations where applicable.</li>
              </ul>
              <h4>2. Data and Privacy</h4>
              <ul>
                <li>Your data is processed according to our Privacy Policy. Please review it carefully.</li>
                <li>You are responsible for protecting account credentials.</li>
              </ul>
              <hr style={{opacity:.15, margin:'1rem 0'}} />
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', paddingTop:'.25rem' }}>
                <input
                  id="accept-terms-in-modal-basic"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e)=> setAcceptedTerms(e.target.checked)}
                  disabled={!termsScrollEnd}
                />
                <label htmlFor="accept-terms-in-modal-basic">
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

export default PilotBasicInfoForm;
