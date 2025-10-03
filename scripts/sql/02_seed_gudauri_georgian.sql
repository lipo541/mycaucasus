-- ============================================================
-- Seed Gudauri Location Data (Georgian Language Only)
-- Source: locations.ts GUDAURI_LOCATION
-- ============================================================

-- 1. Insert main location (language-agnostic data)
INSERT INTO locations (
  id,
  href,
  hero_bg,
  hero_thumb,
  hero_thumb_webp,
  hero_pin,
  card_thumbnail,
  card_thumbnail_webp,
  card_status,
  card_altitude,
  card_active,
  is_published
) VALUES (
  'gudauri',
  '/locations/gudauri',
  '/assets/hero/tandem-1920.webp',
  '/assets/hero/tandem-320.jpg',
  '/assets/hero/tandem-320.webp',
  true,
  '/assets/hero/tandem-320.jpg',
  '/assets/hero/tandem-320.webp',
  'active',
  2196,
  true,
  true
);

-- 2. Insert Georgian translation
INSERT INTO location_translations (
  location_id,
  language_code,
  hero_headline,
  hero_tagline,
  hero_overlay_title,
  hero_overlay_desc,
  card_name,
  card_region,
  card_tagline,
  info_title,
  info_intro
) VALUES (
  'gudauri',
  'ka',
  'გუდაური',
  NULL,
  'დაჯავშნე ფრენა',
  'აირჩიე პაკეტი',
  'გუდაური',
  'მცხეთა-მთიანეთი',
  'პარაგლაიდინგი კავკასიონზე',
  'გუდაური - პარაგლაიდინგის სამოთხე კავკასიონში',
  'გუდაური საქართველოს ერთ-ერთი ყველაზე პოპულარული პარაგლაიდინგის ადგილია. 2196 მეტრ სიმაღლეზე მდებარე ეს კურორტი სრულყოფილ პირობებს გთავაზობთ ფრენისთვის - სტაბილური ქარის დინებები, უსაფრთხო დაშვების და დასაფრენი ადგილები და გასაოცარი პანორამული ხედები კავკასიონის მთიანეთზე.'
);

-- 3. Insert CTA
INSERT INTO location_ctas (
  location_id,
  href,
  variant,
  icon,
  order_index
) VALUES (
  'gudauri',
  '#book',
  'primary',
  NULL,
  0
);

-- Get the CTA ID for translation
DO $$
DECLARE
  cta_uuid UUID;
BEGIN
  SELECT id INTO cta_uuid FROM location_ctas WHERE location_id = 'gudauri' AND href = '#book';
  
  INSERT INTO location_cta_translations (
    cta_id,
    language_code,
    label
  ) VALUES (
    cta_uuid,
    'ka',
    'დაჯავშნე'
  );
END $$;

-- 4. Insert Meta
INSERT INTO location_meta (
  location_id,
  order_index
) VALUES (
  'gudauri',
  0
);

-- Get the Meta ID for translation
DO $$
DECLARE
  meta_uuid UUID;
BEGIN
  SELECT id INTO meta_uuid FROM location_meta WHERE location_id = 'gudauri' LIMIT 1;
  
  INSERT INTO location_meta_translations (
    meta_id,
    language_code,
    label,
    value
  ) VALUES (
    meta_uuid,
    'ka',
    'ადგილმდებარეობა',
    'გუდაური • მცხეთა-მთიანეთი'
  );
END $$;

