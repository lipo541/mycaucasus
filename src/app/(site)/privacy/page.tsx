import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for mycaucasus',
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: 840, margin: '40px auto', padding: '0 16px', lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>
      <p>We value your privacy. This page explains what data we collect and how we use it.</p>
      <h2>Information We Collect</h2>
      <p>Account information (such as email) used for authentication via Supabase and OAuth providers.</p>
      <h2>How We Use Information</h2>
      <p>To provide and improve our service, authenticate users, and maintain account security.</p>
      <h2>Data Sharing</h2>
      <p>We do not sell your personal information. We may share data with service providers strictly to operate the app.</p>
      <h2>Cookies</h2>
      <p>We may use cookies for session management and analytics.</p>
      <h2>Contact</h2>
      <p>If you have questions about this policy, contact us at xcaucasus@gmail.com.</p>
      <p style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>Last updated: {new Date().toISOString().split('T')[0]}</p>
    </main>
  );
}
