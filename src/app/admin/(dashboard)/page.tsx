export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <main className="admin-dashboard">
      <h1>ადმინისტრატორის პანელი</h1>
      <p>ეს არის დაცული სივრცე მხოლოდ Superadmin როლისათვის.</p>
      <div className="admin-grid">
        <section className="admin-card">
          <h2>მომხმარებლები</h2>
          <p>Coming soon...</p>
        </section>
        <section className="admin-card">
          <h2>პილოტების დამტკიცება</h2>
          <p>Coming soon...</p>
        </section>
        <section className="admin-card">
          <h2>ლოგები</h2>
          <p>Coming soon...</p>
        </section>
      </div>
    </main>
  );
}