-- 5. Insert Gallery Images (12 images)
INSERT INTO location_gallery (location_id, src, src_webp, order_index) VALUES
  ('gudauri', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', NULL, 0),
  ('gudauri', 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80', NULL, 1),
  ('gudauri', 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800&q=80', NULL, 2),
  ('gudauri', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', NULL, 3),
  ('gudauri', 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80', NULL, 4),
  ('gudauri', 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80', NULL, 5),
  ('gudauri', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', NULL, 6),
  ('gudauri', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', NULL, 7),
  ('gudauri', 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80', NULL, 8),
  ('gudauri', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', NULL, 9),
  ('gudauri', 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80', NULL, 10),
  ('gudauri', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', NULL, 11);

-- Insert Gallery Georgian Alt Texts
DO $$
DECLARE
  gallery_ids UUID[];
  alt_texts TEXT[] := ARRAY[
    'პარაგლაიდინგი მთებში',
    'თოვლიანი მწვერვალები',
    'პარაგლაიდერი ჰაერში',
    'მთების პანორამა',
    'მთა და ცა',
    'ტანდემ ფრენა',
    'მთის ლანდშაფტი',
    'თოვლიანი კავკასიონი',
    'მთის მწვერვალი',
    'ალპური პეიზაჟი',
    'პარაგლაიდინგი ღრუბლებში',
    'ექსტრემალური სპორტი'
  ];
  i INTEGER;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY order_index) INTO gallery_ids 
  FROM location_gallery WHERE location_id = 'gudauri';
  
  FOR i IN 1..12 LOOP
    INSERT INTO location_gallery_translations (gallery_id, language_code, alt)
    VALUES (gallery_ids[i], 'ka', alt_texts[i]);
  END LOOP;
END $$;

-- 6. Insert Fly Types (3 packages)
INSERT INTO location_fly_types (
  location_id,
  fly_type_id,
  duration,
  price,
  recommended,
  order_index
) VALUES
  ('gudauri', 'standard', '15-20 წუთი', 250, false, 0),
  ('gudauri', 'extreme', '25-30 წუთი', 350, true, 1),
  ('gudauri', 'long', '40-50 წუთი', 500, false, 2);

-- Insert Fly Type Georgian Translations
DO $$
DECLARE
  standard_uuid UUID;
  extreme_uuid UUID;
  long_uuid UUID;
BEGIN
  SELECT id INTO standard_uuid FROM location_fly_types WHERE location_id = 'gudauri' AND fly_type_id = 'standard';
  SELECT id INTO extreme_uuid FROM location_fly_types WHERE location_id = 'gudauri' AND fly_type_id = 'extreme';
  SELECT id INTO long_uuid FROM location_fly_types WHERE location_id = 'gudauri' AND fly_type_id = 'long';
  
  -- Standard Package
  INSERT INTO location_fly_type_translations (fly_type_id, language_code, name, description, features) VALUES (
    standard_uuid,
    'ka',
    'სტანდარტული ფრენა',
    'იდეალური პირველი გამოცდილებისთვის. ტანდემ ფრენა გამოცდილ ინსტრუქტორთან ერთად. უსაფრთხო და კომფორტული ფრენა საშუალო სიმაღლეზე.',
    '["15-20 წუთიანი ფრენა", "გამოცდილი ინსტრუქტორი", "უსაფრთხოების სრული აღჭურვილობა", "ფოტო/ვიდეო სერვისი (დამატებით)", "ინსტრუქტაჟი და ტრენინგი"]'::jsonb
  );
  
  -- Extreme Package
  INSERT INTO location_fly_type_translations (fly_type_id, language_code, name, description, features) VALUES (
    extreme_uuid,
    'ka',
    'ექსტრემალური ფრენა',
    'ადრენალინის მოყვარულთათვის! მაღალი სიმაღლიდან ფრენა აკრობატიკული ელემენტებით. სპირალები, ვიზაჟები და სხვა ექსტრემალური მანევრები.',
    '["25-30 წუთიანი ფრენა", "აკრობატიკული ელემენტები", "სპირალები და ვიზაჟები", "მაქსიმალური ადრენალინი", "უფასო ფოტო/ვიდეო", "პრემიუმ ინსტრუქტორი"]'::jsonb
  );
  
  -- Long Package
  INSERT INTO location_fly_type_translations (fly_type_id, language_code, name, description, features) VALUES (
    long_uuid,
    'ka',
    'ხანგრძლივი ფრენა',
    'მაქსიმალური ფრენის დრო პანორამული ხედებით. შესაძლებლობა დაათვალიეროთ მთელი რეგიონი ჰაერიდან. მშვიდი და რელაქსირებული ფრენა.',
    '["40-50 წუთიანი ფრენა", "პანორამული ხედები", "რამდენიმე ფოტო პაუზა", "უფასო ფოტო/ვიდეო პაკეტი", "VIP ინსტრუქტორი", "სუვენირი საჩუქრად"]'::jsonb
  );
END $$;

-- 7. Insert Sections (4 sections)
INSERT INTO location_sections (location_id, order_index) VALUES
  ('gudauri', 0),
  ('gudauri', 1),
  ('gudauri', 2),
  ('gudauri', 3);

-- Insert Section Georgian Translations
DO $$
DECLARE
  section_ids UUID[];
  section_titles TEXT[] := ARRAY[
    'რატომ გუდაური?',
    'ფრენის პირობები',
    'რას ნახავთ ფრენისას',
    'უსაფრთხოება და კომფორტი'
  ];
  section_contents TEXT[] := ARRAY[
    'გუდაური განთავსებულია კავკასიონის ქედის მთავარ გზაზე, თბილისიდან დაახლოებით 120 კმ-ში. მისი უნიკალური ლოკაცია უზრუნველყოფს იდეალურ ფრენის პირობებს მთელი წლის განმავლობაში. მთების ამფითეატრი და ვრცელი ველები უსაფრთხო ფრენის საუკეთესო გარანტიაა.',
    'გუდაურში ფრენა შესაძლებელია აპრილიდან ნოემბრამდე, თუმცა საუკეთესო პირობები მაისიდან ოქტომბრამდეა. ამ პერიოდში ქარი სტაბილურია, ხილვადობა შესანიშნავი, ხოლო ტემპერატურა კომფორტული. დაშვების ადგილი მდებარეობს 2300-2400 მეტრ სიმაღლეზე, ხოლო დასაფრენი ზონა - 2000 მეტრზე.',
    'ჰაერიდან თვალწარმტაცი ხედები იშლება კავკასიონის თოვლიან მწვერვალებზე, მათ შორის ყაზბეგზე. ქვემოთ გადაჭიმულია ღრმა ხეობები და მწვანე ველები. კარგი ამინდის პირობებში ხილვადობა აღწევს 50-70 კმ-ს, რაც საშუალებას გაძლევთ დაინახოთ კავკასიონის უნიკალური ლანდშაფტი ფრინველის თვალით.',
    'ჩვენი ყველა პილოტი არის სერტიფიცირებული პროფესიონალი 5+ წლიანი გამოცდილებით. გამოვიყენებთ მხოლოდ თანამედროვე, რეგულარულად შემოწმებულ აღჭურვილობას. თითოეული ფრენის წინ ტარდება დეტალური ინსტრუქტაჟი და უსაფრთხოების ბრიფინგი. სამედიცინო დახმარება ხელმისაწვდომია 24/7.'
  ];
  i INTEGER;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY order_index) INTO section_ids 
  FROM location_sections WHERE location_id = 'gudauri';
  
  FOR i IN 1..4 LOOP
    INSERT INTO location_section_translations (section_id, language_code, title, content)
    VALUES (section_ids[i], 'ka', section_titles[i], section_contents[i]);
  END LOOP;
END $$;

-- 8. Insert Highlights (4 highlights)
INSERT INTO location_highlights (location_id, icon, order_index) VALUES
  ('gudauri', 'mountain', 0),
  ('gudauri', 'calendar', 1),
  ('gudauri', 'location', 2),
  ('gudauri', 'clock', 3);

-- Insert Highlight Georgian Translations
DO $$
DECLARE
  highlight_ids UUID[];
  highlight_titles TEXT[] := ARRAY['სიმაღლე', 'ფრენის სეზონი', 'მანძილი თბილისიდან', 'ფრენის ხანგრძლივობა'];
  highlight_values TEXT[] := ARRAY['2196 მ', 'აპრილი - ნოემბერი', '120 კმ', '15-50 წუთი'];
  i INTEGER;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY order_index) INTO highlight_ids 
  FROM location_highlights WHERE location_id = 'gudauri';
  
  FOR i IN 1..4 LOOP
    INSERT INTO location_highlight_translations (highlight_id, language_code, title, value)
    VALUES (highlight_ids[i], 'ka', highlight_titles[i], highlight_values[i]);
  END LOOP;
END $$;

-- 9. Insert Tips (6 tips)
INSERT INTO location_tips (location_id, order_index) VALUES
  ('gudauri', 0),
  ('gudauri', 1),
  ('gudauri', 2),
  ('gudauri', 3),
  ('gudauri', 4),
  ('gudauri', 5);

-- Insert Tip Georgian Translations
DO $$
DECLARE
  tip_ids UUID[];
  tip_texts TEXT[] := ARRAY[
    'აიღეთ თბილი ტანისამოსი - სიმაღლეზე ტემპერატურა დაბალია',
    'გამოიყენეთ მზისგან დამცავი კრემი - მზე მთებში უფრო ინტენსიურია',
    'ფრენამდე 2 საათით ადრე არ მიირთვათ მძიმე საკვები',
    'დაიცავით ინსტრუქტორის ყველა მითითება და რჩევა',
    'წაიღეთ კამერა ან სმართფონი - ხედები დაუვიწყარია!',
    'დაჯავშნეთ ფრენა წინასწარ, განსაკუთრებით სეზონის პიკზე'
  ];
  i INTEGER;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY order_index) INTO tip_ids 
  FROM location_tips WHERE location_id = 'gudauri';
  
  FOR i IN 1..6 LOOP
    INSERT INTO location_tip_translations (tip_id, language_code, tip)
    VALUES (tip_ids[i], 'ka', tip_texts[i]);
  END LOOP;
END $$;

-- ============================================================
-- Verification Query
-- ============================================================

-- Uncomment to verify data was inserted correctly:
-- SELECT 
--   l.id,
--   lt.language_code,
--   lt.hero_headline,
--   lt.card_name,
--   (SELECT COUNT(*) FROM location_gallery WHERE location_id = l.id) as gallery_count,
--   (SELECT COUNT(*) FROM location_fly_types WHERE location_id = l.id) as fly_types_count,
--   (SELECT COUNT(*) FROM location_sections WHERE location_id = l.id) as sections_count,
--   (SELECT COUNT(*) FROM location_highlights WHERE location_id = l.id) as highlights_count,
--   (SELECT COUNT(*) FROM location_tips WHERE location_id = l.id) as tips_count
-- FROM locations l
-- LEFT JOIN location_translations lt ON l.id = lt.location_id
-- WHERE l.id = 'gudauri';
