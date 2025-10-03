/**
 * Location Manager - Unified CRUD Interface
 * Supports: List, Create, Edit, Delete
 */

"use client";
import {
  uploadLocationImage,
  uploadMultipleLocationImages,
} from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import styles from "./Addlocation.module.css";

type FlightPackage = {
  id?: number;
  key: string;
  title: string;
  description: string;
  info: string;
  price: string;
  discount: string;
  features: string[]; // Array of feature strings (checkmarks)
};

type LocationSection = {
  id: string;
  heading: string;
  body: string;
  images: File[];
  existingImages?: string[]; // For edit mode
};

type LocationDraft = {
  // Basic Info
  locationId: string;
  altitude?: number;

  // Images
  heroImage: File | null;
  heroImageUrl: string;
  cardImage: File | null;
  cardImageUrl: string;

  // Gallery (location_gallery)
  galleryImages: File[]; // New images to upload
  existingGalleryUrls: string[]; // URLs from DB (for edit mode)

  // Hero Section (location_translations)
  slogan: string; // hero_headline + card_name
  mainText: string; // hero_tagline
  overlayTitle: string; // hero_overlay_title (NEW!)
  overlayDesc: string; // hero_overlay_desc (NEW!)

  // Card Section (location_translations)
  description: string; // card_tagline
  region: string; // card_region (NEW!)

  // Info Section (location_translations)
  infoCardTitle: string; // info_title
  infoCardText: string; // info_intro

  // Highlights (location_highlights + translations)
  highlights: Array<{
    id?: number; // For edit mode
    title: string; // e.g. "სიმაღლე" (was "label" - must match DB column)
    value: string; // e.g. "2196 მ"
    icon?: string; // e.g. "📍" (optional)
  }>;

  // Tips (location_tips + translations)
  tips: Array<{
    id?: number; // For edit mode
    text: string; // e.g. "დილის საათები საუკეთესოა ფრენისთვის"
  }>;

  // Tags (deprecated - can remove)
  tags: string[];

  // Flight Packages (location_fly_types + translations)
  flights: FlightPackage[];

  // Sections (location_sections + translations)
  sections: LocationSection[];
};

interface LocationRow {
  id: string;
  href: string;
  card_status: string;
  card_altitude: number;
  is_published: boolean;
  created_at: string;
  location_translations: Array<{
    language_code: string;
    card_name: string;
    hero_headline: string;
  }>;
}

type ViewMode = "list" | "create" | "edit";

interface LocationManagerProps {
  initialMode?: ViewMode;
  editLocationId?: string;
}

