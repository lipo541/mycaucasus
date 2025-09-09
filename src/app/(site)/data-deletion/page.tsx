import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Data Deletion',
  description: 'Instructions for requesting deletion of your account and personal data.',
};

export default function DataDeletionPage() {
  return (
    <main style={{ maxWidth: 840, margin: '40px auto', padding: '0 16px', lineHeight: 1.6 }}>
      <h1>User Data Deletion</h1>
      <p>
        If you would like to delete your account and associated personal data, you can request it using the
        instructions below. Once processed, your authentication profile and related data stored in our
        databases will be permanently removed or anonymized, except where retention is required by law.
      </p>
      <h2>How to request deletion</h2>
      <ol>
        <li>
          Send an email to <a href="mailto:xcaucasus@gmail.com">xcaucasus@gmail.com</a> from the email address
          associated with your account with the subject: <strong>Account Deletion Request</strong>.
        </li>
        <li>
          Include your full name (optional) and any additional details that can help us locate your account.
        </li>
      </ol>
      <p>
        We will confirm receipt and complete the deletion within 30 days. If additional verification is needed,
        we will contact you at the email you used for the request.
      </p>
      <h2>Notes</h2>
      <ul>
        <li>You can request a copy of your data before deletion.</li>
        <li>Some aggregate or legally required records may be retained as permitted by law.</li>
      </ul>
      <hr style={{ margin: '24px 0' }} />
      <p style={{ fontSize: 14, opacity: 0.8 }}>Last updated: {new Date().toISOString().split('T')[0]}</p>
    </main>
  );
}
