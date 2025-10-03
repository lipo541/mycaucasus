-- ============================================================
-- MyCaucasus Locations Schema with Multi-Language Support
-- 7 Languages: ka (default), en (fallback), ru, ar, de, fr, tr
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MAIN TABLES
-- ============================================================

-- 1. Locations (Main Table - Language Agnostic Data)
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  href TEXT NOT NULL UNIQUE,
  
  -- Media (same for all languages)
  hero_bg TEXT,
  hero_thumb TEXT,
  hero_thumb_webp TEXT,
  hero_pin BOOLEAN DEFAULT false,
  
  card_thumbnail TEXT,
  card_thumbnail_webp TEXT,
  card_status TEXT CHECK (card_status IN ('active', 'seasonal', 'offline')) DEFAULT 'active',
  card_altitude INTEGER,
  card_active BOOLEAN DEFAULT false,
  
  -- Metadata
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Location Translations (Translatable Text Content)
CREATE TABLE location_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  -- Hero Section
  hero_headline TEXT NOT NULL,
  hero_tagline TEXT,
  hero_overlay_title TEXT,
  hero_overlay_desc TEXT,
  
  -- Card Section
  card_name TEXT NOT NULL,
  card_region TEXT,
  card_tagline TEXT,
  
  -- Info Section
  info_title TEXT,
  info_intro TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_id, language_code)
);

-- ============================================================
-- CONTENT TABLES (with Translations)
-- ============================================================

-- 3. Gallery (Images - same src, different alt per language)
CREATE TABLE location_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  src TEXT NOT NULL,
  src_webp TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_gallery_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES location_gallery(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  alt TEXT NOT NULL,
  UNIQUE(gallery_id, language_code)
);

-- 4. Fly Types (Packages)
CREATE TABLE location_fly_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  fly_type_id TEXT NOT NULL,
  
  -- Language-agnostic data
  duration TEXT,
  price NUMERIC(10,2) NOT NULL,
  recommended BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_fly_type_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fly_type_id UUID NOT NULL REFERENCES location_fly_types(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(fly_type_id, language_code)
);

-- 5. Sections (Info Sections)
CREATE TABLE location_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_section_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES location_sections(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  UNIQUE(section_id, language_code)
);

-- 6. Highlights (Key Facts/Stats)
CREATE TABLE location_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_highlight_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  highlight_id UUID NOT NULL REFERENCES location_highlights(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  
  UNIQUE(highlight_id, language_code)
);

-- 7. Tips (Helpful Tips/Advice)
CREATE TABLE location_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_tip_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tip_id UUID NOT NULL REFERENCES location_tips(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  tip TEXT NOT NULL,
  
  UNIQUE(tip_id, language_code)
);

-- 8. CTAs (Call-to-Action Buttons)
CREATE TABLE location_ctas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  href TEXT NOT NULL,
  variant TEXT DEFAULT 'primary' CHECK (variant IN ('primary', 'secondary', 'ghost')),
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_cta_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cta_id UUID NOT NULL REFERENCES location_ctas(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  label TEXT NOT NULL,
  
  UNIQUE(cta_id, language_code)
);

-- 9. Meta (Metadata Badges)
CREATE TABLE location_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_meta_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id UUID NOT NULL REFERENCES location_meta(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('ka', 'en', 'ru', 'ar', 'de', 'fr', 'tr')),
  
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  
  UNIQUE(meta_id, language_code)
);

-- ============================================================
-- INDEXES (Performance Optimization)
-- ============================================================

CREATE INDEX idx_location_translations_location ON location_translations(location_id);
CREATE INDEX idx_location_translations_language ON location_translations(language_code);

CREATE INDEX idx_location_gallery_location ON location_gallery(location_id);
CREATE INDEX idx_location_gallery_translations_gallery ON location_gallery_translations(gallery_id);
CREATE INDEX idx_location_gallery_translations_language ON location_gallery_translations(language_code);

CREATE INDEX idx_location_fly_types_location ON location_fly_types(location_id);
CREATE INDEX idx_location_fly_type_translations_fly_type ON location_fly_type_translations(fly_type_id);
CREATE INDEX idx_location_fly_type_translations_language ON location_fly_type_translations(language_code);

CREATE INDEX idx_location_sections_location ON location_sections(location_id);
CREATE INDEX idx_location_section_translations_section ON location_section_translations(section_id);
CREATE INDEX idx_location_section_translations_language ON location_section_translations(language_code);

CREATE INDEX idx_location_highlights_location ON location_highlights(location_id);
CREATE INDEX idx_location_highlight_translations_highlight ON location_highlight_translations(highlight_id);
CREATE INDEX idx_location_highlight_translations_language ON location_highlight_translations(language_code);

