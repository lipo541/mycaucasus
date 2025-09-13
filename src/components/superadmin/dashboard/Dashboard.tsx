"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { toast } from '@/lib/toast';
import styles from './Dashboard.module.css';
import DashboardWidgets from './widgets/StatCards';
import UserManagement from './usermanagement/UserManagement';
import AddLocation from './addlocation/Addlocation';

const iconMap: Record<string, React.ReactNode> = {
	'Dashboard': <span className={styles.icon}>📊</span>,
	'User Management': <span className={styles.icon}>👥</span>,
	'Add Location': <span className={styles.icon}>📍</span>,
	'Content': <span className={styles.icon}>📝</span>,
	'Moderation': <span className={styles.icon}>🛡️</span>,
	'Settings': <span className={styles.icon}>⚙️</span>,
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
	const navItems = [ 'Dashboard', 'User Management', 'Add Location', 'Content', 'Moderation', 'Settings' ];
	return (
		<aside ref={sidebarRef} className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-hidden={!isOpen} aria-label="Sidebar navigation">
			<div>
				<div className={styles.sidebarHeader}>
					<h2>Admin Panel</h2>
					<button onClick={toggle} className={styles.closeBtn} aria-label="Close sidebar">
						&times;
					</button>
				</div>
				<nav className={styles.nav} aria-label="Primary">
					<ul className={styles.navList}>
						<li className={styles.navSectionLabel}>Main</li>
						{navItems.map(item => (
							<li key={item}>
								<button
									type="button"
									className={`${styles.navLink} ${activeLink === item ? styles.navLinkActive : ''}`}
									onClick={() => setActiveLink(item)}
								>
									{iconMap[item]}<span>{item}</span>
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
							{signingOut ? <span className={styles.spinner} aria-label="Signing out" /> : 'Sign out'}
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

const TopBar = ({ toggleSidebar }: { toggleSidebar: () => void }) => (
	<header className={styles.topbar}>
		<div className={styles.topbarLeft}>
			<button onClick={toggleSidebar} className={styles.menuButton}>
				☰
			</button>
			<span className={styles.logo}>MyCaucasus</span>
		</div>
		<div className={styles.topbarRight}>
			<input type="search" placeholder="Search..." className={styles.searchInput} />
			<div className={styles.profile}>
				<span>SA</span>
			</div>
		</div>
	</header>
);

export default function Dashboard() {
	const [ isSidebarOpen, setSidebarOpen ] = useState(true); // Sidebar is open by default on desktop
	const [ activeLink, setActiveLink ] = useState('Dashboard');
	const [ signingOut, setSigningOut ] = useState(false);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();
	const sidebarRef = useRef<HTMLElement>(null);
	const firstFocusRef = useRef<HTMLButtonElement | null>(null);
	const lastFocusRef = useRef<HTMLButtonElement | null>(null);

	// Load persisted active tab
	useEffect(() => {
		try {
			const stored = typeof window !== 'undefined' ? window.localStorage.getItem('admin_active_tab') : null;
			if (stored) setActiveLink(stored);
		} catch {}
	}, []);

	// Persist when activeLink changes
	useEffect(() => {
		try {
			window.localStorage.setItem('admin_active_tab', activeLink);
		} catch {}
	}, [activeLink]);

	// Close sidebar on Escape (mobile / when overlayed)
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isSidebarOpen) {
				setSidebarOpen(false);
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [isSidebarOpen]);

	// Determine mobile mode (basic breakpoint check)
	const isMobile = useCallback(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(max-width: 768px)').matches;
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
			if (!sidebarRef.current.contains(e.target as Node)) {
				setSidebarOpen(false);
			}
		};
		window.addEventListener('keydown', trap);
		document.addEventListener('mousedown', outside);
		return () => window.removeEventListener('keydown', trap);
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
		document.addEventListener('mousedown', outside);
		return () => document.removeEventListener('mousedown', outside);
	}, [isSidebarOpen, isMobile]);

	const toggleSidebar = () => {
		setSidebarOpen(!isSidebarOpen);
	};

	const handleSignOut = async () => {
		if (signingOut) return;
		setSigningOut(true);
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			toast.success('Logged out');
			router.push('/login');
		} catch (err: any) {
			toast.error(err?.message || 'Failed to sign out');
			setSigningOut(false); // allow retry
		}
	};

	const goHome = () => {
		router.push('/');
	};

  const renderContent = () => {
    switch (activeLink) {
      case 'Dashboard':
        return <DashboardWidgets />;
      case 'User Management':
        return <UserManagement />;
			case 'Add Location':
				return <AddLocation />;
      // Add other cases for Content, Moderation, Settings etc.
      default:
        return <DashboardWidgets />;
    }
  };

	return (
		<div className={styles.dashboardLayout}>
			{/* Mobile backdrop */}
			{isSidebarOpen && isMobile() && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
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
				<TopBar toggleSidebar={toggleSidebar} />
				<main className={styles.contentArea}>
					<div style={{ marginTop: activeLink === 'Add Location' ? '0' : '2rem', padding: activeLink === 'Add Location' ? '0' : undefined }}>
						{renderContent()}
					</div>
				</main>
			</div>
		</div>
	);
}
