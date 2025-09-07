"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ProjectListItem } from "@/lib/types";
import Link from "next/link";
import { useEffect } from "react";

// --- Fix for default icon issue with webpack ---
// This ensures the marker icons appear correctly.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});
// ----------------------------------------------

type ProjectMapProps = {
  projects: ProjectListItem[];
};

// This helper component will automatically fit the map bounds to the markers
function FitBoundsToMarkers({ projects }: ProjectMapProps) {
  const map = useMap();

  useEffect(() => {
    const projectsWithCoords = projects.filter(
      (p) => p.latitude != null && p.longitude != null
    );

    if (projectsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        projectsWithCoords.map((p) => [
          p.latitude as number,
          p.longitude as number,
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [projects, map]);

  return null;
}

export default function ProjectMap({ projects }: ProjectMapProps) {
  const projectsWithCoords = projects.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  return (
    <MapContainer
      center={[54.5, -2.2]} // Initial center, will be adjusted by FitBoundsToMarkers
      zoom={6} // Initial zoom
      scrollWheelZoom={true}
      className="w-full h-[70vh] rounded-lg shadow-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {projectsWithCoords.map((project) => (
        <Marker
          key={project.id}
          position={[project.latitude as number, project.longitude as number]}
        >
          <Popup>
            <h3 className="font-bold text-md mb-1">{project.name}</h3>
            <p className="text-xs text-gray-600 m-0">{project.reference}</p>
            <Link
              href={`/dashboard/project/${project.id}`}
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              View Project →
            </Link>
          </Popup>
        </Marker>
      ))}

      <FitBoundsToMarkers projects={projectsWithCoords} />
    </MapContainer>
  );
}
