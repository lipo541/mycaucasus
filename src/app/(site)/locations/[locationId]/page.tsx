/**
 * Dynamic Location Page
 * Route: /locations/[locationId]
 * Fetches location data DIRECTLY from Supabase (not via API)
 */

import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Import existing components
// TODO: Replace with actual imports once we verify component structure
// import LocationsHero from '@/components/Locations/LocationsHero/LocationsHero';
// import Gallery from '@/components/Locations/Gallery/Gallery';
// import FlyTypes from '@/components/Locations/FlyTypes/FlyTypes';
// import LocationDetails from '@/components/Locations/LocationDetails/LocationDetails';

interface LocationPageProps {
  params: Promise<{ locationId: string }>;
}

// Type definitions from API
interface LocationData {
  id: string;
  href: string;
  hero_bg: string;
  hero_thumb: string;
  hero_thumb_webp: string;
  hero_pin: boolean;
  card_thumbnail: string;
  card_thumbnail_webp: string;
  card_status: string;
  card_altitude: number;
  card_active: boolean;
  is_published: boolean;
  location_translations: Array<{
    language_code: string;
    hero_headline: string;
    hero_tagline: string;
    hero_overlay_title: string;
    hero_overlay_desc: string;
    card_name: string;
    card_region: string;
    card_tagline: string;
    info_title: string;
    info_intro: string;
  }>;
  location_gallery: string[];
  location_fly_types: Array<{
    id: number;
    fly_type_id: string;
    duration: string;
    price: number;
    recommended: boolean;
    order_index: number;
    location_fly_type_translations: Array<{
      language_code: string;
      name: string;
      description: string;
      features: string[];
    }>;
  }>;
  location_sections: Array<{
    id: number;
    order_index: number;
    location_section_translations: Array<{
      language_code: string;
      title: string;
      content: string;
    }>;
  }>;
  location_highlights: Array<{
    id: number;
    icon: string;
    order_index: number;
    location_highlight_translations: Array<{
      language_code: string;
      title: string;
      value: string;
    }>;
  }>;
  location_tips: Array<{
    id: number;
    order_index: number;
    location_tip_translations: Array<{
      language_code: string;
      tip: string;
    }>;
  }>;
  location_meta: Array<{
    id: string;
    order_index: number;
    location_meta_translations: Array<{
      language_code: string;
      label: string;
      value: string;
    }>;
  }>;
}

interface LocationResponse {
  location: LocationData;
}

