"use client";
import { useState } from 'react';
import Link from 'next/link';
import '../auth/Login.css';
import styles from './UserRegisterForm.module.css';
import { supabase } from '../../lib/supabaseClient';
import { toast } from '../../lib/toast';
import { PhoneInput } from '../ui/PhoneInput';

export function UserRegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  if (!email || !password || !fullName || !phone || !birthDate) { setError('აუცილებელია ყველა ველი (მათ შორის დაბადების თარიღი).'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('გთხოვთ, სწორი იმეილი.'); return; }
    if (password.length < 6) { setError('პაროლი მინიმუმ 6 სიმბოლო.'); return; }
    try {
      setLoading(true);
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
  options: { data: { full_name: fullName, role: 'user', phone, date_of_birth: birthDate } }
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
      <h2>რეგისტრაცია — მომხმარებელი</h2>
  <div className={styles.row}>
        <div className="login__field">
          <input className="login__input" placeholder="სახელი და გვარი" value={fullName} onChange={e=>setFullName(e.target.value)} />
        </div>
        <div className="login__field">
          <input type="email" className="login__input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
      </div>
  <div className={styles.row}>
        <PhoneInput value={phone} onChange={setPhone} placeholder="ტელეფონი" />
        <div className="login__field">
          <input type="password" className="login__input" placeholder="პაროლი" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
      </div>
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
            const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
            const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
            return (
              <input
                type="date"
                className="login__input"
                aria-label="დაბადების თარიღი"
                value={birthDate}
                onChange={e=>setBirthDate(e.target.value)}
                min={toISO(minDate)}
                max={toISO(maxDate)}
              />
            );
          })()}
        </div>
      </div>
      <button type="submit" className="login__button" disabled={loading}>{loading ? 'გაგზავნა...' : 'რეგისტრაცია'}</button>
      {error && <div className="login__status login__status--error" style={{marginTop:'.75rem'}}>{error}</div>}
      <p className="login__meta">უკვე გაქვს ექაუნთი? <Link className="login__link" href="/login">შესვლა</Link></p>
    </form>
  );
}