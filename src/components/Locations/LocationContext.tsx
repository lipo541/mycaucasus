"use client";
import type { Location } from "@/config/locations";
import React, { createContext, useContext } from "react";

export type LocationContextType = {
  /** Current location data from database */
  location: Location;
  /** Language code (ka, en, ru, etc.) */
  language: string;
};

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({
  value,
  children,
}: {
  value: LocationContextType;
  children: React.ReactNode;
}) {
  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}
