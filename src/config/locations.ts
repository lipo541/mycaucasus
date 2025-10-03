/**
 * Locations Configuration
 * Unified config for location hero sections and card data.
 * Each location contains both hero display data and card/list metadata.
 * Future: hydrate from Supabase locations table
 */

export interface FlyType {
  /** Unique identifier */
  id: string;
  /** Package name (Georgian) */
  name: string;
  /** Flight duration */
  duration: string;
  /** Price in GEL (number only) */
  price: number;
  /** Package description */
  description: string;
  /** List of features/benefits */
  features: string[];
  /** Is this the recommended/popular option */
  recommended: boolean;
}

export interface LocationInfo {
  /** Main title */
  title: string;
  /** Introduction paragraph */
  intro: string;
  /** Detailed sections about the location */
  sections: {
    /** Section title */
    title: string;
    /** Section content */
    content: string;
  }[];
  /** Key highlights/facts */
  highlights?: {
    /** Highlight title */
    title: string;
    /** Highlight value/description */
    value: string;
    /** Optional icon name */
    icon?: string;
  }[];
  /** Important tips */
  tips?: string[];
}

export interface LocationHeroData {
  /** Hero background image (high-res) */
  bg: string;
  /** Small thumbnail for slider/preview */
  thumb?: string;
  /** Webp thumbnail */
  thumbWebp?: string;
  /** Main headline (e.g., "გუდაური") */
  headline: string;
  /** Optional tagline under headline */
  tagline?: string;
  /** Show red location pin icon next to headline */
  pin?: boolean;
  /** Overlay section title (e.g., "დაჯავშნე ფრენა") */
  overlayTitle?: string;
  /** Overlay description */
  overlayDesc?: string;
  /** Bullet points (tips, features) */
  points?: string[];
  /** Call-to-action buttons */
  ctas?: {
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "ghost";
    icon?: "heart";
  }[];
  /** Meta badges (e.g., location info) */
  meta?: { label: string; value: string }[];
  /** Gallery images for this location */
  gallery?: {
    /** Image URL */
    src: string;
    /** Image alt text (Georgian) */
    alt: string;
    /** Optional webp version */
    srcWebp?: string;
  }[];
  /** Flight type packages for this location */
  flyTypes?: FlyType[];
  /** Detailed information about the location */
  locationInfo?: LocationInfo;
}

export interface LocationCardData {
  /** Display name (Georgian) */
  name: string;
  /** Region or parent area */
  region: string;
  /** Brief tagline/description for card */
  tagline: string;
  /** Card thumbnail image */
  thumbnail: string;
  /** Optional webp thumbnail */
  thumbnailWebp?: string;
  /** Flight availability status */
  status: "active" | "seasonal" | "offline";
  /** Altitude (meters) */
  altitude?: number;
  /** Is location currently active for booking */
  active: boolean;
}

export interface Location {
  /** Unique location identifier (slug-friendly) */
  id: string;
  /** URL path for this location's detail page */
  href: string;
  /** Hero section data (when rendering location detail page) */
  hero: LocationHeroData;
  /** Card data (when listing in ActiveLocations component) */
  card: LocationCardData;
}

export interface LocationsConfig {
  /** All available locations */
  locations: Location[];
}