CREATE INDEX idx_location_tips_location ON location_tips(location_id);
CREATE INDEX idx_location_tip_translations_tip ON location_tip_translations(tip_id);
CREATE INDEX idx_location_tip_translations_language ON location_tip_translations(language_code);

CREATE INDEX idx_location_ctas_location ON location_ctas(location_id);
CREATE INDEX idx_location_cta_translations_cta ON location_cta_translations(cta_id);
CREATE INDEX idx_location_cta_translations_language ON location_cta_translations(language_code);

CREATE INDEX idx_location_meta_location ON location_meta(location_id);
CREATE INDEX idx_location_meta_translations_meta ON location_meta_translations(meta_id);
CREATE INDEX idx_location_meta_translations_language ON location_meta_translations(language_code);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_gallery_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_fly_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_fly_type_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_highlight_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tip_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_ctas ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_cta_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_meta_translations ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can view published locations)
CREATE POLICY "Public locations read" ON locations FOR SELECT USING (is_published = true);
CREATE POLICY "Public translations read" ON location_translations FOR SELECT USING (true);
CREATE POLICY "Public gallery read" ON location_gallery FOR SELECT USING (true);
CREATE POLICY "Public gallery translations read" ON location_gallery_translations FOR SELECT USING (true);
CREATE POLICY "Public fly types read" ON location_fly_types FOR SELECT USING (true);
CREATE POLICY "Public fly type translations read" ON location_fly_type_translations FOR SELECT USING (true);
CREATE POLICY "Public sections read" ON location_sections FOR SELECT USING (true);
CREATE POLICY "Public section translations read" ON location_section_translations FOR SELECT USING (true);
CREATE POLICY "Public highlights read" ON location_highlights FOR SELECT USING (true);
CREATE POLICY "Public highlight translations read" ON location_highlight_translations FOR SELECT USING (true);
CREATE POLICY "Public tips read" ON location_tips FOR SELECT USING (true);
CREATE POLICY "Public tip translations read" ON location_tip_translations FOR SELECT USING (true);
CREATE POLICY "Public ctas read" ON location_ctas FOR SELECT USING (true);
CREATE POLICY "Public cta translations read" ON location_cta_translations FOR SELECT USING (true);
CREATE POLICY "Public meta read" ON location_meta FOR SELECT USING (true);
CREATE POLICY "Public meta translations read" ON location_meta_translations FOR SELECT USING (true);

-- Admin write access (only admin/superadmin can create/update/delete)
CREATE POLICY "Admin locations write" ON locations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
         OR auth.users.raw_user_meta_data->>'role' = 'superadmin')
  )
);

CREATE POLICY "Admin translations write" ON location_translations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
         OR auth.users.raw_user_meta_data->>'role' = 'superadmin')
  )
);

-- Apply same admin policy to all other tables
CREATE POLICY "Admin gallery write" ON location_gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin gallery translations write" ON location_gallery_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin fly types write" ON location_fly_types FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin fly type translations write" ON location_fly_type_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin sections write" ON location_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin section translations write" ON location_section_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin highlights write" ON location_highlights FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin highlight translations write" ON location_highlight_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin tips write" ON location_tips FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin tip translations write" ON location_tip_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin ctas write" ON location_ctas FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin cta translations write" ON location_cta_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin meta write" ON location_meta FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

CREATE POLICY "Admin meta translations write" ON location_meta_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'superadmin'))
);

-- ============================================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_translations_updated_at BEFORE UPDATE ON location_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE locations IS 'Main locations table - language-agnostic data';
COMMENT ON TABLE location_translations IS 'Translations for location text content (7 languages)';
COMMENT ON TABLE location_gallery IS 'Gallery images for locations';
COMMENT ON TABLE location_gallery_translations IS 'Alt text translations for gallery images';
COMMENT ON TABLE location_fly_types IS 'Flight packages/types for each location';
COMMENT ON TABLE location_fly_type_translations IS 'Translations for flight package details';
COMMENT ON TABLE location_sections IS 'Information sections for locations';
COMMENT ON TABLE location_section_translations IS 'Translations for section content';
COMMENT ON TABLE location_highlights IS 'Key highlights/stats for locations';
COMMENT ON TABLE location_highlight_translations IS 'Translations for highlights';
COMMENT ON TABLE location_tips IS 'Helpful tips for visitors';
COMMENT ON TABLE location_tip_translations IS 'Translations for tips';
COMMENT ON TABLE location_ctas IS 'Call-to-action buttons';
COMMENT ON TABLE location_cta_translations IS 'Translations for CTA labels';
COMMENT ON TABLE location_meta IS 'Metadata badges';
COMMENT ON TABLE location_meta_translations IS 'Translations for metadata';
