// Simple feature flags (client-safe) driven by public env vars
// Set NEXT_PUBLIC_AUTO_ADMIN_REDIRECT=false to disable automatic
// superadmin redirect from the public homepage to /admin.

export const AUTO_ADMIN_REDIRECT =
  process.env.NEXT_PUBLIC_AUTO_ADMIN_REDIRECT !== 'false';