// Static seed data; later this will be fetched from Supabase
export const LOCATIONS: LocationsConfig = {
  locations: [
    {
      id: "gudauri",
      href: "/locations/gudauri",
      hero: {
        bg: "/assets/hero/tandem-1920.webp",
        thumb: "/assets/hero/tandem-320.jpg",
        thumbWebp: "/assets/hero/tandem-320.webp",
        headline: "გუდაური",
        tagline: undefined,
        pin: true,
        overlayTitle: "დაჯავშნე ფრენა",
        overlayDesc: "აირჩიე პაკეტი",
        ctas: [{ label: "დაჯავშნე", href: "#book", variant: "primary" }],
        meta: [
          { label: "ადგილმდებარეობა", value: "გუდაური • მცხეთა-მთიანეთი" },
        ],
        gallery: [
          {
            src: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
            alt: "პარაგლაიდინგი მთებში",
          },
          {
            src: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80",
            alt: "თოვლიანი მწვერვალები",
          },
          {
            src: "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800&q=80",
            alt: "პარაგლაიდერი ჰაერში",
          },
          {
            src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
            alt: "მთების პანორამა",
          },
          {
            src: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80",
            alt: "მთა და ცა",
          },
          {
            src: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80",
            alt: "ტანდემ ფრენა",
          },
          {
            src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
            alt: "მთის ლანდშაფტი",
          },
          {
            src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
            alt: "თოვლიანი კავკასიონი",
          },
          {
            src: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80",
            alt: "მთის მწვერვალი",
          },
          {
            src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
            alt: "ალპური პეიზაჟი",
          },
          {
            src: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
            alt: "პარაგლაიდინგი ღრუბლებში",
          },
          {
            src: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
            alt: "ექსტრემალური სპორტი",
          },
        ],
        flyTypes: [
          {
            id: "standard",
            name: "სტანდარტული ფრენა",
            duration: "15-20 წუთი",
            price: 250,
            description:
              "იდეალური პირველი გამოცდილებისთვის. ტანდემ ფრენა გამოცდილ ინსტრუქტორთან ერთად. უსაფრთხო და კომფორტული ფრენა საშუალო სიმაღლეზე.",
            features: [
              "15-20 წუთიანი ფრენა",
              "გამოცდილი ინსტრუქტორი",
              "უსაფრთხოების სრული აღჭურვილობა",
              "ფოტო/ვიდეო სერვისი (დამატებით)",
              "ინსტრუქტაჟი და ტრენინგი",
            ],
            recommended: false,
          },
          {
            id: "extreme",
            name: "ექსტრემალური ფრენა",
            duration: "25-30 წუთი",
            price: 350,
            description:
              "ადრენალინის მოყვარულთათვის! მაღალი სიმაღლიდან ფრენა აკრობატიკული ელემენტებით. სპირალები, ვიზაჟები და სხვა ექსტრემალური მანევრები.",
            features: [
              "25-30 წუთიანი ფრენა",
              "აკრობატიკული ელემენტები",
              "სპირალები და ვიზაჟები",
              "მაქსიმალური ადრენალინი",
              "უფასო ფოტო/ვიდეო",
              "პრემიუმ ინსტრუქტორი",
            ],
            recommended: true,
          },
          {
            id: "long",
            name: "ხანგრძლივი ფრენა",
            duration: "40-50 წუთი",
            price: 500,
            description:
              "მაქსიმალური ფრენის დრო პანორამული ხედებით. შესაძლებლობა დაათვალიეროთ მთელი რეგიონი ჰაერიდან. მშვიდი და რელაქსირებული ფრენა.",
            features: [
              "40-50 წუთიანი ფრენა",
              "პანორამული ხედები",
              "რამდენიმე ფოტო პაუზა",
              "უფასო ფოტო/ვიდეო პაკეტი",
              "VIP ინსტრუქტორი",
              "სუვენირი საჩუქრად",
            ],
            recommended: false,
          },
        ],
        locationInfo: {
          title: "გუდაური - პარაგლაიდინგის სამოთხე კავკასიონში",
          intro:
            "გუდაური საქართველოს ერთ-ერთი ყველაზე პოპულარული პარაგლაიდინგის ადგილია. 2196 მეტრ სიმაღლეზე მდებარე ეს კურორტი სრულყოფილ პირობებს გთავაზობთ ფრენისთვის - სტაბილური ქარის დინებები, უსაფრთხო დაშვების და დასაფრენი ადგილები და გასაოცარი პანორამული ხედები კავკასიონის მთიანეთზე.",
          sections: [
            {
              title: "რატომ გუდაური?",
              content:
                "გუდაური განთავსებულია კავკასიონის ქედის მთავარ გზაზე, თბილისიდან დაახლოებით 120 კმ-ში. მისი უნიკალური ლოკაცია უზრუნველყოფს იდეალურ ფრენის პირობებს მთელი წლის განმავლობაში. მთების ამფითეატრი და ვრცელი ველები უსაფრთხო ფრენის საუკეთესო გარანტიაა.",
            },
            {
              title: "ფრენის პირობები",
              content:
                "გუდაურში ფრენა შესაძლებელია აპრილიდან ნოემბრამდე, თუმცა საუკეთესო პირობები მაისიდან ოქტომბრამდეა. ამ პერიოდში ქარი სტაბილურია, ხილვადობა შესანიშნავი, ხოლო ტემპერატურა კომფორტული. დაშვების ადგილი მდებარეობს 2300-2400 მეტრ სიმაღლეზე, ხოლო დასაფრენი ზონა - 2000 მეტრზე.",
            },
            {
              title: "რას ნახავთ ფრენისას",
              content:
                "ჰაერიდან თვალწარმტაცი ხედები იშლება კავკასიონის თოვლიან მწვერვალებზე, მათ შორის ყაზბეგზე. ქვემოთ გადაჭიმულია ღრმა ხეობები და მწვანე ველები. კარგი ამინდის პირობებში ხილვადობა აღწევს 50-70 კმ-ს, რაც საშუალებას გაძლევთ დაინახოთ კავკასიონის უნიკალური ლანდშაფტი ფრინველის თვალით.",
            },
            {
              title: "უსაფრთხოება და კომფორტი",
              content:
                "ჩვენი ყველა პილოტი არის სერტიფიცირებული პროფესიონალი 5+ წლიანი გამოცდილებით. გამოვიყენებთ მხოლოდ თანამედროვე, რეგულარულად შემოწმებულ აღჭურვილობას. თითოეული ფრენის წინ ტარდება დეტალური ინსტრუქტაჟი და უსაფრთხოების ბრიფინგი. სამედიცინო დახმარება ხელმისაწვდომია 24/7.",
            },
          ],
          highlights: [
            {
              title: "სიმაღლე",
              value: "2196 მ",
              icon: "mountain",
            },
            {
              title: "ფრენის სეზონი",
              value: "აპრილი - ნოემბერი",
              icon: "calendar",
            },
            {
              title: "მანძილი თბილისიდან",
              value: "120 კმ",
              icon: "location",
            },
            {
              title: "ფრენის ხანგრძლივობა",
              value: "15-50 წუთი",
              icon: "clock",
            },
          ],
          tips: [
            "აიღეთ თბილი ტანისამოსი - სიმაღლეზე ტემპერატურა დაბალია",
            "გამოიყენეთ მზისგან დამცავი კრემი - მზე მთებში უფრო ინტენსიურია",
            "ფრენამდე 2 საათით ადრე არ მიირთვათ მძიმე საკვები",
            "დაიცავით ინსტრუქტორის ყველა მითითება და რჩევა",
            "წაიღეთ კამერა ან სმართფონი - ხედები დაუვიწყარია!",
            "დაჯავშნეთ ფრენა წინასწარ, განსაკუთრებით სეზონის პიკზე",
          ],
        },
      },
      card: {
        name: "გუდაური",
        region: "მცხეთა-მთიანეთი",
        tagline: "პარაგლაიდინგი კავკასიონზე",
        thumbnail: "/assets/hero/tandem-320.jpg",
        thumbnailWebp: "/assets/hero/tandem-320.webp",
        status: "active",
        altitude: 2196,
        active: true,
      },
    },
    {
      id: "kazbegi",
      href: "/locations/kazbegi",
      hero: {
        bg: "/assets/hero/training-1920.webp",
        thumb: "/assets/hero/training-320.jpg",
        thumbWebp: "/assets/hero/training-320.webp",
        headline: "ყაზბეგი",
        pin: true,
        overlayTitle: "ფრენა მწვერვალებთან",
        overlayDesc: "გამოცდილება ბუნებასთან ერთად",
        meta: [
          { label: "ადგილმდებარეობა", value: "ყაზბეგი • მცხეთა-მთიანეთი" },
        ],
      },
      card: {
        name: "ყაზბეგი",
        region: "მცხეთა-მთიანეთი",
        tagline: "ფრენა მწვერვალების ფონზე",
        thumbnail: "/assets/hero/training-320.jpg",
        thumbnailWebp: "/assets/hero/training-320.webp",
        status: "active",
        altitude: 1750,
        active: true,
      },
    },
    {
      id: "batumi",
      href: "/locations/batumi",
      hero: {
        bg: "/assets/hero/community-1920.webp",
        thumb: "/assets/hero/community-320.jpg",
        thumbWebp: "/assets/hero/community-320.webp",
        headline: "ბათუმი",
        pin: true,
        overlayTitle: "ზღვასთან ფრენა",
        overlayDesc: "სეზონური შეთავაზებები",
        meta: [{ label: "ადგილმდებარეობა", value: "ბათუმი • აჭარა" }],
      },
      card: {
        name: "ბათუმი",
        region: "აჭარა",
        tagline: "ფრენა შავი ზღვის ზემოთ",
        thumbnail: "/assets/hero/community-320.jpg",
        thumbnailWebp: "/assets/hero/community-320.webp",
        status: "seasonal",
        altitude: 250,
        active: false,
      },
    },
  ],
};
