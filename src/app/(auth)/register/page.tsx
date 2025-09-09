import type { Metadata } from 'next';
import Link from 'next/link';
import './register.css';

export const metadata: Metadata = { title: 'Register' };

export default function RegisterPage() {
  return (
    <section className="register-choose" aria-labelledby="register-title">
      <h2 id="register-title">აირჩიე რეგისტრაციის ტიპი</h2>
      <p className="register-choose__hint">გთხოვთ, მიუთითოთ თქვენი როლი პლატფორმაზე</p>
      <div className="register-choose__grid">
        <Link href="/register/user" className="register-choose__card" aria-label="დარეგისტრირდი როგორც მომხმარებელი">
          <span className="register-choose__title">მომხმარებელი</span>
          <span className="register-choose__desc">ჩვეულებრივი ექაუნთი ტურისტებისთვის და სტუმრებისთვის</span>
        </Link>
        <Link href="/register/pilot" className="register-choose__card" aria-label="დარეგისტრირდი როგორც პილოტი">
          <span className="register-choose__title">პილოტი</span>
          <span className="register-choose__desc">პილოტებისთვის, ლიცენზიით და გამოცდილებით</span>
        </Link>
      </div>
    </section>
  );
}
