export interface HeroPanel {
  id: number;
  title: string;
  desc: string;
  /** primary background (largest single asset; Next.js will generate needed sizes) */
  bg: string;
  /** optional thumbnail (small square-ish preview) */
  thumb?: string;
  /** optional webp thumbnail */
  thumbWebp?: string;
  /** per-panel call-to-action buttons */
  ctas?: { label: string; href: string; variant?: 'primary' | 'secondary'; ariaLabel?: string }[];
}

// Using a single high-quality WebP per panel; Next Image will downscale/serve modern formats automatically.

export const HERO_PANELS: HeroPanel[] = [
  {
    id: 0,
    title: 'ტანდემ ფრენები',
  desc: 'ისიამოვნე უსაფრთხო და სანახაობრივი ტანდემ ფრენით კავკასიაზე სერტიფიცირებულ პილოტთან ერთად. თანამედროვე ინვენტარი, მოქნილი ამინდის ფანჯრები და სურვილის მიხედვით HD ფოტო/ვიდეო.',
  bg: '/assets/hero/tandem-1920.webp',
  thumb: '/assets/hero/tandem-320.jpg',
  thumbWebp: '/assets/hero/tandem-320.webp',
    ctas: [
  { label: 'დაჯავშნე ფრენა →', href: '#booking', variant: 'primary', ariaLabel: 'დაჯავშნე ტანდემ ფრენა' },
  { label: 'ფასები', href: '#pricing', variant: 'secondary' },
    ],
  // removed per-size variants (Next.js handles responsive resizing)
  },
  {
    id: 1,
    title: 'ლიცენზია და სწავლება',
  desc: 'ისწავლე ფრენა etapobit: საფუძვლები, უსაფრთხო მართვა, აღმავალი ნაკადები და პირველი დისტანციები. მკაფიო მოდულები, მეგობრული ინსტრუქტორები და ციფრული პროგრესის ჟურნალი.',
  bg: '/assets/hero/training-1920.webp',
  thumb: '/assets/hero/training-320.jpg',
  thumbWebp: '/assets/hero/training-320.webp',
    ctas: [
  { label: 'კურსები →', href: '#courses', variant: 'primary', ariaLabel: 'სასწავლო კურსები' },
  { label: 'ლიცენზია', href: '#licensing', variant: 'secondary' },
    ],
  // removed variants
  },
  {
    id: 2,
    title: 'კომუნითი & ფორუმი',
  desc: 'გაიცანი ადგილობრივი და სტუმარი პილოტები, დაგეგმე ჯგუფური ფრენები და გაუზიარე გამოცდილება. ატვირთე ფოტოები, დასვი კითხვები და იპოვე ფრენის პარტნიორები მთელი წლის განმავლობაში.',
  bg: '/assets/hero/community-1920.webp',
  thumb: '/assets/hero/community-320.jpg',
  thumbWebp: '/assets/hero/community-320.webp',
    ctas: [
  { label: 'ფორუმი →', href: '#forum', variant: 'primary' },
  { label: 'შემოგვიერთდი', href: '#signup', variant: 'secondary', ariaLabel: 'შეერთდი კომუნითს' },
    ],
  // removed variants
  },
];