export default function LocationManager({
  initialMode = "list",
  editLocationId,
}: LocationManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [currentEditId, setCurrentEditId] = useState<string | undefined>(
    editLocationId
  );

  // List View State
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  // Form State
  const [draft, setDraft] = useState<LocationDraft>(getEmptyDraft());
  const [tagInput, setTagInput] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formStatus, setFormStatus] = useState("");

  // Load locations when in list mode
  useEffect(() => {
    if (viewMode === "list") {
      loadLocations();
    }
  }, [viewMode]);

  // Load location data when editing
  useEffect(() => {
    if (viewMode === "edit" && currentEditId) {
      loadLocationForEdit(currentEditId);
    }
  }, [viewMode, currentEditId]);

  function getEmptyDraft(): LocationDraft {
    return {
      // Basic
      locationId: "",
      altitude: 0,

      // Images
      heroImage: null,
      heroImageUrl: "",
      cardImage: null,
      cardImageUrl: "",

      // Gallery
      galleryImages: [],
      existingGalleryUrls: [],

      // Hero
      slogan: "",
      mainText: "",
      overlayTitle: "",
      overlayDesc: "",

      // Card
      description: "",
      region: "",

      // Info
      infoCardTitle: "",
      infoCardText: "",

      // Highlights (pre-populated with common examples)
      highlights: [
        { title: "სიმაღლე", value: "", icon: "📍" },
        { title: "ფრენის სეზონი", value: "", icon: "📅" },
        { title: "მანძილი თბილისიდან", value: "", icon: "🚗" },
        { title: "ფრენის ხანგრძლივობა", value: "", icon: "⏱️" },
      ],

      // Tips
      tips: [],

      // Legacy
      tags: [],

      // Flight packages
      flights: [
        {
          key: "acro",
          title: "აკრობატული ფრენა",
          description: "",
          info: "",
          price: "",
          discount: "",
          features: [],
        },
        {
          key: "long",
          title: "ხანგრძლივი ფრენა",
          description: "",
          info: "",
          price: "",
          discount: "",
          features: [],
        },
        {
          key: "standard",
          title: "სტანდარტული ფრენა",
          description: "",
          info: "",
          price: "",
          discount: "",
          features: [],
        },
      ],

      // Sections
      sections: [
        { id: "sec-1", heading: "", body: "", images: [] },
        { id: "sec-2", heading: "", body: "", images: [] },
        { id: "sec-3", heading: "", body: "", images: [] },
      ],
    };
  }

  // ============ LIST FUNCTIONS ============

  const loadLocations = async () => {
    setListLoading(true);
    setListError("");

    try {
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase
        .from("locations")
        .select(
          `
					id,
					href,
					card_status,
					card_altitude,
					is_published,
					created_at,
					location_translations!inner (
						language_code,
						card_name,
						hero_headline
					)
				`
        )
        .eq("location_translations.language_code", "ka")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLocations(data || []);
    } catch (err: any) {
      console.error("Load locations error:", err);
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (
      !confirm(
        `დარწმუნებული ხარ რომ გსურს "${locationId}" წაშლა? (cascade delete)`
      )
    ) {
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", locationId);

      if (error) throw error;

      alert("✅ ლოკაცია წარმატებით წაიშალა!");
      loadLocations();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`❌ წაშლის შეცდომა: ${err.message}`);
    }
  };

  const handleTogglePublish = async (
    locationId: string,
    currentStatus: boolean
  ) => {
    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase
        .from("locations")
        .update({ is_published: !currentStatus })
        .eq("id", locationId);

      if (error) throw error;

      alert(`✅ სტატუსი შეიცვალა!`);
      loadLocations();
    } catch (err: any) {
      console.error("Toggle error:", err);
      alert(`❌ შეცდომა: ${err.message}`);
    }
  };

  const handleEdit = (locationId: string) => {
    setCurrentEditId(locationId);
    setViewMode("edit");
  };

  const handleCreateNew = () => {
    setDraft(getEmptyDraft());
    setCurrentEditId(undefined);
    setViewMode("create");
  };

  const backToList = () => {
    setViewMode("list");
    setDraft(getEmptyDraft());
    setCurrentEditId(undefined);
    setFormStatus("");
  };

  // ============ EDIT LOAD FUNCTION ============

  const loadLocationForEdit = async (locationId: string) => {
    setFormSaving(true);
    setFormStatus("📥 ლოკაციის ჩატვირთვა...");

    try {
      const supabase = createSupabaseBrowserClient();

      // Load main location
      const { data: loc, error: locError } = await supabase
        .from("locations")
        .select(
          `
					id,
					hero_bg,
					hero_thumb,
					card_thumbnail,
					card_altitude,
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
        .eq("location_translations.language_code", "ka")
        .single();

      if (locError) throw locError;

      const translation = loc.location_translations[0];

      // Load sections
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
        .eq("location_section_translations.language_code", "ka")
        .order("order_index");

      // Load flights
      const { data: flights } = await supabase
        .from("location_fly_types")
        .select(
          `
					id,
					fly_type_id,
					price,
					location_fly_type_translations!inner (
						language_code,
						name,
						description,
						features
					)
				`
        )
        .eq("location_id", locationId)
        .eq("location_fly_type_translations.language_code", "ka")
        .order("order_index");

      // Load highlights
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
        .eq("location_highlight_translations.language_code", "ka")
        .order("order_index");

      // Load tips
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
        .eq("location_tip_translations.language_code", "ka")
        .order("order_index");

      // Populate draft
      setDraft({
        // Basic
        locationId: loc.id,
        altitude: loc.card_altitude || 0,

        // Images
        heroImage: null,
        heroImageUrl: loc.hero_bg || "",
        cardImage: null,
        cardImageUrl: loc.card_thumbnail || "",

        // Gallery
        galleryImages: [],
        existingGalleryUrls: loc.gallery_urls || [],

        // Hero
        slogan: translation.hero_headline || "",
        mainText: translation.hero_tagline || "",
        overlayTitle: translation.hero_overlay_title || "",
        overlayDesc: translation.hero_overlay_desc || "",

        // Card
        description: translation.card_tagline || "",
        region: translation.card_region || "",

        // Info
        infoCardTitle: translation.info_title || "",
        infoCardText: translation.info_intro || "",

        // Highlights
        highlights:
          highlights?.map((h) => ({
            id: h.id,
            title: h.location_highlight_translations[0]?.title || "",
            value: h.location_highlight_translations[0]?.value || "",
            icon: h.icon || "",
          })) || [],

        // Tips
        tips:
          tips?.map((t) => ({
            id: t.id,
            text: t.location_tip_translations[0]?.tip || "",
          })) || [],

        // Legacy
        tags: [],

        // Flight packages
        flights:
          flights?.map((f) => ({
            id: f.id,
            key: f.fly_type_id,
            title: f.location_fly_type_translations[0]?.name || "",
            description: f.location_fly_type_translations[0]?.description || "",
            info: "",
            price: f.price?.toString() || "",
            discount: "",
            features: f.location_fly_type_translations[0]?.features || [],
          })) || [],

        // Sections
        sections:
          sections?.map((s, idx) => ({
            id: s.id.toString(),
            heading: s.location_section_translations[0]?.title || "",
            body: s.location_section_translations[0]?.content || "",
            images: [],
            existingImages: [],
          })) || [],
      });

      setFormStatus("✅ ჩაიტვირთა!");
    } catch (err: any) {
      console.error("Load for edit error:", err);
      setFormStatus(`❌ ჩატვირთვის შეცდომა: ${err.message}`);
    } finally {
      setFormSaving(false);
    }
  };

  // ============ FORM FUNCTIONS ============

  const update = <K extends keyof LocationDraft>(
    field: K,
    value: LocationDraft[K]
  ) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const updateFlight = (
    key: string,
    field: keyof FlightPackage,
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      flights: d.flights.map((f) =>
        f.key === key ? { ...f, [field]: value } : f
      ),
    }));
  };

  const addFlightFeature = (flightKey: string) => {
    setDraft((d) => ({
      ...d,
      flights: d.flights.map((f) =>
        f.key === flightKey ? { ...f, features: [...f.features, ""] } : f
      ),
    }));
  };

  const updateFlightFeature = (
    flightKey: string,
    featureIndex: number,
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      flights: d.flights.map((f) =>
        f.key === flightKey
          ? {
              ...f,
              features: f.features.map((feat, i) =>
                i === featureIndex ? value : feat
              ),
            }
          : f
      ),
    }));
  };

  const removeFlightFeature = (flightKey: string, featureIndex: number) => {
    setDraft((d) => ({
      ...d,
      flights: d.flights.map((f) =>
        f.key === flightKey
          ? { ...f, features: f.features.filter((_, i) => i !== featureIndex) }
          : f
      ),
    }));
  };

  const updateSection = (
    id: string,
    field: keyof LocationSection,
    value: any
  ) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleHeroImage = (file: File | null) => update("heroImage", file);
  const handleCardImage = (file: File | null) => update("cardImage", file);

  const handleGalleryImages = (files: FileList | null) => {
    if (!files || !files.length) return;
    setDraft((d) => ({
      ...d,
      galleryImages: [...d.galleryImages, ...Array.from(files)],
    }));
  };

  const removeGalleryImage = (index: number) => {
    setDraft((d) => ({
      ...d,
      galleryImages: d.galleryImages.filter((_, i) => i !== index),
    }));
  };

  const removeExistingGalleryImage = (url: string) => {
    setDraft((d) => ({
      ...d,
      existingGalleryUrls: d.existingGalleryUrls.filter((u) => u !== url),
    }));
  };

  const addHighlight = () => {
    setDraft((d) => ({
      ...d,
      highlights: [...d.highlights, { title: "", value: "", icon: "📍" }],
    }));
  };

  const updateHighlight = (
    index: number,
    field: "title" | "value" | "icon",
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      highlights: d.highlights.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const removeHighlight = (index: number) => {
    setDraft((d) => ({
      ...d,
      highlights: d.highlights.filter((_, i) => i !== index),
    }));
  };

  const addTip = () => {
    setDraft((d) => ({
      ...d,
      tips: [...d.tips, { text: "" }],
    }));
  };

  const updateTip = (index: number, text: string) => {
    setDraft((d) => ({
      ...d,
      tips: d.tips.map((t, i) => (i === index ? { ...t, text } : t)),
    }));
  };

  const removeTip = (index: number) => {
    setDraft((d) => ({
      ...d,
      tips: d.tips.filter((_, i) => i !== index),
    }));
  };

  const addSectionImage = (id: string, files: FileList | null) => {
    if (!files || !files.length) return;
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === id ? { ...s, images: [...s.images, ...Array.from(files)] } : s
      ),
    }));
  };

  const removeSectionImage = (id: string, index: number) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === id
          ? { ...s, images: s.images.filter((_, i) => i !== index) }
          : s
      ),
    }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || draft.tags.includes(t)) return;
    setDraft((d) => ({ ...d, tags: [...d.tags, t] }));
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }));
  };

  // ============ SUBMIT (CREATE/UPDATE) ============

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!draft.locationId.trim()) {
      setFormStatus("❌ Location ID აუცილებელია");
      return;
    }
    if (!draft.slogan.trim()) {
      setFormStatus("❌ სლოგანი აუცილებელია");
      return;
    }
    if (viewMode === "create" && !draft.heroImage) {
      setFormStatus("❌ ატვირთე hero სურათი");
      return;
    }

    setFormSaving(true);
    setFormStatus("💾 შენახვა...");

    try {
      const supabase = createSupabaseBrowserClient();
      const locationId = draft.locationId.toLowerCase().replace(/\s+/g, "-");

      let heroUrl = draft.heroImageUrl;
      let cardUrl = draft.cardImageUrl;

      // Upload new images if provided
      if (draft.heroImage) {
        setFormStatus("📤 Hero სურათის ატვირთვა...");
        const result = await uploadLocationImage(
          draft.heroImage,
          locationId,
          "hero"
        );
        if (result.error) throw new Error(result.error);
        heroUrl = result.url;
      }

      if (draft.cardImage) {
        setFormStatus("📤 Card სურათის ატვირთვა...");
        const result = await uploadLocationImage(
          draft.cardImage,
          locationId,
          "thumbnails"
        );
        if (!result.error) cardUrl = result.url;
      }

      // Upload section images
      const sectionImageUrls: Record<string, string[]> = {};
      for (const section of draft.sections) {
        if (section.images.length > 0) {
          const results = await uploadMultipleLocationImages(
            section.images,
            locationId,
            "gallery"
          );
          sectionImageUrls[section.id] = results
            .filter((r) => !r.error)
            .map((r) => r.url);
        }
      }

      if (viewMode === "edit") {
        // UPDATE mode
        setFormStatus("💾 ლოკაციის განახლება...");

        const { error: updateError } = await supabase
          .from("locations")
          .update({
            hero_bg: heroUrl,
            hero_thumb: cardUrl || heroUrl,
            hero_thumb_webp: cardUrl || heroUrl,
            card_thumbnail: cardUrl || heroUrl,
            card_thumbnail_webp: cardUrl || heroUrl,
            card_altitude: draft.altitude || 0,
          })
          .eq("id", locationId);

        if (updateError) throw updateError;

        // Update translation
        await supabase
          .from("location_translations")
          .update({
            hero_headline: draft.slogan,
            hero_tagline: draft.mainText,
            hero_overlay_title: draft.overlayTitle,
            hero_overlay_desc: draft.overlayDesc,
            card_name: draft.slogan,
            card_region: draft.region,
            card_tagline: draft.description,
            info_title: draft.infoCardTitle,
            info_intro: draft.infoCardText,
          })
          .eq("location_id", locationId)
          .eq("language_code", "ka");

        // UPDATE sections: Delete old ones and insert new ones
        // (Simple approach - more sophisticated would be UPDATE existing)
        await supabase
          .from("location_sections")
          .delete()
          .eq("location_id", locationId);

        for (const section of draft.sections) {
          if (!section.heading) continue;

          const { data: secData } = await supabase
            .from("location_sections")
            .insert({
              location_id: locationId,
              order_index: draft.sections.indexOf(section),
            })
            .select()
            .single();

          if (secData) {
            await supabase.from("location_section_translations").insert({
              section_id: secData.id,
              language_code: "ka",
              title: section.heading,
              content: section.body,
            });
          }
        }

        // UPDATE highlights: Delete old and insert new
        await supabase
          .from("location_highlights")
          .delete()
          .eq("location_id", locationId);

        for (const highlight of draft.highlights) {
          if (!highlight.title || !highlight.value) continue;

          const { data: highlightData } = await supabase
            .from("location_highlights")
            .insert({
              location_id: locationId,
              icon: highlight.icon || "📍",
              order_index: draft.highlights.indexOf(highlight),
            })
            .select()
            .single();

          if (highlightData) {
            await supabase.from("location_highlight_translations").insert({
              highlight_id: highlightData.id,
              language_code: "ka",
              title: highlight.title,
              value: highlight.value,
            });
          }
        }

        // UPDATE tips: Delete old and insert new
        await supabase
          .from("location_tips")
          .delete()
          .eq("location_id", locationId);

        for (const tip of draft.tips) {
          if (!tip.text) continue;

          const { data: tipData } = await supabase
            .from("location_tips")
            .insert({
              location_id: locationId,
              order_index: draft.tips.indexOf(tip),
            })
            .select()
            .single();

          if (tipData) {
            await supabase.from("location_tip_translations").insert({
              tip_id: tipData.id,
              language_code: "ka",
              tip: tip.text,
            });
          }
        }

        // UPDATE fly_types: Delete old and insert new
        await supabase
          .from("location_fly_types")
          .delete()
          .eq("location_id", locationId);

        for (const flight of draft.flights) {
          if (!flight.title || !flight.price) continue;

          const { data: flyData } = await supabase
            .from("location_fly_types")
            .insert({
              location_id: locationId,
              fly_type_id: flight.key,
              duration: "30-60 წუთი",
              price: parseFloat(flight.price) || 0,
              recommended: flight.key === "standard",
              order_index: draft.flights.indexOf(flight),
            })
            .select()
            .single();

          if (flyData) {
            await supabase.from("location_fly_type_translations").insert({
              fly_type_id: flyData.id,
              language_code: "ka",
              name: flight.title,
              description: flight.description || "",
              features: flight.features || [],
            });
          }
        }

        // UPDATE gallery: Upload new images and merge with existing
        let finalGalleryUrls = [...draft.existingGalleryUrls];

        if (draft.galleryImages.length > 0) {
          setFormStatus("📸 ახალი გალერეის სურათების ატვირთვა...");

          const galleryResults = await uploadMultipleLocationImages(
            draft.galleryImages,
            locationId,
            "gallery"
          );

          // Add new URLs to gallery array
          for (const result of galleryResults) {
            if (!result.error) {
              finalGalleryUrls.push(result.url);
            } else {
              console.error("Gallery upload error:", result.error);
            }
          }
        }

        // Update gallery_urls in locations table
        await supabase
          .from("locations")
          .update({
            gallery_urls: finalGalleryUrls,
          })
          .eq("id", locationId);

        setFormStatus("✅ ლოკაცია განახლდა!");
      } else {
        // CREATE mode
        setFormStatus("💾 ახალი ლოკაციის შექმნა...");

        const { error: insertError } = await supabase.from("locations").insert({
          id: locationId,
          href: `/locations/${locationId}`,
          hero_bg: heroUrl,
          hero_thumb: cardUrl || heroUrl,
          hero_thumb_webp: cardUrl || heroUrl,
          hero_pin: true,
          card_thumbnail: cardUrl || heroUrl,
          card_thumbnail_webp: cardUrl || heroUrl,
          card_status: "active",
          card_altitude: draft.altitude || 0,
          card_active: true,
          is_published: true,
        });

        if (insertError) throw insertError;

        // Insert translation
        await supabase.from("location_translations").insert({
          location_id: locationId,
          language_code: "ka",
          hero_headline: draft.slogan,
          hero_tagline: draft.mainText,
          hero_overlay_title: draft.overlayTitle,
          hero_overlay_desc: draft.overlayDesc,
          card_name: draft.slogan,
          card_region: draft.region,
          card_tagline: draft.description,
          info_title: draft.infoCardTitle,
          info_intro: draft.infoCardText,
        });

        // Insert flights
        for (const flight of draft.flights) {
          if (!flight.title || !flight.price) continue;

          const { data: flyData } = await supabase
            .from("location_fly_types")
            .insert({
              location_id: locationId,
              fly_type_id: flight.key,
              duration: "30-60 წუთი",
              price: parseFloat(flight.price) || 0,
              recommended: flight.key === "standard",
              order_index: draft.flights.indexOf(flight),
            })
            .select()
            .single();

          if (flyData) {
            await supabase.from("location_fly_type_translations").insert({
              fly_type_id: flyData.id,
              language_code: "ka",
              name: flight.title,
              description: flight.description || "",
              features: flight.features || [],
            });
          }
        }

        // Insert sections
        for (const section of draft.sections) {
          if (!section.heading) continue;

          const { data: secData } = await supabase
            .from("location_sections")
            .insert({
              location_id: locationId,
              order_index: draft.sections.indexOf(section),
            })
            .select()
            .single();

          if (secData) {
            await supabase.from("location_section_translations").insert({
              section_id: secData.id,
              language_code: "ka",
              title: section.heading,
              content: section.body,
            });
          }
        }

        // Insert highlights
        for (const highlight of draft.highlights) {
          if (!highlight.title || !highlight.value) continue;

          const { data: highlightData } = await supabase
            .from("location_highlights")
            .insert({
              location_id: locationId,
              icon: highlight.icon || "📍",
              order_index: draft.highlights.indexOf(highlight),
            })
            .select()
            .single();

          if (highlightData) {
            await supabase.from("location_highlight_translations").insert({
              highlight_id: highlightData.id,
              language_code: "ka",
              title: highlight.title,
              value: highlight.value,
            });
          }
        }

        // Insert tips
        for (const tip of draft.tips) {
          if (!tip.text) continue;

          const { data: tipData } = await supabase
            .from("location_tips")
            .insert({
              location_id: locationId,
              order_index: draft.tips.indexOf(tip),
            })
            .select()
            .single();

          if (tipData) {
            await supabase.from("location_tip_translations").insert({
              tip_id: tipData.id,
              language_code: "ka",
              tip: tip.text,
            });
          }
        }

        // Upload gallery images to Storage and save URLs in locations table
        let galleryUrls: string[] = [];

        if (draft.galleryImages.length > 0) {
          setFormStatus("📸 გალერეის სურათების ატვირთვა...");

          const galleryResults = await uploadMultipleLocationImages(
            draft.galleryImages,
            locationId,
            "gallery"
          );

          // Collect successful URLs
          galleryUrls = galleryResults
            .filter((r) => !r.error)
            .map((r) => r.url);

          if (galleryUrls.length > 0) {
            // Update locations table with gallery URLs
            await supabase
              .from("locations")
              .update({
                gallery_urls: galleryUrls,
              })
              .eq("id", locationId);
          }
        }

        setFormStatus("✅ ლოკაცია დამატებულია!");
      }

      setTimeout(() => {
        backToList();
      }, 1500);
    } catch (err: any) {
      console.error("Submit error:", err);
      setFormStatus(`❌ შეცდომა: ${err.message}`);
    } finally {
      setFormSaving(false);
    }
  };

  // ============ RENDER ============

  if (viewMode === "list") {
    return (
      <div className={styles.wrapper}>
        <div className={styles.listHeader}>
          <h2 className={styles.title}>ლოკაციების მართვა</h2>
          <button
            onClick={handleCreateNew}
            className={`${styles.btn} ${styles.primary}`}
          >
            + ახალი ლოკაცია
          </button>
        </div>

        {listLoading && <div className={styles.loading}>იტვირთება...</div>}
        {listError && <div className={styles.error}>❌ {listError}</div>}

        {!listLoading && !listError && locations.length === 0 && (
          <div className={styles.empty}>
            <p>ლოკაციები არ არის</p>
            <button
              onClick={handleCreateNew}
              className={`${styles.btn} ${styles.primary}`}
            >
              დაამატე პირველი ლოკაცია
            </button>
          </div>
        )}

        {!listLoading && locations.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>დასახელება</th>
                  <th>სიმაღლე</th>
                  <th>სტატუსი</th>
                  <th>გამოქვეყნებული</th>
                  <th>მოქმედებები</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => {
                  const trans = loc.location_translations[0];
                  return (
                    <tr key={loc.id}>
                      <td className={styles.idCell}>{loc.id}</td>
                      <td>
                        <strong>{trans?.card_name || "-"}</strong>
                        <br />
                        <small>{trans?.hero_headline || "-"}</small>
                      </td>
                      <td>{loc.card_altitude}m</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            styles[loc.card_status]
                          }`}
                        >
                          {loc.card_status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`${styles.toggleBtn} ${
                            loc.is_published ? styles.published : styles.draft
                          }`}
                          onClick={() =>
                            handleTogglePublish(loc.id, loc.is_published)
                          }
                        >
                          {loc.is_published ? "✅" : "🔒"}
                        </button>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          onClick={() => handleEdit(loc.id)}
                          className={styles.editBtn}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id)}
                          className={styles.deleteBtn}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // FORM VIEW (create or edit)
  return (
    <div className={styles.wrapper}>
      <div className={styles.formHeader}>
        <button onClick={backToList} className={styles.backBtn}>
          ← უკან
        </button>
        <h2 className={styles.title}>
          {viewMode === "edit"
            ? `რედაქტირება: ${draft.locationId}`
            : "ახალი ლოკაცია"}
        </h2>
      </div>

      <form onSubmit={submit} className={styles.form}>
        {/* 0️⃣ ძირითადი ინფო */}
        <fieldset className={styles.fieldset}>
          <legend>0️⃣ ძირითადი ინფორმაცია</legend>
          <div className={styles.field}>
            <label htmlFor="loc-id">Location ID (slug) *</label>
            <input
              id="loc-id"
              value={draft.locationId}
              onChange={(e) =>
                update(
                  "locationId",
                  e.target.value.toLowerCase().replace(/\s+/g, "-")
                )
              }
              placeholder="gudauri, kazbegi..."
              disabled={viewMode === "edit"}
              required
            />
            <span className={styles.smallNote}>
              {viewMode === "edit"
                ? "⚠️ ID-ს ცვლილება შეუძლებელია"
                : "URL: /locations/{id}"}
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="loc-altitude">სიმაღლე (მეტრი)</label>
            <input
              id="loc-altitude"
              type="number"
              value={draft.altitude || 0}
              onChange={(e) =>
                update("altitude", parseInt(e.target.value) || 0)
              }
              placeholder="2196"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="loc-region">რეგიონი *</label>
            <input
              id="loc-region"
              value={draft.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="მცხეთა-მთიანეთი"
              required
            />
            <span className={styles.smallNote}>
              გამოიყენება ბარათზე და LocationsHero-ში
            </span>
          </div>
        </fieldset>

        {/* 1️⃣ Hero Section - ესე გამოჩნდება გვერდის თავში */}
        <fieldset className={styles.fieldset}>
          <legend>1️⃣ Hero Section (მთავარი ბანერი - LocationsHero)</legend>
          <div className={styles.fileInput}>
            <label>
              🖼️ Hero Background სურათი {viewMode === "create" && "*"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleHeroImage(e.target.files?.[0] || null)}
            />
            {draft.heroImage && (
              <span className={styles.smallNote}>
                ✅ {draft.heroImage.name}
              </span>
            )}
            {draft.heroImageUrl && !draft.heroImage && (
              <span className={styles.smallNote}>
                ამჟამინდელი: {draft.heroImageUrl.split("/").pop()}
              </span>
            )}

            {/* Preview */}
            {(draft.heroImage || draft.heroImageUrl) && (
              <div className={styles.imagePreviewWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    draft.heroImage
                      ? URL.createObjectURL(draft.heroImage)
                      : draft.heroImageUrl
                  }
                  alt="Hero preview"
                />
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="loc-slogan">📌 Headline (მთავარი სათაური) *</label>
            <input
              id="loc-slogan"
              value={draft.slogan}
              onChange={(e) => update("slogan", e.target.value)}
              placeholder="გუდაური"
              required
            />
            <span className={styles.smallNote}>
              ჩნდება Hero ბანერზე დიდი ტექსტით + გამოიყენება card name-ად
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="loc-maintext">📝 Tagline (ქვეწარწერა)</label>
            <textarea
              id="loc-maintext"
              rows={2}
              value={draft.mainText}
              onChange={(e) => update("mainText", e.target.value)}
              placeholder="პარაგლაიდინგი კავკასიონზე"
            />
            <span className={styles.smallNote}>ჩნდება Headline-ის ქვემოთ</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="loc-overlay-title">🏷️ Overlay სათაური</label>
            <input
              id="loc-overlay-title"
              value={draft.overlayTitle}
              onChange={(e) => update("overlayTitle", e.target.value)}
              placeholder="დაჯავშნე ფრენა"
            />
            <span className={styles.smallNote}>
              ჩნდება Hero სექციაში overlay სახით (ფასების თავზე)
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="loc-overlay-desc">📄 Overlay აღწერა</label>
            <textarea
              id="loc-overlay-desc"
              rows={2}
              value={draft.overlayDesc}
              onChange={(e) => update("overlayDesc", e.target.value)}
              placeholder="აირჩიე შენთვის სასურველი პაკეტი"
            />
            <span className={styles.smallNote}>
              დამატებითი ტექსტი overlay-ში
            </span>
          </div>
        </fieldset>

        {/* 2️⃣ Gallery - სურათების გალერეა */}
        <fieldset className={styles.fieldset}>
          <legend>2️⃣ Gallery (სურათების გალერეა - Gallery კომპონენტი)</legend>
          <p className={styles.smallNote}>
            ეს სურათები გამოჩნდება Gallery კომპონენტში (სურათების grid)
          </p>

          <div className={styles.fileInput}>
            <label>🖼️ გალერეის სურათები (multiple)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleGalleryImages(e.target.files)}
            />
            <span className={styles.smallNote}>
              შეგიძლია ერთდროულად რამდენიმე სურათის ატვირთვა
            </span>
          </div>

          {/* არსებული სურათები (EDIT mode) */}
          {draft.existingGalleryUrls.length > 0 && (
            <div className={styles.field}>
              <label>📷 არსებული სურათები</label>
              <div className={styles.imagesRow}>
                {draft.existingGalleryUrls.map((url, i) => (
                  <div key={i} className={styles.imagePreviewWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Gallery ${i + 1}`} />
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => removeExistingGalleryImage(url)}
                      title="წაშლა"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ახალი სურათები (preview) */}
          {draft.galleryImages.length > 0 && (
            <div className={styles.field}>
              <label>✨ ახალი სურათები (preview)</label>
              <div className={styles.imagesRow}>
                {draft.galleryImages.map((file, i) => (
                  <div key={i} className={styles.imagePreviewWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(file)} alt={file.name} />
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => removeGalleryImage(i)}
                      title="წაშლა"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* 3️⃣ Location Info - დეტალური ინფორმაცია */}
        <fieldset className={styles.fieldset}>
          <legend>
            3️⃣ Location Info (დეტალური ინფორმაცია - LocationDetails კომპონენტი)
          </legend>
          <p className={styles.smallNote}>
            ეს სექცია ჩნდება გვერდზე Gallery-ის შემდეგ, შეიცავს დეტალურ აღწერას,
            სექციებს, highlights და tips
          </p>

          <div className={styles.field}>
            <label htmlFor="info-title">📋 Info სათაური</label>
            <input
              id="info-title"
              value={draft.infoCardTitle}
              onChange={(e) => update("infoCardTitle", e.target.value)}
              placeholder="ლოკაციის შესახებ"
            />
            <span className={styles.smallNote}>
              ჩნდება LocationDetails-ის თავში
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="info-intro">📝 Info შესავალი ტექსტი</label>
            <textarea
              id="info-intro"
              rows={3}
              value={draft.infoCardText}
              onChange={(e) => update("infoCardText", e.target.value)}
              placeholder="შესავალი ინფორმაცია ლოკაციის შესახებ..."
            />
            <span className={styles.smallNote}>
              შესავალი აბზაცი LocationDetails სექციაში
            </span>
          </div>

          <div className={styles.subsectionHeader}>
            📚 Sections (დეტალური სექციები)
          </div>
          <div className={styles.stack}>
            {draft.sections.map((s, idx) => (
              <div key={s.id} className={styles.sectionGroup}>
                <div className={styles.sectionTitleRow}>
                  <div className={styles.sectionIndex}>{idx + 1}</div>
                  <input
                    className={styles.grow}
                    placeholder="სექციის სათაური"
                    value={s.heading}
                    onChange={(e) =>
                      updateSection(s.id, "heading", e.target.value)
                    }
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder="სექციის ტექსტი..."
                  value={s.body}
                  onChange={(e) => updateSection(s.id, "body", e.target.value)}
                />
                <div className={styles.fileInput}>
                  <label>📷 სურათები (სექციისთვის)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => addSectionImage(s.id, e.target.files)}
                  />
                  {s.images.length > 0 && (
                    <div className={styles.imagesRow}>
                      {s.images.map((f, i) => (
                        <div key={i} className={styles.imagePreviewWrapper}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(f)} alt={f.name} />
                          <button
                            type="button"
                            className={styles.removeImageBtn}
                            onClick={() => removeSectionImage(s.id, i)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.subsectionHeader}>
            ⭐ Highlights (უპირატესობები)
          </div>
          <p className={styles.smallNote}>
            მაგალითად:
            <br />
            📍 სიმაღლე → 2196 მ
            <br />
            📅 ფრენის სეზონი → აპრილი-ნოემბერი
            <br />
            🚗 მანძილი თბილისიდან → 120 კმ
            <br />
            ⏱️ ფრენის ხანგრძლივობა → 15-50 წუთი
          </p>

          <div className={styles.stack}>
            {draft.highlights.map((h, idx) => (
              <div key={idx} className={styles.highlightRow}>
                <input
                  className={styles.iconInput}
                  placeholder="�"
                  value={h.icon}
                  onChange={(e) => updateHighlight(idx, "icon", e.target.value)}
                  maxLength={2}
                />
                <input
                  className={styles.grow}
                  placeholder="Title (მაგ: სიმაღლე)"
                  value={h.title}
                  onChange={(e) =>
                    updateHighlight(idx, "title", e.target.value)
                  }
                />
                <input
                  className={styles.grow}
                  placeholder="Value (მაგ: 2196 მ)"
                  value={h.value}
                  onChange={(e) =>
                    updateHighlight(idx, "value", e.target.value)
                  }
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeHighlight(idx)}
                  title="წაშლა"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addBtn}
              onClick={addHighlight}
            >
              + Highlight დამატება
            </button>
          </div>

          <div className={styles.subsectionHeader}>💡 Tips (რჩევები)</div>
          <p className={styles.smallNote}>
            მარტივი რჩევები ვიზიტორებისთვის, მაგალითად: &ldquo;დილის საათები
            საუკეთესოა ფრენისთვის&rdquo;
          </p>

          <div className={styles.stack}>
            {draft.tips.map((tip, idx) => (
              <div key={idx} className={styles.tipRow}>
                <input
                  className={styles.grow}
                  placeholder={`რჩევა ${idx + 1}`}
                  value={tip.text}
                  onChange={(e) => updateTip(idx, e.target.value)}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeTip(idx)}
                  title="წაშლა"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={addTip}>
              + Tip დამატება
            </button>
          </div>
        </fieldset>

        {/* 4️⃣ Flight Types - ფრენის პაკეტები */}
        <fieldset className={styles.fieldset}>
          <legend>
            4️⃣ Flight Types (ფრენის პაკეტები - FlyTypes კომპონენტი)
          </legend>
          <p className={styles.smallNote}>
            ეს პაკეტები ჩნდება როგორც Hero Section-ში (overlay-ში ფასები), ასევე
            FlyTypes კომპონენტში
          </p>
          <div className={styles.twoCol}>
            {draft.flights.map((f) => (
              <div key={f.key} className={styles.flightBlock}>
                <div className={styles.flightHeader}>✈️ {f.title}</div>
                <div className={styles.field}>
                  <label>აღწერა</label>
                  <textarea
                    rows={3}
                    value={f.description}
                    onChange={(e) =>
                      updateFlight(f.key, "description", e.target.value)
                    }
                    placeholder="პაკეტის აღწერა..."
                  />
                </div>
                <div className={styles.inlineInputs}>
                  <div className={styles.field}>
                    <label>💰 ფასი (₾)</label>
                    <input
                      type="number"
                      value={f.price}
                      onChange={(e) =>
                        updateFlight(f.key, "price", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Features (checkmarks) */}
                <div className={styles.field}>
                  <label>✓ Features (უპირატესობები)</label>
                  {f.features.map((feature, idx) => (
                    <div key={idx} className={styles.featureRow}>
                      <input
                        className={styles.grow}
                        placeholder="მაგ: გამოცდილი ინსტრუქტორი"
                        value={feature}
                        onChange={(e) =>
                          updateFlightFeature(f.key, idx, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeFlightFeature(f.key, idx)}
                        title="წაშლა"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => addFlightFeature(f.key)}
                  >
                    + დამატება
                  </button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {/* 5️⃣ Card Settings - ბარათის პარამეტრები */}
        <fieldset className={styles.fieldset}>
          <legend>
            5️⃣ Card Settings (ბარათის პარამეტრები - ActiveLocations კომპონენტი)
          </legend>
          <p className={styles.smallNote}>
            ეს პარამეტრები გამოიყენება ActiveLocations-ში (ლოკაციების ბარათები)
          </p>

          <div className={styles.fileInput}>
            <label>🖼️ Card Thumbnail (ბარათის სურათი)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleCardImage(e.target.files?.[0] || null)}
            />
            {draft.cardImage && (
              <span className={styles.smallNote}>
                ✅ {draft.cardImage.name}
              </span>
            )}
            {draft.cardImageUrl && !draft.cardImage && (
              <span className={styles.smallNote}>
                ამჟამინდელი: {draft.cardImageUrl.split("/").pop()}
              </span>
            )}

            {/* Preview */}
            {(draft.cardImage || draft.cardImageUrl) && (
              <div className={styles.imagePreviewWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    draft.cardImage
                      ? URL.createObjectURL(draft.cardImage)
                      : draft.cardImageUrl
                  }
                  alt="Card preview"
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="card-tagline">
              📝 Card Tagline (ბარათის აღწერა)
            </label>
            <textarea
              id="card-tagline"
              rows={2}
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="პარაგლაიდინგი კავკასიონზე"
            />
            <span className={styles.smallNote}>
              ჩნდება ლოკაციის ბარათზე (ActiveLocations)
            </span>
          </div>

          <div className={styles.field}>
            <label>🏷️ Tags (ტეგები)</label>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="thermal, soaring..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                className={styles.btn}
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                დამატება
              </button>
            </div>
            {draft.tags.length > 0 && (
              <div className={styles.chips}>
                {draft.tags.map((t) => (
                  <span key={t} className={styles.chip}>
                    {t}
                    <button type="button" onClick={() => removeTag(t)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.danger}`}
            onClick={backToList}
          >
            გაუქმება
          </button>
          <button
            type="submit"
            className={`${styles.btn} ${styles.primary}`}
            disabled={formSaving}
          >
            {formSaving
              ? "შენახვა..."
              : viewMode === "edit"
              ? "განახლება"
              : "შექმნა"}
          </button>
        </div>
        <div className={styles.status}>{formStatus}</div>
      </form>
    </div>
  );
}
