import LocationPage from "@/components/Locations/locationpage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locations | mycaucasus",
};

export default function LocationsRoute() {
  return <LocationPage />;
}
