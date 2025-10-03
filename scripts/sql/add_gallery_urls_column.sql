-- Add gallery_urls column to locations table
-- This stores gallery image URLs as a JSON array, similar to hero_bg

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN locations.gallery_urls IS 'Array of gallery image URLs stored in Supabase Storage';

-- Example structure:
-- gallery_urls: ["https://...jpg", "https://...jpg"]
