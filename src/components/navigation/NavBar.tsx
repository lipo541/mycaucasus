"use client";
import Link from 'next/link';
// styles now provided via legacy-globals.css
import { useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { menuItems } from './menuItems';
import { IoPeople, IoLocationSharp, IoAirplane, IoSchool, IoFlask, IoShieldCheckmark, IoAlbums, IoConstruct, IoWarning, IoMap, IoChatbubbles, IoTrailSign, IoSunny, IoBusiness, IoHome, IoList, IoPodium, IoMedal, IoLayers, IoSnow, IoRefresh } from 'react-icons/io5';
// Icon map per top-level id or test category id
const iconFor = (id: string) => {
  switch (id) {
    case 'pilots': return <IoPeople />;
    case 'locations': return <IoLocationSharp />;
    case 'tours': return <IoAirplane />;
    case 'courses': return <IoSchool />;
    case 'tests': return <IoFlask />;
    case 'about-us': return <IoChatbubbles />;
    case 'test-safety': return <IoShieldCheckmark />;
    case 'test-air-law': return <IoShieldCheckmark />;
    case 'test-meteorology': return <IoFlask />;
    case 'test-aerodynamics': return <IoAirplane />;
    case 'test-navigation': return <IoMap />;
    case 'test-equipment': return <IoConstruct />;
    case 'test-emergency': return <IoWarning />;
    case 'test-local-regs': return <IoAlbums />;
  // Location specific icons
  case 'loc-gudauri': return <IoTrailSign />; // mountain / trail style
  case 'loc-mestia': return <IoTrailSign />;  // also mountain
  case 'loc-ananuri': return <IoHome />;      // castle/fort placeholder (could switch to different set later)
  case 'loc-rustavi-tbilisi': return <IoBusiness />; // industrial / city
  case 'loc-gonio': return <IoSunny />;       // sun / sea
  // Pilots submenu
  case 'pilots-directory': return <IoList />;
  case 'pilots-ranking': return <IoPodium />;
  case 'pilots-certification': return <IoMedal />;
  case 'pilots-community': return <IoChatbubbles />;
  // Tours submenu
  case 'tours-all': return <IoLayers />;
  case 'tours-training': return <IoSchool />;
  case 'tours-tandem': return <IoPeople />;
  case 'tours-mountain': return <IoTrailSign />;
  case 'tours-heliski': return <IoSnow />;
  // Courses submenu
  case 'course-basic-training': return <IoSchool />;
  case 'course-safety': return <IoShieldCheckmark />;
  case 'course-pilot-refresh': return <IoRefresh />;
    default: return null;
  }
};
import type { LangCode, ResolvedNavItem } from './types';

interface NavBarProps {
  lang: LangCode;
  className?: string;
  variant?: 'desktop' | 'mobile';
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

export function NavBar({ lang, className = '', variant = 'desktop' }: NavBarProps) {
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

  const isMobileVariant = variant === 'mobile';

  return (
    <nav className={`site-nav ${className} ${isMobileVariant ? 'site-nav--mobile' : ''}`} aria-label="მთავარი ნავიგაცია">
      <ul className="site-nav__list">
        {items.map(item => {
          const active = item.href && pathname === item.href;
          const hasChildren = !!item.children?.length;
          const isOpen = openId === item.id;
          return (
            <li
              key={item.id}
              className={`site-nav__item ${active ? 'is-active' : ''} ${hasChildren ? 'has-children' : ''} ${isOpen ? 'is-open' : ''}`}
              onMouseEnter={() => { if (!isMobileVariant && hasChildren) open(item.id); }}
              onMouseLeave={() => { if (!isMobileVariant && hasChildren) scheduleClose(); }}
            > 
              {(() => {
                const content = (
                  <span className="site-nav__label">{item.label}</span>
                );
                if (isMobileVariant) {
                  // In mobile variant if item has children we toggle on click instead of navigating directly
                  if (hasChildren) {
                    return (
                      <button
                        type="button"
                        className="site-nav__link site-nav__link--btn menu-panel__action"
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(o => (o === item.id ? null : item.id))}
                      >
                        <span className="site-nav__icon" aria-hidden="true">{iconFor(item.id)}</span>
                        {content}
                        <span className="site-nav__spacer" />
                        {hasChildren && <span className="site-nav__caret" aria-hidden="true" />}
                        {item.badge && <span className={`site-nav__badge site-nav__badge--${item.badge.toLowerCase()}`}>{item.badge}</span>}
                      </button>
                    );
                  }
                }
                // Desktop or mobile leaf
                if (item.href) {
                  return (
                    <Link href={item.href} className={`site-nav__link ${isMobileVariant ? 'menu-panel__action' : ''}`}>
                      {isMobileVariant && <span className="site-nav__icon" aria-hidden="true">{iconFor(item.id)}</span>}
                      {content}
                      <span className="site-nav__spacer" />
                      {hasChildren && <span className="site-nav__caret" aria-hidden="true" />}
                      {item.badge && <span className={`site-nav__badge site-nav__badge--${item.badge.toLowerCase()}`}>{item.badge}</span>}
                    </Link>
                  );
                }
                return (
                  <span className="site-nav__link" role="button" tabIndex={0}>
                    {isMobileVariant && <span className="site-nav__icon" aria-hidden="true">{iconFor(item.id)}</span>}
                    {content}
                    {hasChildren && <span className="site-nav__caret" aria-hidden="true" />}
                  </span>
                );
              })()}
              {hasChildren && (
                <ul
                  className={`site-nav__submenu ${isMobileVariant ? 'site-nav__submenu--mobile' : 'site-nav__submenu--mega'}`}
                  role="menu"
                  aria-label={item.label}
                  onMouseEnter={() => { if (!isMobileVariant && hasChildren) open(item.id); }}
                  onMouseLeave={() => { if (!isMobileVariant && hasChildren) scheduleClose(); }}
                >
                  {item.children!.map(sub => {
                    const subActive = sub.href && pathname === sub.href;
                    return (
                      <li key={sub.id} className={`site-nav__subitem ${subActive ? 'is-active' : ''}`}> 
                        {sub.href ? (
                          <Link href={sub.href} className={`site-nav__sublink ${isMobileVariant ? 'menu-panel__action' : ''}`}>
                            {isMobileVariant && <span className="site-nav__icon" aria-hidden="true">{iconFor(sub.id)}</span>}
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
