"use client";

import { useState, useEffect } from "react";
import { Map, Marker, Overlay } from "pigeon-maps";
import { ProjectListItem } from "@/lib/types";
import Link from "next/link";
import { MapPin } from "react-feather";

type ProjectMapProps = {
  projects: ProjectListItem[];
};

type ViewportState = {
  center: [number, number];
  zoom: number;
};

export default function ProjectMap({ projects }: ProjectMapProps) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectListItem | null>(null);

  const [viewport, setViewport] = useState<ViewportState>({
    center: [54.5, -2.2],
    zoom: 6,
  });

  // This effect recalculates the viewport when the projects prop changes
  useEffect(() => {
    console.log("🗺️ ProjectMap: Processing projects:", projects.length);

    // Helper function to calculate center and zoom from bounds
    const getViewportForBounds = (bounds: [number, number, number, number]) => {
      const [minLng, minLat, maxLng, maxLat] = bounds;

      // Calculate center point
      const center: [number, number] = [
        (minLat + maxLat) / 2,
        (minLng + maxLng) / 2,
      ];

      // Calculate the diagonal distance of the bounds in degrees
      const lngDiff = maxLng - minLng;
      const latDiff = maxLat - minLat;
      const diagonal = Math.sqrt(Math.pow(lngDiff, 2) + Math.pow(latDiff, 2));

      // Estimate zoom level based on the diagonal distance
      // This is a simple approximation but works well for most cases.
      // A larger diagonal (more spread out) results in a lower zoom.
      const zoom = Math.floor(9.5 - Math.log2(diagonal));

      return {
        center,
        zoom: Math.max(1, Math.min(18, zoom)), // Clamp zoom between 1 and 18
      };
    };

    const projectsWithCoords = projects.filter(
      (p) =>
        p.latitude != null &&
        p.longitude != null &&
        !isNaN(p.latitude as number) &&
        !isNaN(p.longitude as number)
    );

    if (projectsWithCoords.length === 0) {
      setViewport({ center: [54.5, -2.2], zoom: 6 });
      return;
    }

    if (projectsWithCoords.length === 1) {
      const [project] = projectsWithCoords;
      setViewport({
        center: [project.latitude as number, project.longitude as number],
        zoom: 12,
      });
      return;
    }

    const latitudes = projectsWithCoords.map((p) => p.latitude as number);
    const longitudes = projectsWithCoords.map((p) => p.longitude as number);

    const bounds: [number, number, number, number] = [
      Math.min(...longitudes),
      Math.min(...latitudes),
      Math.max(...longitudes),
      Math.max(...latitudes),
    ];

    if (bounds.some((val) => isNaN(val) || !isFinite(val))) {
      setViewport({ center: [54.5, -2.2], zoom: 6 });
      return;
    }

    const latRange = bounds[3] - bounds[1];
    const lngRange = bounds[2] - bounds[0];

    if (latRange < 0.001 && lngRange < 0.001) {
      setViewport({ center: [bounds[1], bounds[0]], zoom: 12 });
      return;
    }

    // Calculate and set the final viewport using our new helper
    const finalViewport = getViewportForBounds(bounds);
    console.log("🗺️ ProjectMap: Setting final viewport:", finalViewport);
    setViewport(finalViewport);
  }, [projects]);

  const mapboxProvider = (x: number, y: number, z: number) => {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/${z}/${x}/${y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;
  };

  return (
    <div className="w-full h-[70vh] rounded-lg overflow-hidden shadow-lg border">
      <Map
        provider={mapboxProvider}
        center={viewport.center}
        zoom={viewport.zoom}
        onBoundsChanged={({ center, zoom }) => setViewport({ center, zoom })}
      >
        {projects
          .filter(
            (p) =>
              p.latitude &&
              p.longitude &&
              !isNaN(p.latitude as number) &&
              !isNaN(p.longitude as number)
          )
          .map((project) => (
            <Marker
              key={project.id}
              width={40}
              anchor={[project.latitude as number, project.longitude as number]}
              // Add this offset prop. It will shift the icon left by 16px and up by 32px.
              offset={[0, -15]}
              onClick={() => setSelectedProject(project)}
              style={{ cursor: "pointer" }}
            >
              <MapPin
                // The translate classes have been removed from here
                className="text-blue-600 h-8 w-8 transform-gpu transition-transform hover:scale-110"
                fill="rgba(6,78,239,0.4)"
                strokeWidth={1.5}
              />
            </Marker>
          ))}

        {selectedProject && (
          <Overlay
            anchor={[
              selectedProject.latitude as number,
              selectedProject.longitude as number,
            ]}
            offset={[120, 40]}
          >
            <div className="bg-white rounded-lg shadow-xl p-3 min-w-[200px] relative">
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-0 right-1 text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
                aria-label="Close popup"
              >
                &times;
              </button>
              <h3 className="font-bold text-md mb-1">{selectedProject.name}</h3>
              <p className="text-xs text-gray-600">
                {selectedProject.reference}
              </p>
              <Link
                href={`/dashboard/project/${selectedProject.id}`}
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                View Project →
              </Link>
            </div>
          </Overlay>
        )}
      </Map>
    </div>
  );
}
