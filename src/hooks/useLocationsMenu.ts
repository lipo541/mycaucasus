/**
 * Hook for fetching dynamic locations menu items
 * Used by NavBar to populate locations dropdown from database
 */

import type { LocationListItem } from "@/types/api";
import { useEffect, useState } from "react";

interface LocationMenuItem {
  id: string;
  href: string;
  headline: string;
}

export function useLocationsMenu(lang: string = "ka") {
  const [locations, setLocations] = useState<LocationMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/locations?lang=${lang}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled && data.locations) {
          const menuItems = data.locations.map((loc: LocationListItem) => ({
            id: loc.id,
            href: loc.href,
            headline: loc.headline,
          }));

          setLocations(menuItems);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching locations menu:", err);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLocations();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return { locations, loading, error };
}
