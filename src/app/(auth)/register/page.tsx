import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './register.module.css';

export const metadata: Metadata = { title: 'Register' };

export default function RegisterPage() {
  return (
    <section className={styles['register-choose']} aria-labelledby="register-title">
      <h2 id="register-title">აირჩიე რეგისტრაციის ტიპი</h2>
      <p className={styles['register-choose__hint']}>გთხოვთ, მიუთითოთ თქვენი როლი პლატფორმაზე</p>
      <div className={styles['register-choose__grid']}>
        <Link href="/register/user" className={styles['register-choose__card']} aria-label="დარეგისტრირდი როგორც მომხმარებელი">
          <span className={styles['register-choose__title']}>მომხმარებელი</span>
          <span className={styles['register-choose__desc']}>ჩვეულებრივი ექაუნთი ტურისტებისთვის და სტუმრებისთვის</span>
        </Link>
        <Link href="/register/pilot" className={styles['register-choose__card']} aria-label="დარეგისტრირდი როგორც ტანდემ პილოტი">
          <span className={styles['register-choose__title']}>ტანდემ პილოტი</span>
          <span className={styles['register-choose__desc']}>მგზავრებთან ფრენები, ლიცენზიით და გამოცდილებით</span>
        </Link>
        <Link href="/register/pilot/solo" className={styles['register-choose__card']} aria-label="დარეგისტრირდი როგორც სოლო პილოტი">
          <span className={styles['register-choose__title']}>სოლო პილოტი</span>
          <span className={styles['register-choose__desc']}>პილოტებისთვის, ტანდემის გარეშე</span>
        </Link>
      </div>
    </section>
  );
}
