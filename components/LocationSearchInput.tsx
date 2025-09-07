"use client";

import { useEffect, useRef } from "react";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type LocationSearchInputProps = {
  accessToken: string;
  initialValue?: string;
  onLocationSelect: (location: {
    address: string;
    longitude: number;
    latitude: number;
  }) => void;
  disabled?: boolean;
};

export default function LocationSearchInput({
  accessToken, // ✅ 2. Accept the new prop here
  onLocationSelect,
  initialValue,
  disabled = false,
}: LocationSearchInputProps) {
  const geocoderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure both the container and the token are available
    if (geocoderContainerRef.current && accessToken) {
      const geocoder = new MapboxGeocoder({
        accessToken: accessToken, // ✅ 3. Use the prop here instead of process.env
        types: "country,region,place,postcode,locality,neighborhood,address",
        marker: false,
      });

      geocoder.addTo(geocoderContainerRef.current);

      if (initialValue) {
        geocoder.setInput(initialValue);
      }

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

      geocoder.on("clear", () => {
        onLocationSelect({ address: "", longitude: 0, latitude: 0 });
      });

      return () => {
        const container = geocoderContainerRef.current;
        if (container && container.firstChild) {
          container.removeChild(container.firstChild);
        }
      };
    }
  }, [accessToken]); // ✅ 4. Re-run if accessToken changes

  return (
    <div
      ref={geocoderContainerRef}
      className={disabled ? "pointer-events-none opacity-50" : ""}
    />
  );
}