// Fetch location data from API
async function getLocation(
  locationId: string,
  lang: string = "ka"
): Promise<LocationData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log("🔍 Fetching location:", locationId, "lang:", lang);

    // STEP 1: Get main location data
    const { data: locationData, error: locationError } = await supabase
      .from("locations")
      .select(
        `
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
        is_published,
        gallery_urls,
        location_translations!inner (
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
        )
      `
      )
      .eq("id", locationId)
      .eq("location_translations.language_code", lang)
      .single();

    if (locationError || !locationData) {
      console.error("❌ Location not found:", locationError);
      return null;
    }

    console.log("✅ Location found:", locationData.id);

    // Get gallery URLs from locations table
    const galleryUrls: string[] = locationData.gallery_urls || [];
    console.log("🖼️ Gallery URLs:", galleryUrls);

    // STEP 2: Get fly types
    const { data: flyTypes } = await supabase
      .from("location_fly_types")
      .select(
        `
        id,
        fly_type_id,
        duration,
        price,
        recommended,
        order_index,
        location_fly_type_translations!inner (
          language_code,
          name,
          description,
          features
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_fly_type_translations.language_code", lang)
      .order("order_index");

    // STEP 4: Get sections
    const { data: sections } = await supabase
      .from("location_sections")
      .select(
        `
        id,
        order_index,
        location_section_translations!inner (
          language_code,
          title,
          content
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_section_translations.language_code", lang)
      .order("order_index");

    // STEP 5: Get highlights
    const { data: highlights } = await supabase
      .from("location_highlights")
      .select(
        `
        id,
        icon,
        order_index,
        location_highlight_translations!inner (
          language_code,
          title,
          value
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_highlight_translations.language_code", lang)
      .order("order_index");

    // STEP 6: Get tips
    const { data: tips } = await supabase
      .from("location_tips")
      .select(
        `
        id,
        order_index,
        location_tip_translations!inner (
          language_code,
          tip
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_tip_translations.language_code", lang)
      .order("order_index");

    // STEP 7: Get meta (hero badges like "ადგილმდებარეობა")
    const { data: meta } = await supabase
      .from("location_meta")
      .select(
        `
        id,
        order_index,
        location_meta_translations!inner (
          language_code,
          label,
          value
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_meta_translations.language_code", lang)
      .order("order_index");

    // Combine all data
    const fullLocation: LocationData = {
      ...locationData,
      location_gallery: galleryUrls,
      location_fly_types: flyTypes || [],
      location_sections: sections || [],
      location_highlights: highlights || [],
      location_tips: tips || [],
      location_meta: meta || [],
    };

    console.log("📦 Full location data assembled");
    console.log("🖼️ Gallery URLs from DB:", galleryUrls);
    console.log("📊 Gallery count:", galleryUrls.length);
    console.log("✨ Highlights from DB:", highlights);
    console.log("📝 Sections from DB:", sections);
    console.log("💡 Tips from DB:", tips);
    return fullLocation;
  } catch (error) {
    console.error("💥 Failed to fetch location:", error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { locationId } = await params;
  const location = await getLocation(locationId, "ka");

  if (
    !location ||
    !location.location_translations ||
    location.location_translations.length === 0
  ) {
    return {
      title: "Location Not Found | MyCaucasus",
    };
  }

  const translation = location.location_translations[0];

  return {
    title: `${
      translation?.hero_headline || locationId
    } | MyCaucasus Tandem Paragliding`,
    description: translation?.info_intro || translation?.hero_tagline || "",
    openGraph: {
      title: translation?.hero_headline || locationId,
      description: translation?.info_intro || "",
      images: [
        {
          url: location.hero_bg,
          width: 1920,
          height: 1080,
          alt: translation?.hero_headline || "",
        },
      ],
    },
  };
}

// Generate static params for all locations at build time
export async function generateStaticParams() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("is_published", true);

    return (
      data?.map((loc) => ({
        locationId: loc.id,
      })) || []
    );
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { locationId } = await params;
  const dbLocation = await getLocation(locationId, "ka");

  if (!dbLocation || !dbLocation.is_published) {
    notFound();
  }

  const translation = dbLocation.location_translations[0];

  // Transform database data to LOCATIONS format
  const flyTypesData = dbLocation.location_fly_types.map((fly) => ({
    id: fly.fly_type_id,
    name: fly.location_fly_type_translations[0]?.name || "",
    duration: fly.duration,
    price: fly.price,
    description: fly.location_fly_type_translations[0]?.description || "",
    features: fly.location_fly_type_translations[0]?.features || [],
    recommended: fly.recommended,
  }));

  const location: any = {
    id: dbLocation.id,
    href: dbLocation.href,
    hero: {
      bg: dbLocation.hero_bg,
      thumb: dbLocation.hero_thumb,
      thumbWebp: dbLocation.hero_thumb_webp,
      pin: dbLocation.hero_pin,
      headline: translation.hero_headline,
      tagline: translation.hero_tagline,
      overlayTitle: translation.hero_overlay_title || "",
      overlayDesc: translation.hero_overlay_desc || "",
      // Add flyTypes to hero for LocationsHero component
      flyTypes: flyTypesData,
      // Add meta badges from database
      meta: dbLocation.location_meta.map((m) => ({
        label: m.location_meta_translations[0]?.label || "",
        value: m.location_meta_translations[0]?.value || "",
      })),
      // Add static CTA button
      ctas: [
        {
          label: "დაჯავშნა",
          href: "#booking",
          variant: "primary",
        },
      ],
    },
    gallery: dbLocation.location_gallery.map((url) => ({
      src: url,
      srcWebp: url, // Same URL for both (Supabase Storage supports WebP)
      alt: "",
    })),
    // Top-level flyTypes for FlyTypes component
    flyTypes: flyTypesData,
    info: {
      title: translation.info_title,
      intro: translation.info_intro,
      sections: dbLocation.location_sections.map((sec) => ({
        title: sec.location_section_translations[0]?.title || "",
        content: sec.location_section_translations[0]?.content || "",
      })),
      highlights: dbLocation.location_highlights.map((h) => ({
        title: h.location_highlight_translations[0]?.title || "",
        value: h.location_highlight_translations[0]?.value || "",
        icon: h.icon,
      })),
      tips: dbLocation.location_tips.map(
        (t) => t.location_tip_translations[0]?.tip || ""
      ),
    },
    card: {
      name: translation.card_name,
      region: translation.card_region || "",
      tagline: translation.card_tagline || "",
      thumbnail: dbLocation.card_thumbnail,
      thumbnailWebp: dbLocation.card_thumbnail_webp,
      status: dbLocation.card_status,
      altitude: dbLocation.card_altitude,
      active: dbLocation.card_active,
    },
  };

  const { LocationProvider } = await import(
    "@/components/Locations/LocationContext"
  );
  const LocationPageComponent = (
    await import("@/components/Locations/locationpage")
  ).default;

  return (
    <LocationProvider value={{ location, language: "ka" }}>
      <LocationPageComponent />
    </LocationProvider>
  );
}
