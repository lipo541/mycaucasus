"use client";

import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { toast } from '@/lib/toast';
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import LocationManager from "./addlocation/LocationManager";
import styles from "./Dashboard.module.css";
import UserManagement from "./usermanagement/UserManagement";
import DashboardWidgets from "./widgets/StatCards";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <span className={styles.icon}>◉</span>,
  "User Management": <span className={styles.icon}>◈</span>,
  "Add Location": <span className={styles.icon}>⬢</span>,
  Content: <span className={styles.icon}>◼</span>,
  Moderation: <span className={styles.icon}>◆</span>,
  Settings: <span className={styles.icon}>◉</span>,
};

const Sidebar = ({
  isOpen,
  toggle,
  activeLink,
  setActiveLink,
  onSignOut,
  onGoHome,
  signingOut,
  sidebarRef,
}: {
  isOpen: boolean;
  toggle: () => void;
  activeLink: string;
  setActiveLink: (link: string) => void;
  onSignOut: () => void;
  onGoHome: () => void;
  signingOut: boolean;
  sidebarRef: React.RefObject<HTMLElement>;
}) => {
  const navItems = [
    "Dashboard",
    "User Management",
    "Add Location",
    "Content",
    "Moderation",
    "Settings",
  ];
  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      aria-hidden={!isOpen}
      aria-label="Sidebar navigation"
    >
      <div>
        <div className={styles.sidebarHeader}>
          <h2>Admin Panel</h2>
          <button
            onClick={toggle}
            className={styles.closeBtn}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>
        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.navList}>
            <li className={styles.navSectionLabel}>Main</li>
            {navItems.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`${styles.navLink} ${
                    activeLink === item ? styles.navLinkActive : ""
                  }`}
                  onClick={() => setActiveLink(item)}
                >
                  {iconMap[item]}
                  <span>{item}</span>
                </button>
              </li>
            ))}
          </ul>
          <hr className={styles.navDivider} />
          {/* Home navigation removed: superadmin confined to /admin by middleware */}
          <div className={styles.actionGroup}>
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className={`${styles.navLink} ${styles.signOutButton}`}
              aria-busy={signingOut || undefined}
            >
              {signingOut ? (
                <span className={styles.spinner} aria-label="Signing out" />
              ) : (
                "Sign out"
              )}
            </button>
          </div>
        </nav>
      </div>
      <div className={styles.sidebarFooter}>
        <div className={styles.profile}>N</div>
      </div>
    </aside>
  );
};

export default function Dashboard() {
  // Open by default on desktop, closed on mobile (initialized after first effect)
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink, setActiveLink] = useState("Dashboard");
  const [signingOut, setSigningOut] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const sidebarRef = useRef<HTMLElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  // Load persisted active tab
  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem("admin_active_tab")
          : null;
      if (stored) setActiveLink(stored);
    } catch {}
  }, []);

  // Persist when activeLink changes
  useEffect(() => {
    try {
      window.localStorage.setItem("admin_active_tab", activeLink);
    } catch {}
  }, [activeLink]);

  // Close sidebar on Escape (mobile / when overlayed)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSidebarOpen]);

  // Determine mobile mode (basic breakpoint check)
  const isMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  }, []);

  // Ensure initial closed state on mobile; update on resize without auto-opening on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      if (mq.matches) {
        setSidebarOpen(false); // force closed in mobile view
      } else {
        setSidebarOpen(true); // open on desktop for convenience
      }
      // defer readiness tick so CSS can suppress transition first frame
      requestAnimationFrame(() => setReady(true));
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Focus trap when sidebar open on mobile
  useEffect(() => {
    if (!isSidebarOpen || !isMobile()) return;
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const focusable = sidebar.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) {
      firstFocusRef.current = focusable[0] as HTMLButtonElement;
      lastFocusRef.current = focusable[
        focusable.length - 1
      ] as HTMLButtonElement;
      firstFocusRef.current.focus();
    }
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!firstFocusRef.current || !lastFocusRef.current) return;
      if (e.shiftKey && document.activeElement === firstFocusRef.current) {
        e.preventDefault();
        lastFocusRef.current.focus();
      } else if (
        !e.shiftKey &&
        document.activeElement === lastFocusRef.current
      ) {
        e.preventDefault();
        firstFocusRef.current.focus();
      }
    };
    const outside = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      if (!sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", trap);
    document.addEventListener("mousedown", outside);
    return () => window.removeEventListener("keydown", trap);
    // cleanup outside listener
  }, [isSidebarOpen, isMobile]);
  useEffect(() => {
    if (!isSidebarOpen || !isMobile()) return;
    const outside = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      if (!sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [isSidebarOpen, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    const ok = window.confirm("დაადასტურე გასვლა?");
    if (!ok) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign out");
      setSigningOut(false); // allow retry
    }
  };

  const goHome = () => {
    router.push("/");
  };

  const renderContent = () => {
    switch (activeLink) {
      case "Dashboard":
        return <DashboardWidgets />;
      case "User Management":
        return <UserManagement />;
      case "Add Location":
        return <LocationManager initialMode="list" />;
      // Add other cases for Content, Moderation, Settings etc.
      default:
        return <DashboardWidgets />;
    }
  };

  return (
    <div
      className={styles.dashboardLayout}
      data-init={ready ? "false" : "true"}
    >
      {/* Mobile backdrop */}
      {isSidebarOpen && isMobile() && (
        <div
          className={styles.backdrop}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={toggleSidebar}
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        onSignOut={handleSignOut}
        onGoHome={goHome}
        signingOut={signingOut}
        sidebarRef={sidebarRef}
      />
      <div className={styles.mainContent}>
        <div className={styles.mobileHeader}>
          <button
            onClick={toggleSidebar}
            className={styles.menuButton}
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <h1 className={styles.pageTitle}>
            {activeLink === "Dashboard"
              ? "Dashboard"
              : activeLink === "User Management"
              ? "User Management"
              : activeLink === "Add Location"
              ? "Add Location"
              : activeLink}
          </h1>
        </div>
        <main className={styles.contentArea}>
          <div
            style={{
              marginTop: activeLink === "Add Location" ? "0" : "0",
              padding: activeLink === "Add Location" ? "0" : undefined,
            }}
          >
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
