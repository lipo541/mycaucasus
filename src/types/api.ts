/**
 * API Response Types for Locations
 * Used by /api/locations and /api/locations/[id]
 */

// ===== Database Row Types =====

export interface LocationRow {
  id: string;
  href: string;
  hero_bg: string;
  hero_thumb: string;
  hero_thumb_webp: string;
  hero_pin: boolean;
  altitude: number;
  status: "active" | "coming_soon" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface LocationTranslationRow {
  location_id: string;
  language_code: string;
  hero_headline: string;
  card_name: string;
  info_title: string;
  info_subtitle: string;
  status_badge: string;
  book_btn_text: string;
}

export interface GalleryRow {
  id: string;
  location_id: string;
  image_url: string;
  image_url_webp: string | null;
  sort_order: number;
}

export interface GalleryTranslationRow {
  gallery_id: string;
  language_code: string;
  alt_text: string;
  caption: string | null;
}

export interface FlyTypeRow {
  id: string;
  location_id: string;
  type_key: string;
  icon: string;
  sort_order: number;
}

export interface FlyTypeTranslationRow {
  fly_type_id: string;
  language_code: string;
  title: string;
  description: string;
}

export interface SectionRow {
  id: string;
  location_id: string;
  section_key: string;
  sort_order: number;
}

export interface SectionTranslationRow {
  section_id: string;
  language_code: string;
  title: string;
  content: string;
}

export interface HighlightRow {
  id: string;
  location_id: string;
  icon: string;
  sort_order: number;
}

export interface HighlightTranslationRow {
  highlight_id: string;
  language_code: string;
  label: string;
}

export interface TipRow {
  id: string;
  location_id: string;
  tip_key: string;
  sort_order: number;
}

export interface TipTranslationRow {
  tip_id: string;
  language_code: string;
  title: string;
  description: string;
}

export interface CTARow {
  id: string;
  location_id: string;
  button_url: string;
  button_variant: "primary" | "secondary" | "outline";
  sort_order: number;
}

export interface CTATranslationRow {
  cta_id: string;
  language_code: string;
  title: string;
  description: string;
  button_text: string;
}

export interface MetaRow {
  location_id: string;
  language_code: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
}

// ===== API Response Types =====

export interface GalleryItem {
  id: string;
  imageUrl: string;
  imageUrlWebp: string | null;
  altText: string;
  caption: string | null;
  sortOrder: number;
}

export interface FlyType {
  id: string;
  typeKey: string;
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface Section {
  id: string;
  sectionKey: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface Highlight {
  id: string;
  icon: string;
  label: string;
  sortOrder: number;
}

export interface Tip {
  id: string;
  tipKey: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface CTA {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  buttonVariant: "primary" | "secondary" | "outline";
  sortOrder: number;
}

export interface LocationMeta {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

// ===== Location List Item (for /api/locations) =====

export interface LocationListItem {
  id: string;
  href: string;
  cardName: string;
  cardThumb: string;
  cardThumbWebp: string;
  statusBadge: string;
  status: "active" | "coming_soon" | "inactive";
}

// ===== Full Location Details (for /api/locations/[id]) =====

export interface LocationDetails {
  id: string;
  href: string;
  heroHeadline: string;
  heroBg: string;
  heroThumb: string;
  heroThumbWebp: string;
  heroPin: boolean;
  altitude: number;
  status: "active" | "coming_soon" | "inactive";
  infoTitle: string;
  infoSubtitle: string;
  bookBtnText: string;
  gallery: GalleryItem[];
  flyTypes: FlyType[];
  sections: Section[];
  highlights: Highlight[];
  tips: Tip[];
  ctas: CTA[];
  meta: LocationMeta;
}

// ===== API Response Wrappers =====

export interface LocationsListResponse {
  locations: LocationListItem[];
  total: number;
}

export interface LocationDetailsResponse {
  location: LocationDetails;
}

// ===== Error Response =====

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
