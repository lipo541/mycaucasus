"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import './header.css';
import { NavBar } from '../navigation/NavBar';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<'EN' | 'KA' | 'RU' | 'AR' | 'DE'>('EN');
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

  // Detect coarse pointer (touch) to disable hover open/close logic on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const set = () => { isCoarseRef.current = mq.matches; };
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

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

  return (
    <>
    <header ref={headerRef} className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="Go to homepage">
          <span>myCaucasus</span>
        </Link>
  <NavBar lang={lang} className="site-header__nav" />
        <div className="site-header__actions">
          <div className={`site-header__search ${searchOpen ? 'is-open' : ''} hide-on-mobile`} ref={searchWrapRef}>
            <form role="search" aria-label="Site search" onSubmit={(e)=>{e.preventDefault();}}>
              <input
                id="site-search-input"
                className="site-header__search-input"
                type="search"
                placeholder="Search..."
                autoComplete="off"
                spellCheck={false}
                aria-expanded={searchOpen ? 'true' : 'false'}
              />
            </form>
          </div>
          <button
            className="icon-btn hide-on-mobile"
            type="button"
            aria-label="Search"
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
          <button className="icon-btn hide-on-mobile" type="button" aria-label="Map">
            <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          </button>
          <button className="icon-btn hide-on-mobile" type="button" aria-label="Favorites">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-heart">
              <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.9 0 3.6 1.13 4.5 2.88C11.9 5.13 13.6 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35Z" />
            </svg>
          </button>
            <button className="icon-btn hide-on-mobile" type="button" aria-label="Log in">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </button>
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
              aria-label="Change language"
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
                aria-label="Select language"
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
          {isMobileView && (
            <button
              className="site-header__burger"
              type="button"
              aria-label={burgerOpen ? 'Close menu' : 'Open menu'}
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
          aria-label="Main menu"
        >
          <div className="menu-panel__head">
            <span className="menu-panel__title">Menu</span>
            <div className="menu-panel__head-actions">
              <button className="icon-btn menu-panel__fav" type="button" aria-label="Favorites">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-heart">
                  <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.9 0 3.6 1.13 4.5 2.88C11.9 5.13 13.6 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35Z" />
                </svg>
              </button>
              <button className="icon-btn menu-panel__close" aria-label="Close menu" onClick={() => setBurgerOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
              </button>
            </div>
          </div>
          <div className="menu-panel__section">
            <form role="search" aria-label="Site search" className="menu-panel__search" onSubmit={(e)=>e.preventDefault()}>
              <input type="search" placeholder="Search..." className="menu-panel__search-input" />
            </form>
          </div>
          <div className="menu-panel__section menu-panel__actions" aria-label="Actions">
            <button className="menu-panel__action" type="button" aria-label="Map">
              <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              <span>Map</span>
            </button>
            <button className="menu-panel__action" type="button" aria-label="Log in">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
              <span>Log in</span>
            </button>
          </div>
        </div>
        {burgerOpen && <div className="site-header__menu-backdrop" onClick={() => setBurgerOpen(false)} aria-hidden="true" />}
      </>
    )}
    </>
  );
}
