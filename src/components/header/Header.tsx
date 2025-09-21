"use client";
import { useEffect, useState, useRef } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import Link from 'next/link';
// styles now provided via legacy-globals.css
import { NavBar } from '../navigation/NavBar';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { toast } from '../../lib/toast';
import { onMessagesUpdated } from '@/lib/messagesBus';
import { armSoundEngine } from '@/lib/sound';

export function Header() {
	const [scrolled, setScrolled] = useState(false);
	const [langOpen, setLangOpen] = useState(false);
	// Default language switched to Georgian (KA)
	const [lang, setLang] = useState<'EN' | 'KA' | 'RU' | 'AR' | 'DE'>('KA');
	const [burgerOpen, setBurgerOpen] = useState(false);
	const headerRef = useRef<HTMLElement | null>(null);
	const langWrapRef = useRef<HTMLDivElement | null>(null);
	const closeLangTimeout = useRef<number | null>(null);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
	const [searchOpen, setSearchOpen] = useState(false);
	const searchWrapRef = useRef<HTMLDivElement | null>(null);
	// Track input method & open mode for language dropdown
	const isCoarseRef = useRef(false);
	const langOpenModeRef = useRef<null | 'hover' | 'click'>(null);
	const [isMobileView, setIsMobileView] = useState(false);
	// Auth state
	const [user, setUser] = useState<User | null>(null);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userWrapRef = useRef<HTMLDivElement | null>(null);
	const userCloseTimeout = useRef<number | null>(null);
	const userOpenModeRef = useRef<null | 'hover' | 'click'>(null);
	const [userDropdownPos, setUserDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
	const supabase = createSupabaseBrowserClient();
	const lastUnreadRef = useRef<number>(-1);
	// Acknowledge bell once user clicks it (stop ringing until next mount)
	const [bellAck, setBellAck] = useState(false);
	// Mobile profile dropdown (burger menu) state
	const [profileOpen, setProfileOpen] = useState(false);
	// Derive avatar url & initial
	const avatarUrl = (user?.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || null;
	const userEmail: string | undefined = user?.email || (user?.user_metadata?.email as string | undefined);
	const userName: string | undefined = (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined);
	const initial = (userName || userEmail || '').trim().charAt(0).toUpperCase();
	const userStatus: string | undefined = (user?.user_metadata?.status as string | undefined);
	const messages = Array.isArray((user?.user_metadata as any)?.messages) ? ((user?.user_metadata as any)?.messages as any[]) : [];
	const unreadCount = messages.filter((m: any) => m && m.unread).length;
	const statusLc = (userStatus || '').toLowerCase();
	const isInactive = statusLc === 'inactive';
	const isPending = statusLc === 'pending';
	const isRejected = statusLc === 'rejected';
	const isActive = statusLc === 'active';

	// Detect coarse pointer (touch) to disable hover open/close logic on mobile
	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return;
		const mq = window.matchMedia('(pointer: coarse)');
		const set = () => { isCoarseRef.current = mq.matches; };
		set();
		mq.addEventListener('change', set);
		return () => mq.removeEventListener('change', set);
	}, []);

	// Load session and subscribe to auth changes
	useEffect(() => {
		let mounted = true;
		// Arm sound engine on first interaction so that future programmatic sounds are allowed by browsers
		armSoundEngine();
			supabase.auth.getSession().then(({ data: { session } }) => {
			if (!mounted) return;
			setUser(session?.user ?? null);
		});
			const { data: sub } = supabase.auth.onAuthStateChange(
			(event: AuthChangeEvent, session: Session | null) => {
				setUser(session?.user ?? null);
									// Do not toast on SIGNED_IN here; some browsers emit SIGNED_IN on tab focus/session refresh.
									// Success toasts are shown via flash after explicit login/registration flows only.
				if (!session) setUserMenuOpen(false);
			}
		);
			// Subscribe to messages bus to update unread badge live
					const off = onMessagesUpdated(({ unread }) => {
				// Force a shallow update to trigger re-render of unread badge.
				// We rely on user.user_metadata for base data; the badge overrides count reactively.
				// Store count in a CSS variable friendly way via state or layout effect; here we re-render by updating a dummy state.
					setUser((u) => {
					if (!u) return u;
					const md: any = u.user_metadata || {};
					// Do not mutate original object; clone minimal wrapper
					return {
						...u,
						user_metadata: { ...md, __unread_override: unread },
					} as any;
				});
			});
		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
				off();
		};
	}, [supabase]);

	// Lightweight polling for new messages (until we move to a realtime table)
	useEffect(() => {
		let timer: number | null = null;
		let disposed = false;
		const POLL_MS = 25000;
		const fetchMessages = async (refresh = false) => {
			try {
				if (refresh) {
					await supabase.auth.refreshSession();
				}
				const { data: { user } } = await supabase.auth.getUser();
				if (!user) return;
				const md: any = user.user_metadata || {};
				const msgs: any[] = Array.isArray(md.messages) ? md.messages : [];
				const unread = msgs.reduce((acc, m) => acc + (m?.unread ? 1 : 0), 0);
				if (unread !== lastUnreadRef.current) {
					lastUnreadRef.current = unread;
					// Trigger a re-render with override and broadcast
					setUser((u) => (u ? ({ ...u, user_metadata: { ...(u.user_metadata as any), __unread_override: unread } } as any) : u));
					// Do not emit full messages from header (unknown), only broadcast count via bus using messages null
					// Note: NotificationsFeed will independently fetch full messages on bus event
					try {
						window.dispatchEvent(new CustomEvent('mc:messages', { detail: { messages: null, unread } } as any));
						localStorage.setItem('mc:messages', JSON.stringify({ ts: Date.now(), unread }));
					} catch {}
				}
			} catch {}
		};
		// First run quickly
		fetchMessages(false);
		// Polling interval
		timer = window.setInterval(() => { fetchMessages(false); }, POLL_MS);
		// Refresh on focus/visibility change
		const onFocus = () => fetchMessages(true);
		window.addEventListener('focus', onFocus);
		const onVis = () => { if (document.visibilityState === 'visible') fetchMessages(true); };
		document.addEventListener('visibilitychange', onVis);
		return () => {
			disposed = true;
			if (timer) window.clearInterval(timer);
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVis);
		};
	}, [supabase]);

	// Close user menu on outside click / escape
	useEffect(() => {
		if (!userMenuOpen) return;
		const onClick = (e: MouseEvent) => {
			if (userWrapRef.current && !userWrapRef.current.contains(e.target as Node)) {
				setUserMenuOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUserMenuOpen(false); };
		document.addEventListener('mousedown', onClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onClick);
			document.removeEventListener('keydown', onKey);
		};
	}, [userMenuOpen]);

	// Recalculate user dropdown fixed position (align to header bottom, right-aligned to icon)
	useEffect(() => {
		if (!userMenuOpen) return;
		const calc = () => {
			if (!headerRef.current || !userWrapRef.current) return;
			const headerRect = headerRef.current.getBoundingClientRect();
			const wrapRect = userWrapRef.current.getBoundingClientRect();
			setUserDropdownPos({
				top: Math.round(headerRect.bottom),
				right: Math.round(window.innerWidth - wrapRect.right)
			});
		};
		calc();
		window.addEventListener('resize', calc);
		window.addEventListener('scroll', calc, { passive: true });
		return () => {
			window.removeEventListener('resize', calc);
			window.removeEventListener('scroll', calc);
		};
	}, [userMenuOpen]);

	// Close dropdown on outside click / escape
	useEffect(() => {
		if (!langOpen) return;
		const onClick = (e: MouseEvent) => {
			if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node)) {
				setLangOpen(false);
				langOpenModeRef.current = null;
			}
		};
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLangOpen(false); };
		document.addEventListener('mousedown', onClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onClick);
			document.removeEventListener('keydown', onKey);
		};
	}, [langOpen]);

	// Close search on outside click / escape
	useEffect(() => {
		if (!searchOpen) return;
		const onClick = (e: MouseEvent) => {
			if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
				setSearchOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
		document.addEventListener('mousedown', onClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onClick);
			document.removeEventListener('keydown', onKey);
		};
	}, [searchOpen]);

	// Recalculate dropdown absolute viewport position so it starts exactly at header bottom
	useEffect(() => {
		if (!langOpen) return;
		const calc = () => {
			if (!headerRef.current || !langWrapRef.current) return;
			const headerRect = headerRef.current.getBoundingClientRect();
			const wrapRect = langWrapRef.current.getBoundingClientRect();
			setDropdownPos({
				top: Math.round(headerRect.bottom),
				right: Math.round(window.innerWidth - wrapRect.right)
			});
		};
		calc();
		window.addEventListener('resize', calc);
		window.addEventListener('scroll', calc, { passive: true });
		return () => {
			window.removeEventListener('resize', calc);
			window.removeEventListener('scroll', calc);
		};
	}, [langOpen]);

	useEffect(() => {
		const onScroll = () => {
			setScrolled(window.scrollY > 12);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// Track viewport <= 820px for mobile menu conditional rendering
	useEffect(() => {
		const mq = window.matchMedia('(max-width: 820px)');
		const apply = () => setIsMobileView(mq.matches);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	}, []);

	const languages = [
		{ code: 'EN', label: 'English', cc: 'gb' },
		{ code: 'KA', label: 'ქართული', cc: 'ge' },
		{ code: 'RU', label: 'Русский', cc: 'ru' },
		{ code: 'AR', label: 'العربية', cc: 'sa' },
		{ code: 'DE', label: 'Deutsch', cc: 'de' }
	] as const;

			// Consume any flash on first paint (e.g., after redirect)
		useEffect(() => { toast.flashConsume(); }, []);

		return (
		<>
		<header ref={headerRef} className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
			<div className="site-header__inner">
		<Link href="/" className="site-header__logo" aria-label="მთავარ გვერდზე გადასვლა">
				<span>myCaucasus</span>
			</Link>
		<NavBar lang={lang} className="site-header__nav hide-on-mobile" />
			<div className="site-header__actions">
				<div className={`site-header__search ${searchOpen ? 'is-open' : ''} hide-on-mobile`} ref={searchWrapRef}>
			<form role="search" aria-label="საიტზე ძებნა" onSubmit={(e)=>{e.preventDefault();}}>
					<input
						id="site-search-input"
						className="site-header__search-input"
						type="search"
				placeholder="ძიება..."
						autoComplete="off"
						spellCheck={false}
					/>
				</form>
				</div>
				<button
					className="icon-btn hide-on-mobile"
					type="button"
			aria-label="ძიება"
					aria-expanded={searchOpen}
					aria-controls="site-search-input"
					onClick={() => {
						setSearchOpen(o => !o);
						setTimeout(() => {
							if (!searchOpen && searchWrapRef.current) {
								const input = searchWrapRef.current.querySelector('input');
								input && (input as HTMLInputElement).focus();
							}
						}, 10);
					}}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
				</button>
			{(() => {
				const unreadOverride = (user?.user_metadata as any)?.__unread_override;
				const effectiveUnread = typeof unreadOverride === 'number' ? unreadOverride : unreadCount;
				const shouldRing = effectiveUnread > 0 && !bellAck;
				return (
					<button
						className={`icon-btn hide-on-mobile ${shouldRing ? 'is-ringing' : ''}`}
						type="button"
						aria-label={`შეტყობინებები${effectiveUnread ? `: ${effectiveUnread}` : ''}`}
						onClick={() => { setBellAck(true); window.location.assign('/notifications'); }}
						style={{ position: 'relative' }}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true" className="icon-bell">
							<path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z" />
						</svg>
						{effectiveUnread > 0 && (
							<span aria-label={`ახალი შეტყობინებები ${effectiveUnread}`}
								style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', borderRadius: 12, minWidth: 16, height: 16, padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, lineHeight: '16px' }}>
								{effectiveUnread > 99 ? '99+' : effectiveUnread}
							</span>
						)}
					</button>
				);
			})()}
			<button className="icon-btn hide-on-mobile" type="button" aria-label="რჩეულები">
					<svg viewBox="0 0 24 24" aria-hidden="true" className="icon-heart">
						<path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.9 0 3.6 1.13 4.5 2.88C11.9 5.13 13.6 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35Z" />
					</svg>
				</button>
				{!user ? (
			<Link href="/login" className="icon-btn hide-on-mobile" aria-label="შესვლა">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="12" cy="8" r="4" />
						<path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
					</svg>
				</Link>
				) : (
					<div
						className="site-header__user-wrap hide-on-mobile"
						ref={userWrapRef}
						onMouseEnter={() => {
							if (isCoarseRef.current) return;
							if (userCloseTimeout.current) {
								clearTimeout(userCloseTimeout.current);
								userCloseTimeout.current = null;
							}
							if (!userMenuOpen) {
								userOpenModeRef.current = 'hover';
								setUserMenuOpen(true);
							}
						}}
						onMouseLeave={() => {
							if (isCoarseRef.current) return;
							if (userOpenModeRef.current !== 'hover') return;
							if (userCloseTimeout.current) clearTimeout(userCloseTimeout.current);
							userCloseTimeout.current = window.setTimeout(() => {
								if (userOpenModeRef.current === 'hover') {
									setUserMenuOpen(false);
									userOpenModeRef.current = null;
								}
							}, 160);
						}}
					>
						<button
							className="icon-btn site-header__avatar-btn"
							type="button"
							aria-label="პროფილის მენიუ"
							aria-haspopup="menu"
							aria-expanded={userMenuOpen}
							onClick={() => {
								setUserMenuOpen(o => {
									const next = !o;
									if (next) {
										userOpenModeRef.current = 'click';
									} else {
										userOpenModeRef.current = null;
									}
									return next;
								});
							}}
							style={{ position: 'relative' }}
						>
							{avatarUrl ? (
								<span className="site-header__avatar" aria-hidden="true">
									<Image src={avatarUrl} alt="" fill sizes="40px" />
								</span>
							) : (
								<span className="site-header__avatar site-header__avatar--fallback" aria-hidden="true">{initial || 'U'}</span>
							)}
							{/* Notification badge moved to bell icon; keep avatar clean */}
						</button>
						{userMenuOpen && (
							<ul
								className="user-dropdown lang-dropdown lang-dropdown--fixed"
								role="menu"
								style={{ position: 'fixed', top: userDropdownPos.top, right: userDropdownPos.right, marginTop: 0 }}
							>
								{(isInactive || isRejected) && (
									<li className="lang-dropdown__item" role="none">
										<Link className="lang-dropdown__btn" href="/verify/complete" role="menuitem" onClick={() => setUserMenuOpen(false)}>
											<span className="lang-dropdown__label">დაასრულე ვერიფიკაცია</span>
										</Link>
									</li>
								)}
								{isPending && (
									<li className="lang-dropdown__item" role="none">
										<button className="lang-dropdown__btn" type="button" disabled aria-disabled="true">
											<span className="lang-dropdown__label">ვერიფიკაცია pending</span>
										</button>
									</li>
								)}
								{isActive && (
									<li className="lang-dropdown__item" role="none">
										<Link className="lang-dropdown__btn" href="/profile" role="menuitem" onClick={() => setUserMenuOpen(false)}>
											<span className="lang-dropdown__label">დაშბორდი</span>
										</Link>
									</li>
								)}
								{messages.length > 0 && (
									<li className="lang-dropdown__item" role="none">
										<Link className="lang-dropdown__btn" href="/notifications" role="menuitem" onClick={() => setUserMenuOpen(false)}>
											<span className="lang-dropdown__label">შეტყობინებები</span>
											{(() => { const n = ((user?.user_metadata as any)?.__unread_override ?? unreadCount) as number; return n > 0 ? (<span className="lang-dropdown__badge" aria-label={`ახალი შეტყობინებები ${n}`}>{n > 99 ? '99+' : n}</span>) : null; })()}
										</Link>
									</li>
								)}
								<li className="lang-dropdown__item" role="none">
									<Link className="lang-dropdown__btn" href="/profile" role="menuitem" onClick={() => setUserMenuOpen(false)}>
										<span className="lang-dropdown__label">პროფილი</span>
									</Link>
								</li>
								<li className="lang-dropdown__item" role="none">
									<button
										className="lang-dropdown__btn"
										role="menuitem"
																				onClick={async () => {
																					const ok = window.confirm('დაადასტურე გასვლა?');
																					if (!ok) return;
																					await supabase.auth.signOut();
																					setUserMenuOpen(false);
																					toast.info('გასვლა შესრულდა');
																					window.location.assign('/login');
																				}}
										type="button"
									>
										<span className="lang-dropdown__label">გასვლა</span>
									</button>
								</li>
							</ul>
						)}
					</div>
				)}
				<div
					className="site-header__lang-wrap"
					ref={langWrapRef}
					onMouseEnter={() => {
						if (isCoarseRef.current) return; // skip hover logic on touch
						if (closeLangTimeout.current) {
							clearTimeout(closeLangTimeout.current);
							closeLangTimeout.current = null;
						}
						if (!langOpen) {
							langOpenModeRef.current = 'hover';
							setLangOpen(true);
						}
					}}
					onMouseLeave={() => {
						if (isCoarseRef.current) return;
						// Only auto-close if it was opened by hover
						if (langOpenModeRef.current !== 'hover') return;
						if (closeLangTimeout.current) clearTimeout(closeLangTimeout.current);
						closeLangTimeout.current = window.setTimeout(() => {
							if (langOpenModeRef.current === 'hover') {
								setLangOpen(false);
								langOpenModeRef.current = null;
							}
						}, 160);
					}}
				>
					<button
						className="site-header__lang-btn has-caret"
						type="button"
						aria-label="ენის შეცვლა"
						aria-haspopup="listbox"
						aria-expanded={langOpen ? 'true' : 'false'}
						onClick={() => {
							setLangOpen(o => {
								const next = !o;
								if (next) {
									langOpenModeRef.current = 'click';
								} else {
									langOpenModeRef.current = null;
								}
								return next;
							});
						}}
					>
						{lang}
					</button>
					{langOpen && (
						<ul
							className="lang-dropdown lang-dropdown--fixed"
							role="listbox"
							aria-label="ენის არჩევა"
							style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, marginTop: 0 }}
						>
							{languages.map(item => (
								<li key={item.code} className="lang-dropdown__item" role="none">
									<button
										className="lang-dropdown__btn"
										role="option"
										aria-selected={lang === item.code ? 'true' : 'false'}
										aria-checked={lang === item.code ? 'true' : 'false'}
										onClick={() => { setLang(item.code); setLangOpen(false); langOpenModeRef.current = null; }}
										type="button"
									>
										<span className={`lang-dropdown__flag fi fi-${item.cc}`} aria-hidden="true" />
										<span className="lang-dropdown__label">{item.label}</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
				{/* Mobile bell: place between language switcher and burger */}
				{isMobileView && (() => {
					const unreadOverride = (user?.user_metadata as any)?.__unread_override;
					const effectiveUnread = typeof unreadOverride === 'number' ? unreadOverride : unreadCount;
					const shouldRing = effectiveUnread > 0 && !bellAck;
					return (
						<button
							className={`icon-btn ${shouldRing ? 'is-ringing' : ''}`}
							type="button"
							aria-label={`შეტყობინებები${effectiveUnread ? `: ${effectiveUnread}` : ''}`}
							onClick={() => { setBellAck(true); window.location.assign('/notifications'); }}
							style={{ position: 'relative' }}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true" className="icon-bell">
								<path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z" />
							</svg>
								{effectiveUnread > 0 && (
									<span aria-label={`ახალი შეტყობინებები ${effectiveUnread}`}
										style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', borderRadius: 12, minWidth: 16, height: 16, padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, lineHeight: '16px' }}>
										{effectiveUnread > 99 ? '99+' : effectiveUnread}
									</span>
								)}
						</button>
					);
				})()}
				{isMobileView && (
					<button
						className="site-header__burger"
						type="button"
						aria-label={burgerOpen ? 'მენიუს დახურვა' : 'მენიუს გახსნა'}
						aria-expanded={burgerOpen}
						aria-controls="mobile-menu-panel"
						onClick={() => setBurgerOpen(o => !o)}
					>
						<span className="site-header__burger-bars" />
					</button>
				)}
			</div>
		</div>
	</header>
	{isMobileView && (
		<>
			{/* Mobile slide-out panel */}
			<div
				id="mobile-menu-panel"
				className={`site-header__menu-panel ${burgerOpen ? 'is-open' : ''}`}
				role="dialog"
				aria-modal="true"
				aria-label="მთავარი მენიუ"
			>
				<div className="menu-panel__head">
					<span className="menu-panel__title">მენიუ</span>
					<div className="menu-panel__head-actions">
						<button className="icon-btn menu-panel__fav" type="button" aria-label="რჩეულები">
							<svg viewBox="0 0 24 24" aria-hidden="true" className="icon-heart">
								<path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.9 0 3.6 1.13 4.5 2.88C11.9 5.13 13.6 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35Z" />
							</svg>
						</button>
						<button className="icon-btn menu-panel__close" aria-label="მენიუს დახურვა" onClick={() => setBurgerOpen(false)}>
							<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
						</button>
					</div>
				</div>
				<div className="site-header__menu-scroll">
					<div className="menu-panel__section">
						<form role="search" aria-label="საიტზე ძებნა" className="menu-panel__search" onSubmit={(e)=>e.preventDefault()}>
							<input type="search" placeholder="ძებნა..." className="menu-panel__search-input" />
						</form>
					</div>
					<div className="menu-panel__section" aria-label="ნავიგაცია">
					{user && (
						<div className="menu-panel__section" aria-label="პროფილი">
							<nav className="site-nav site-nav--mobile" aria-label="პროფილის მენიუ">
								<ul className="site-nav__list">
									<li className={`site-nav__item has-children ${profileOpen ? 'is-open' : ''}`}> 
										<button
											type="button"
											className="site-nav__link site-nav__link--btn menu-panel__action"
											aria-expanded={profileOpen}
											onClick={() => setProfileOpen(o => !o)}
										>
											<span className="site-nav__icon site-header__avatar-icon" aria-hidden="true" style={{ position: 'relative', display: 'inline-flex' }}>
												{avatarUrl ? (
													<Image src={avatarUrl} alt="" width={20} height={20} />
												) : (
													<span className="site-header__avatar-icon site-header__avatar-icon--fallback" aria-hidden="true" style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{initial || 'U'}</span>
												)}
												{/* Notification badge removed from profile in mobile menu as well */}
											</span>
											<span className="site-nav__label">პროფილი</span>
											<span className="site-nav__spacer" />
											<span className="site-nav__caret" aria-hidden="true" />
										</button>
										<ul className="site-nav__submenu site-nav__submenu--mobile" role="menu" aria-label="პროფილი">
											{(isInactive || isRejected) && (
												<li className="site-nav__subitem">
													<Link href="/verify/complete" className="site-nav__sublink menu-panel__action" onClick={() => { setBurgerOpen(false); setProfileOpen(false); }}>
														<span className="site-nav__icon" aria-hidden="true">
															<svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.2.9-5.5-4-3.9 5.5-.8L12 3z" fill="currentColor"/></svg>
														</span>
														<span className="site-nav__label">დაასრულე ვერიფიკაცია</span>
													</Link>
												</li>
											)}
											<li className="site-nav__subitem">
												<Link href="/profile" className="site-nav__sublink menu-panel__action" onClick={() => { setBurgerOpen(false); setProfileOpen(false); }}>
													<span className="site-nav__icon" aria-hidden="true">
														<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="4" width="6" height="6" rx="1" fill="currentColor" /><rect x="3" y="14" width="6" height="6" rx="1" fill="currentColor" /><rect x="13" y="4" width="8" height="6" rx="1" fill="currentColor" /><rect x="13" y="14" width="8" height="6" rx="1" fill="currentColor" /></svg>
													</span>
													<span className="site-nav__label">დაფა</span>
												</Link>
											</li>
											{messages.length > 0 && (
												<li className="site-nav__subitem">
													<Link href="/notifications" className="site-nav__sublink menu-panel__action" onClick={() => { setBurgerOpen(false); setProfileOpen(false); }}>
														<span className="site-nav__icon" aria-hidden="true">
															<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z" fill="currentColor"/></svg>
														</span>
														<span className="site-nav__label">შეტყობინებები{unreadCount ? ` (${unreadCount})` : ''}</span>
													</Link>
												</li>
											)}
											<li className="site-nav__subitem">
												<Link href="/profile/settings" className="site-nav__sublink menu-panel__action" onClick={() => { setBurgerOpen(false); setProfileOpen(false); }}>
													<span className="site-nav__icon" aria-hidden="true">
														<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="currentColor" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 3a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09c0 .69.4 1.31 1 1.51.61.2 1.28.05 1.75-.42l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.45.45-.58 1.12-.42 1.75.2.61.82 1 1.51 1H22a2 2 0 0 1 0 4h-.09c-.69 0-1.31.4-1.51 1Z" fill="currentColor" /></svg>
													</span>
													<span className="site-nav__label">პარამეტრები</span>
												</Link>
											</li>
										</ul>
									</li>
								</ul>
							</nav>
						</div>
					)}
						<NavBar lang={lang} variant="mobile" />
					</div>
						<div className="menu-panel__section menu-panel__actions" aria-label="ქმედებები">
							<button className="menu-panel__action" type="button" aria-label="შეტყობინებები" onClick={() => { setBellAck(true); window.location.assign('/notifications'); }}>
								<svg viewBox="0 0 24 24" aria-hidden="true" className="icon-bell"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"/></svg>
								<span>შეტყობინებები</span>
							</button>
						{!user ? (
							<Link className="menu-panel__action" href="/login" aria-label="შესვლა" onClick={() => setBurgerOpen(false)}>
								<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
								<span>შესვლა</span>
							</Link>
						) : (
							<>
																<button className="menu-panel__action" type="button" onClick={async ()=>{
																	const ok = window.confirm('დაადასტურე გასვლა?');
																	if (!ok) return;
																	await supabase.auth.signOut();
																	setBurgerOpen(false);
																	toast.info('გასვლა შესრულდა');
																	window.location.assign('/login');
																}}>
									<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
									<span>გასვლა</span>
								</button>
							</>
						)}
					</div>
				</div>
			</div>
			{burgerOpen && <div className="site-header__menu-backdrop" onClick={() => setBurgerOpen(false)} aria-hidden="true" />}
		</>
	)}
		</>
	);
}
