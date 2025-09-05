import { NavItem } from './types';

// NOTE: Textual navigation content populated from user-provided screenshots.
// Missing translations (RU/AR/DE) currently mirror EN; adjust when real translations are available.
// Routes are inferred; adjust slugs as actual pages are created.
export const menuItems: NavItem[] = [
  {
    id: 'pilots',
    href: '/pilots',
    i18n: {
      EN: 'Pilots',
      KA: 'პილოტები',
      RU: 'Pilots', // TODO translate
      AR: 'Pilots', // TODO translate
      DE: 'Piloten'
    },
    children: [
      { id: 'pilots-directory', href: '/pilots/directory', i18n: { EN: 'Pilot Directory', KA: 'პილოტთა კატალოგი', RU: 'Pilot Directory', AR: 'Pilot Directory', DE: 'Pilotenverzeichnis' } },
      { id: 'pilots-ranking', href: '/pilots/ranking', i18n: { EN: 'Ranking & Stats', KA: 'რეიტინგი და სტატისტიკა', RU: 'Ranking & Stats', AR: 'Ranking & Stats', DE: 'Rang & Statistik' } },
      { id: 'pilots-certification', href: '/pilots/certification', i18n: { EN: 'Certification Levels', KA: 'სერტიფიკაციის დონეები', RU: 'Certification Levels', AR: 'Certification Levels', DE: 'Zertifizierungsstufen' } },
      { id: 'pilots-community', href: '/pilots/community', i18n: { EN: 'Community / Forum', KA: 'ფორუმი', RU: 'Community / Forum', AR: 'Community / Forum', DE: 'Community / Forum' } }
    ]
  },
  {
    id: 'locations',
    i18n: {
      EN: 'Locations',
      KA: 'ადგილმდებარეობები', // If different desired wording, update
      RU: 'Locations', // TODO translate
      AR: 'Locations', // TODO translate
      DE: 'Standorte'
    },
    children: [
      {
        id: 'loc-gudauri',
        href: '/locations/gudauri',
        i18n: { EN: 'Gudauri', KA: 'გუდაური', RU: 'Gudauri', AR: 'Gudauri', DE: 'Gudauri' }
      },
      {
        id: 'loc-ananuri',
        href: '/locations/ananuri',
        i18n: { EN: 'Ananuri', KA: 'ანანური', RU: 'Ananuri', AR: 'Ananuri', DE: 'Ananuri' }
      },
      {
        id: 'loc-rustavi-tbilisi',
        href: '/locations/rustavi-tbilisi',
        i18n: { EN: 'Rustavi-Tbilisi', KA: 'რუსთავი-თბილისი', RU: 'Rustavi-Tbilisi', AR: 'Rustavi-Tbilisi', DE: 'Rustavi-Tbilisi' }
      },
      {
        id: 'loc-mestia',
        href: '/locations/mestia',
        i18n: { EN: 'Mestia', KA: 'მესტია', RU: 'Mestia', AR: 'Mestia', DE: 'Mestia' }
      },
      {
        id: 'loc-submenu',
        i18n: { EN: 'Submenu', KA: 'ქვემენიუ', RU: 'Submenu', AR: 'Submenu', DE: 'Submenü' },
        // Placeholder for deeper nested items if needed later
        children: []
      }
    ]
  },
  {
    id: 'tours',
    href: '/tours',
    i18n: {
      EN: 'Tours',
      KA: 'ტურები',
      RU: 'Tours', // TODO translate
      AR: 'Tours', // TODO translate
      DE: 'Touren'
    },
    children: [
      { id: 'tours-all', href: '/tours', i18n: { EN: 'All Tours', KA: 'ყველა ტური', RU: 'All Tours', AR: 'All Tours', DE: 'Alle Touren' } },
      { id: 'tours-training', href: '/tours/training', i18n: { EN: 'Training Flights', KA: 'სასწავლო ფრენები', RU: 'Training Flights', AR: 'Training Flights', DE: 'Trainingsflüge' } },
      { id: 'tours-tandem', href: '/tours/tandem', i18n: { EN: 'Tandem Experiences', KA: 'ტანდემი', RU: 'Tandem Experiences', AR: 'Tandem Experiences', DE: 'Tandem Erlebnisse' } },
      { id: 'tours-mountain', href: '/tours/mountain', i18n: { EN: 'Mountain Routes', KA: 'მთის მარშრუტები', RU: 'Mountain Routes', AR: 'Mountain Routes', DE: 'Berg Routen' } },
      { id: 'tours-heliski', href: '/tours/heli', i18n: { EN: 'Heli Combo', KA: 'ჰელი კომბო', RU: 'Heli Combo', AR: 'Heli Combo', DE: 'Heli Kombi' } }
    ]
  },
  {
    id: 'courses',
    i18n: {
      EN: 'Courses',
      KA: 'კურსები',
      RU: 'Courses', // TODO translate
      AR: 'Courses', // TODO translate
      DE: 'Kurse'
    },
    children: [
      {
        id: 'course-basic-training',
        href: '/courses/basic-paragliding',
        i18n: {
          EN: 'Paragliding Training Course',
          KA: 'საფრენოსნო მომზადების კურსი',
          RU: 'Paragliding Training Course', // TODO translate
          AR: 'Paragliding Training Course', // TODO translate
          DE: 'Paragliding Training Kurs' // adjust German later
        }
      },
      {
        id: 'course-safety',
        href: '/courses/safety',
        i18n: {
          EN: 'Safety Course',
          KA: 'უსაფრთხოების კურსი',
          RU: 'Safety Course', // TODO translate
          AR: 'Safety Course', // TODO translate
          DE: 'Sicherheitskurs'
        }
      },
      {
        id: 'course-pilot-refresh',
        href: '/courses/pilot-requalification',
        i18n: {
          EN: 'Pilot Requalification Course',
          KA: 'პილოტის გადამზადების კურსი',
          RU: 'Pilot Requalification Course', // TODO translate
          AR: 'Pilot Requalification Course', // TODO translate
          DE: 'Pilot Nachschulungskurs'
        }
      }
    ]
  },
  {
    id: 'exam-tests',
    href: '/exam-tests',
    i18n: {
      EN: 'Exam Tests',
      KA: 'გამოცდის ტესტები',
      RU: 'Exam Tests', // TODO translate
      AR: 'Exam Tests', // TODO translate
      DE: 'Prüfungstests'
    }
  },
  {
    id: 'about-us',
    href: '/about',
    i18n: {
      EN: 'About Us',
      KA: 'ჩვენ შესახებ',
      RU: 'About Us', // TODO translate
      AR: 'About Us', // TODO translate
      DE: 'Über uns'
    }
  }
];
