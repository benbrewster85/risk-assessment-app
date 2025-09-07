"use a client";

import { useEffect, useRef } from "react";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type LocationSearchInputProps = {
  initialValue?: string;
  onLocationSelect: (location: {
    address: string;
    longitude: number;
    latitude: number;
  }) => void;
  disabled?: boolean;
};

export default function LocationSearchInput({
  onLocationSelect,
  initialValue,
  disabled = false,
}: LocationSearchInputProps) {
  const geocoderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (geocoderContainerRef.current) {
      const geocoder = new MapboxGeocoder({
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
        types: "country,region,place,postcode,locality,neighborhood,address",
        marker: false, // We don't need a map marker here
      });

      geocoder.addTo(geocoderContainerRef.current);

      // Set the initial value if provided
      if (initialValue) {
        geocoder.setInput(initialValue);
      }

      // Listen for the 'result' event
      geocoder.on(
        "result",
        (e: { result: { place_name: string; center: [number, number] } }) => {
          const { result } = e;
          onLocationSelect({
            address: result.place_name,
            longitude: result.center[0],
            latitude: result.center[1],
          });
        }
      );

      // Listen for the 'clear' event
      geocoder.on("clear", () => {
        onLocationSelect({ address: "", longitude: 0, latitude: 0 });
      });

      return () => {
        // Cleanup on component unmount
        const container = geocoderContainerRef.current;
        if (container && container.firstChild) {
          container.removeChild(container.firstChild);
        }
      };
    }
  }, []); // Run this effect only once

  return (
    <div
      ref={geocoderContainerRef}
      className={disabled ? "pointer-events-none opacity-50" : ""}
    />
  );
}
