/**
 * GET /api/locations/[id]
 *
 * Returns full details for a specific location including:
 * - Hero data
 * - Gallery (12 images)
 * - Fly types (3 types)
 * - Sections (4 sections)
 * - Highlights (4 highlights)
 * - Tips (6 tips)
 * - CTAs
 * - Meta/SEO
 *
 * Supports language parameter: ?lang=ka (default: ka)
 *
 * Examples:
 * - GET /api/locations/gudauri          → Georgian (default)
 * - GET /api/locations/gudauri?lang=en  → English
 * - GET /api/locations/kazbegi?lang=ru  → Russian
 */

import type { ApiErrorResponse, LocationDetailsResponse } from "@/types/api";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Supabase client for server-side
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Supported languages
const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "ar", "de", "fr", "tr"];
const DEFAULT_LANGUAGE = "ka";
const FALLBACK_LANGUAGE = "en";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: locationId } = await params;

    // Extract language from query params
    const searchParams = request.nextUrl.searchParams;
    let lang = searchParams.get("lang") || DEFAULT_LANGUAGE;

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      lang = DEFAULT_LANGUAGE;
    }

    // ===== STEP 1: Get main location data with translation =====
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
        card_altitude,
        card_status,
        location_translations!inner (
          language_code,
          hero_headline,
          card_name,
          info_title,
          info_intro
        )
      `
      )
      .eq("id", locationId)
      .eq("location_translations.language_code", lang)
      .single();

    console.log("🔍 Query for location:", locationId, "lang:", lang);
    console.log("📊 Location data:", locationData);
    console.log("❌ Location error:", locationError);

    let location = locationData;

    if (locationError || !locationData) {
      console.log("⚠️ Primary query failed, trying fallback...");
      // Try fallback language
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("locations")
        .select(
          `
          id,
          href,
          hero_bg,
          hero_thumb,
          hero_thumb_webp,
          hero_pin,
          card_altitude,
          card_status,
          location_translations!inner (
            language_code,
            hero_headline,
            card_name,
            info_title,
            info_intro
          )
        `
        )
        .eq("id", locationId)
        .eq("location_translations.language_code", FALLBACK_LANGUAGE)
        .single();

      if (fallbackError || !fallbackData) {
        const errorResponse: ApiErrorResponse = {
          error: "NOT_FOUND",
          message: `Location '${locationId}' not found`,
          statusCode: 404,
        };

        return NextResponse.json(errorResponse, { status: 404 });
      }

      // Use fallback data for subsequent queries
      location = fallbackData;
      lang = FALLBACK_LANGUAGE;
    }

    // ===== STEP 2: Get gallery with translations =====
    const { data: galleryData } = await supabase
      .from("location_gallery")
      .select(
        `
        id,
        src,
        src_webp,
        order_index,
        location_gallery_translations!inner (
          language_code,
          alt
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_gallery_translations.language_code", lang)
      .order("order_index", { ascending: true });

    // ===== STEP 3: Get fly types with translations =====
    const { data: flyTypesData } = await supabase
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
      .order("order_index", { ascending: true });

    // ===== STEP 4: Get sections with translations =====
    const { data: sectionsData } = await supabase
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
      .order("order_index", { ascending: true });

    // ===== STEP 5: Get highlights with translations =====
    const { data: highlightsData } = await supabase
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
      .order("order_index", { ascending: true });

    // ===== STEP 6: Get tips with translations =====
    const { data: tipsData } = await supabase
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
      .order("order_index", { ascending: true });

    // ===== STEP 7: Get CTAs with translations =====
    const { data: ctasData } = await supabase
      .from("location_ctas")
      .select(
        `
        id,
        href,
        variant,
        icon,
        order_index,
        location_cta_translations!inner (
          language_code,
          label
        )
      `
      )
      .eq("location_id", locationId)
      .eq("location_cta_translations.language_code", lang)
      .order("order_index", { ascending: true });

    // ===== STEP 8: Get meta =====
    const { data: metaData } = await supabase
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
      .order("order_index", { ascending: true });

    // ===== Transform data to API response format =====

    // Type guard to ensure location is not null
    if (!location) {
      const errorResponse: ApiErrorResponse = {
        error: "NOT_FOUND",
        message: `Location '${locationId}' not found`,
        statusCode: 404,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: LocationDetailsResponse = {
      location: {
        id: location.id,
        href: location.href,
        heroHeadline: location.location_translations[0].hero_headline,
        heroBg: location.hero_bg,
        heroThumb: location.hero_thumb,
        heroThumbWebp: location.hero_thumb_webp,
        heroPin: location.hero_pin,
        altitude: location.card_altitude,
        status: location.card_status as "active" | "coming_soon" | "inactive",
        infoTitle: location.location_translations[0].info_title,
        infoSubtitle: location.location_translations[0].info_intro || "",
        bookBtnText: "დაჯავშნა", // Default value since not in schema

        gallery: (galleryData || []).map((item: any) => ({
          id: item.id,
          imageUrl: item.src,
          imageUrlWebp: item.src_webp,
          altText: item.location_gallery_translations[0].alt,
          caption: null, // Not in schema
          sortOrder: item.order_index,
        })),

        flyTypes: (flyTypesData || []).map((item: any) => ({
          id: item.id,
          typeKey: item.fly_type_id,
          icon: "", // Not in schema
          title: item.location_fly_type_translations[0].name,
          description: item.location_fly_type_translations[0].description || "",
          sortOrder: item.order_index,
        })),

        sections: (sectionsData || []).map((item: any) => ({
          id: item.id,
          sectionKey: "", // Not in schema
          title: item.location_section_translations[0].title,
          content: item.location_section_translations[0].content,
          sortOrder: item.order_index,
        })),

        highlights: (highlightsData || []).map((item: any) => ({
          id: item.id,
          icon: item.icon || "",
          label: `${item.location_highlight_translations[0].title}: ${item.location_highlight_translations[0].value}`,
          sortOrder: item.order_index,
        })),

        tips: (tipsData || []).map((item: any) => ({
          id: item.id,
          tipKey: "", // Not in schema
          title: "", // Not in schema
          description: item.location_tip_translations[0].tip,
          sortOrder: item.order_index,
        })),

        ctas: (ctasData || []).map((item: any) => ({
          id: item.id,
          title: item.location_cta_translations[0].label,
          description: "",
          buttonText: item.location_cta_translations[0].label,
          buttonUrl: item.href,
          buttonVariant: item.variant as "primary" | "secondary" | "outline",
          sortOrder: item.order_index,
        })),

        meta:
          metaData && metaData.length > 0
            ? {
                metaTitle:
                  metaData.find(
                    (m: any) =>
                      m.location_meta_translations[0].label === "meta_title"
                  )?.location_meta_translations[0].value ||
                  location.location_translations[0].hero_headline,
                metaDescription:
                  metaData.find(
                    (m: any) =>
                      m.location_meta_translations[0].label ===
                      "meta_description"
                  )?.location_meta_translations[0].value ||
                  location.location_translations[0].info_intro ||
                  "",
                metaKeywords:
                  metaData.find(
                    (m: any) =>
                      m.location_meta_translations[0].label === "meta_keywords"
                  )?.location_meta_translations[0].value || null,
                ogTitle:
                  metaData.find(
                    (m: any) =>
                      m.location_meta_translations[0].label === "og_title"
                  )?.location_meta_translations[0].value || null,
                ogDescription:
                  metaData.find(
                    (m: any) =>
                      m.location_meta_translations[0].label === "og_description"
                  )?.location_meta_translations[0].value || null,
                ogImage:
                  metaData.find(
                    (m: any) =>
                      m.location_meta_translations[0].label === "og_image"
                  )?.location_meta_translations[0].value || null,
              }
            : {
                metaTitle: location.location_translations[0].hero_headline,
                metaDescription:
                  location.location_translations[0].info_intro || "",
                metaKeywords: null,
                ogTitle: null,
                ogDescription: null,
                ogImage: null,
              },
      },
    };

    // Return with ISR caching headers
    // s-maxage=600 → Cache for 10 minutes
    // stale-while-revalidate=1800 → Serve stale for 30 minutes while revalidating
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error(`Unexpected error in /api/locations/[id]:`, error);

    const errorResponse: ApiErrorResponse = {
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
