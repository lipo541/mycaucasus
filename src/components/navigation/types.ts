export type LangCode = 'EN' | 'KA' | 'RU' | 'AR' | 'DE';

export interface NavItem {
  id: string;
  href?: string;               // route path
  i18n: Record<LangCode, string>;
  children?: NavItem[];        // dropdown / nested
  badge?: 'NEW' | 'HOT' | 'BETA';
  desktopOnly?: boolean;
  mobileOnly?: boolean;
}

export interface GetNavOptions {
  lang: LangCode;
  filter?: (item: NavItem) => boolean;
}

export interface ResolvedNavItem {
  id: string;
  label: string;
  href?: string;
  children?: ResolvedNavItem[];
  badge?: string;
}
