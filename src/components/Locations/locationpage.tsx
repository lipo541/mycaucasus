"use client";

import ActiveLocations from "@/components/Locations/ActiveLocations/ActiveLocations";
import FlyTypes from "@/components/Locations/flytypes/FlyTypes";
import Gallery from "@/components/Locations/gallery/Gallery";
import LocationDetails from "@/components/Locations/LocationDetails/LocationDetails";
import LocationsHero from "@/components/Locations/locationshero/locationshero";
import PilotCards from "@/components/Locations/PilotCards/PilotCards";

export default function LocationPage() {
  return (
    <>
      <LocationsHero />
      <Gallery />
      <LocationDetails />
      <FlyTypes />
      <ActiveLocations />
      <PilotCards />
    </>
  );
}
