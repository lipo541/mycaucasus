export interface HeroPanel {
  id: number;
  title: string;
  desc: string;
  /** primary background (prefer modern format) */
  bg: string;
  /** optional fallback jpg if you later want progressive enhancement */
  fallbackBg?: string;
  /** responsive variants (largest first or unordered) */
  variants?: { width: number; webp: string; jpg?: string }[];
  /** optional thumbnail (small square-ish preview) */
  thumb?: string;
  /** optional webp thumbnail */
  thumbWebp?: string;
  /** per-panel call-to-action buttons */
  ctas?: { label: string; href: string; variant?: 'primary' | 'secondary'; ariaLabel?: string }[];
}

// Current images normalized:
//  - tandem.jpg (copied from wp4472199.jpg original mountain)
//  - training.jpg
//  - community.jpg
// (Original wp4472199.jpg retained as legacy copy.)
// Consider adding optimized WebP versions (tandem.webp, training.webp, community.webp) and then switching bg values.
const mountainFallback = '/assets/hero/tandem.jpg';

export const HERO_PANELS: HeroPanel[] = [
  {
    id: 0,
    title: 'Tandem Flights',
  desc: 'Enjoy a safe scenic tandem flight over the Caucasus with a certified pilot. Modern gear, flexible weather windows and optional HD photos or video.',
    bg: '/assets/hero/tandem-1920.webp',
    fallbackBg: '/assets/hero/tandem.jpg',
  thumb: '/assets/hero/tandem-320.jpg',
  thumbWebp: '/assets/hero/tandem-320.webp',
    ctas: [
  { label: 'Book Flight →', href: '#booking', variant: 'primary', ariaLabel: 'Book a tandem flight' },
  { label: 'Pricing', href: '#pricing', variant: 'secondary' },
    ],
    variants: [
      { width: 960, webp: '/assets/hero/tandem-960.webp', jpg: '/assets/hero/tandem-960.jpg' },
      { width: 1600, webp: '/assets/hero/tandem-1600.webp', jpg: '/assets/hero/tandem-1600.jpg' },
      { width: 1920, webp: '/assets/hero/tandem-1920.webp', jpg: '/assets/hero/tandem-1920.jpg' },
    ],
  },
  {
    id: 1,
    title: 'Licensing & Training',
  desc: 'Learn to fly step by step: basics, safe control, rising air and first distance flights. Clear modules, friendly instructors and a digital progress log.',
    bg: '/assets/hero/training-1920.webp',
    fallbackBg: '/assets/hero/training.jpg',
  thumb: '/assets/hero/training-320.jpg',
  thumbWebp: '/assets/hero/training-320.webp',
    ctas: [
  { label: 'Courses →', href: '#courses', variant: 'primary', ariaLabel: 'Training courses' },
  { label: 'Licensing', href: '#licensing', variant: 'secondary' },
    ],
    variants: [
      { width: 960, webp: '/assets/hero/training-960.webp', jpg: '/assets/hero/training-960.jpg' },
      { width: 1600, webp: '/assets/hero/training-1600.webp', jpg: '/assets/hero/training-1600.jpg' },
      { width: 1920, webp: '/assets/hero/training-1920.webp', jpg: '/assets/hero/training-1920.jpg' },
    ],
  },
  {
    id: 2,
    title: 'Community & Forum',
  desc: 'Meet local and visiting pilots, plan group flights and share tips. Post photos, ask questions and find flying partners year round.',
    bg: '/assets/hero/community-1920.webp',
    fallbackBg: '/assets/hero/community.jpg',
  thumb: '/assets/hero/community-320.jpg',
  thumbWebp: '/assets/hero/community-320.webp',
    ctas: [
  { label: 'Forum →', href: '#forum', variant: 'primary' },
  { label: 'Join Now', href: '#signup', variant: 'secondary', ariaLabel: 'Join the community' },
    ],
    variants: [
      { width: 960, webp: '/assets/hero/community-960.webp', jpg: '/assets/hero/community-960.jpg' },
      { width: 1600, webp: '/assets/hero/community-1600.webp', jpg: '/assets/hero/community-1600.jpg' },
      { width: 1920, webp: '/assets/hero/community-1920.webp', jpg: '/assets/hero/community-1920.jpg' },
    ],
  },
];
