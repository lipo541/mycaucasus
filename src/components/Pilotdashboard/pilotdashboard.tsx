"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import adminStyles from '../superadmin/dashboard/Dashboard.module.css';
import styles from './pilotdashboard.module.css';
import PilotProfile from './profile/pilotprofile';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { toast } from '@/lib/toast';

// Sidebar with a single "Profile" item, mirroring admin look & feel
const Sidebar = ({
  isOpen,
  toggle,
  activeLink,
  setActiveLink,
  onSignOut,
  signingOut,
  sidebarRef,
}: {
  isOpen: boolean;
  toggle: () => void;
  activeLink: string;
  setActiveLink: (link: string) => void;
  onSignOut: () => void;
  signingOut: boolean;
  sidebarRef: React.RefObject<HTMLElement>;
}) => {
  const navItems = ['Profile'];
  return (
    <aside
      ref={sidebarRef}
      className={`${adminStyles.sidebar} ${isOpen ? adminStyles.sidebarOpen : ''}`}
      aria-hidden={!isOpen}
      aria-label="Sidebar navigation"
    >
      <div>
        <div className={adminStyles.sidebarHeader}>
          <h2>Pilot Panel</h2>
          <button onClick={toggle} className={adminStyles.closeBtn} aria-label="Close sidebar">
            &times;
          </button>
        </div>
        <nav className={adminStyles.nav} aria-label="Primary">
          <ul className={adminStyles.navList}>
            <li className={adminStyles.navSectionLabel}>Main</li>
            {navItems.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`${adminStyles.navLink} ${activeLink === item ? adminStyles.navLinkActive : ''}`}
                  onClick={() => setActiveLink(item)}
                >
                  <span className={adminStyles.icon} aria-hidden>
                    ◉
                  </span>
                  <span>{item}</span>
                </button>
              </li>
            ))}
          </ul>
          <hr className={adminStyles.navDivider} />
          <div className={adminStyles.actionGroup}>
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className={`${adminStyles.navLink} ${adminStyles.signOutButton}`}
              aria-busy={signingOut || undefined}
            >
              {signingOut ? <span className={adminStyles.spinner} aria-label="Signing out" /> : 'Sign out'}
            </button>
          </div>
        </nav>
      </div>
      <div className={adminStyles.sidebarFooter}>
        <div className={adminStyles.profile}>P</div>
      </div>
    </aside>
  );
};

export default function PilotDashboard() {
  // Open by default on desktop, closed on mobile
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink, setActiveLink] = useState('Profile');
  const [signingOut, setSigningOut] = useState(false);
  const [ready, setReady] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const sidebarRef = useRef<HTMLElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  // Load persisted active tab (future-proof if we add more items later)
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('pilot_active_tab') : null;
      if (stored) setActiveLink(stored);
    } catch {}
  }, []);

  // Persist activeLink
  useEffect(() => {
    try {
      window.localStorage.setItem('pilot_active_tab', activeLink);
    } catch {}
  }, [activeLink]);

  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }, []);

  // Ensure initial state based on screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => {
      if (mq.matches) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
      requestAnimationFrame(() => setReady(true));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSidebarOpen]);

  // Focus trap when open on mobile
  useEffect(() => {
    if (!isSidebarOpen || !isMobile()) return;
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const focusable = sidebar.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
      firstFocusRef.current = focusable[0] as HTMLButtonElement;
      lastFocusRef.current = focusable[focusable.length - 1] as HTMLButtonElement;
      firstFocusRef.current.focus();
    }
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!firstFocusRef.current || !lastFocusRef.current) return;
      if (e.shiftKey && document.activeElement === firstFocusRef.current) {
        e.preventDefault();
        lastFocusRef.current.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusRef.current) {
        e.preventDefault();
        firstFocusRef.current.focus();
      }
    };
    const outside = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      if (!sidebarRef.current.contains(e.target as Node)) setSidebarOpen(false);
    };
    window.addEventListener('keydown', trap);
    document.addEventListener('mousedown', outside);
    return () => window.removeEventListener('keydown', trap);
  }, [isSidebarOpen, isMobile]);
  useEffect(() => {
    if (!isSidebarOpen || !isMobile()) return;
    const outside = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      if (!sidebarRef.current.contains(e.target as Node)) setSidebarOpen(false);
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [isSidebarOpen, isMobile]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleSignOut = async () => {
    if (signingOut) return;
    const ok = window.confirm('დაადასტურე გასვლა?');
    if (!ok) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out');
      // Redirect handled by layout guard when session is gone
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign out');
      setSigningOut(false);
    }
  };

  return (
    <div className={adminStyles.dashboardLayout} data-init={ready ? 'false' : 'true'}>
      {isSidebarOpen && isMobile() && (
        <div className={adminStyles.backdrop} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={toggleSidebar}
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        sidebarRef={sidebarRef}
      />
      <div className={adminStyles.mainContent}>
        <div className={adminStyles.mobileHeader}>
          <button onClick={toggleSidebar} className={adminStyles.menuButton} aria-label="Open sidebar">
            ☰
          </button>
          <h1 className={adminStyles.pageTitle}>Profile</h1>
        </div>
        <main className={adminStyles.contentArea}>
          <PilotProfile />
        </main>
      </div>
    </div>
  );
}
