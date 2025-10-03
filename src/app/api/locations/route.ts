/**
 * GET /api/locations
 *
 * Returns list of all locations with basic info (for cards)
 * Supports language parameter: ?lang=ka (default: ka)
 *
 * Examples:
 * - GET /api/locations          → Georgian (default)
 * - GET /api/locations?lang=en  → English
 * - GET /api/locations?lang=ru  → Russian
 */

import type { ApiErrorResponse, LocationsListResponse } from "@/types/api";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Supabase client for server-side (use anon key for public read access)
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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Extract language from query params
    const searchParams = request.nextUrl.searchParams;
    let lang = searchParams.get("lang") || DEFAULT_LANGUAGE;

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      lang = DEFAULT_LANGUAGE;
    }

    // Query: Get all locations with translations
    const { data: locations, error } = await supabase
      .from("locations")
      .select(
        `
        id,
        href,
        hero_thumb,
        hero_thumb_webp,
        card_status,
        location_translations!inner (
          language_code,
          card_name,
          card_tagline
        )
      `
      )
      .eq("location_translations.language_code", lang)
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Supabase query error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      const errorResponse: ApiErrorResponse = {
        error: "DATABASE_ERROR",
        message: "Failed to fetch locations from database",
        statusCode: 500,
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }

    // If no data found for requested language, try fallback
    if (!locations || locations.length === 0) {
      const { data: fallbackLocations, error: fallbackError } = await supabase
        .from("locations")
        .select(
          `
          id,
          href,
          hero_thumb,
          hero_thumb_webp,
          status,
          location_translations!inner (
            language_code,
            card_name,
            status_badge
          )
        `
        )
        .eq("location_translations.language_code", FALLBACK_LANGUAGE)
        .order("id", { ascending: true });

      if (
        fallbackError ||
        !fallbackLocations ||
        fallbackLocations.length === 0
      ) {
        const errorResponse: ApiErrorResponse = {
          error: "NO_DATA",
          message: "No locations found in database",
          statusCode: 404,
        };

        return NextResponse.json(errorResponse, { status: 404 });
      }

      // Use fallback data
      const response: LocationsListResponse = {
        locations: fallbackLocations.map((loc: any) => ({
          id: loc.id,
          href: loc.href,
          cardName: loc.location_translations[0].card_name,
          cardThumb: loc.hero_thumb,
          cardThumbWebp: loc.hero_thumb_webp,
          statusBadge: loc.location_translations[0].card_tagline || "",
          status: loc.card_status as "active" | "coming_soon" | "inactive",
        })),
        total: fallbackLocations.length,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // Transform data to API response format
    const response: LocationsListResponse = {
      locations: locations.map((loc: any) => ({
        id: loc.id,
        href: loc.href,
        cardName: loc.location_translations[0].card_name,
        cardThumb: loc.hero_thumb,
        cardThumbWebp: loc.hero_thumb_webp,
        statusBadge: loc.location_translations[0].card_tagline || "",
        status: loc.card_status as "active" | "coming_soon" | "inactive",
      })),
      total: locations.length,
    };

    // Return with ISR caching headers
    // s-maxage=300 → Cache for 5 minutes
    // stale-while-revalidate=600 → Serve stale for 10 minutes while revalidating
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Unexpected error in /api/locations:", error);

    const errorResponse: ApiErrorResponse = {
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
