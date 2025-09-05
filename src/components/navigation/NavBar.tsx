"use client";
import Link from 'next/link';
import './navbar.css';
import { useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { menuItems } from './menuItems';
import type { LangCode, ResolvedNavItem } from './types';

interface NavBarProps {
  lang: LangCode;
  className?: string;
}

// Resolve labels for current language
function resolve(lang: LangCode): ResolvedNavItem[] {
  return menuItems.map(item => ({
    id: item.id,
    label: item.i18n[lang] ?? item.i18n.EN,
    href: item.href,
    badge: item.badge,
    children: item.children?.map(c => ({
      id: c.id,
      label: c.i18n[lang] ?? c.i18n.EN,
      href: c.href,
      badge: c.badge
    }))
  }));
}

export function NavBar({ lang, className = '' }: NavBarProps) {
  const pathname = usePathname();
  const items = resolve(lang);
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimeout = useRef<number | null>(null);

  const open = useCallback((id: string) => {
    if (closeTimeout.current) { window.clearTimeout(closeTimeout.current); closeTimeout.current = null; }
    setOpenId(id);
  }, []);
  const scheduleClose = useCallback(() => {
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
    closeTimeout.current = window.setTimeout(() => { setOpenId(o => (o ? null : o)); }, 160);
  }, []);

  return (
    <nav className={`site-nav ${className}`} aria-label="Main navigation">
      <ul className="site-nav__list">
        {items.map(item => {
          const active = item.href && pathname === item.href;
          const hasChildren = !!item.children?.length;
          const isOpen = openId === item.id;
          return (
            <li
              key={item.id}
              className={`site-nav__item ${active ? 'is-active' : ''} ${hasChildren ? 'has-children' : ''} ${isOpen ? 'is-open' : ''}`}
              onMouseEnter={() => { if (hasChildren) open(item.id); }}
              onMouseLeave={() => { if (hasChildren) scheduleClose(); }}
            > 
              {item.href ? (
                <Link href={item.href} className="site-nav__link">
                  <span className="site-nav__label">{item.label}</span>
                  {hasChildren && <span className="site-nav__caret" aria-hidden="true" />}
                  {item.badge && <span className={`site-nav__badge site-nav__badge--${item.badge.toLowerCase()}`}>{item.badge}</span>}
                </Link>
              ) : (
                <span className="site-nav__link" role="button" tabIndex={0}>
                  <span className="site-nav__label">{item.label}</span>
                  {hasChildren && <span className="site-nav__caret" aria-hidden="true" />}
                </span>
              )}
              {hasChildren && (
                <ul
                  className="site-nav__submenu site-nav__submenu--mega"
                  role="menu"
                  aria-label={item.label}
                  onMouseEnter={() => { if (hasChildren) open(item.id); }}
                  onMouseLeave={() => { if (hasChildren) scheduleClose(); }}
                >
                  {item.children!.map(sub => {
                    const subActive = sub.href && pathname === sub.href;
                    return (
                      <li key={sub.id} className={`site-nav__subitem ${subActive ? 'is-active' : ''}`}> 
                        {sub.href ? (
                          <Link href={sub.href} className="site-nav__sublink">
                            <span className="site-nav__label">{sub.label}</span>
                            {sub.badge && <span className={`site-nav__badge site-nav__badge--${sub.badge.toLowerCase()}`}>{sub.badge}</span>}
                          </Link>
                        ) : (
                          <span className="site-nav__sublink" role="button" tabIndex={0}>{sub.label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
