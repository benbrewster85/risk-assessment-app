"use client";

import { useState } from "react";
import LibraryManager from "./LibraryManager";

type LibraryItem = {
  id: string;
  name: string;
};

type LibraryPageProps = {
  hazards: LibraryItem[];
  risks: LibraryItem[];
  teamId: string | null;
};

export default function LibraryPage({
  hazards,
  risks,
  teamId,
}: LibraryPageProps) {
  const [activeAssetType, setActiveAssetType] = useState<"hazards" | "risks">(
    "hazards"
  );

  return (
    <div>
      {/* Sub-navigation for the library */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveAssetType("hazards")}
          className={`py-2 px-4 text-sm font-medium ${activeAssetType === "hazards" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Hazards
        </button>
        <button
          onClick={() => setActiveAssetType("risks")}
          className={`py-2 px-4 text-sm font-medium ${activeAssetType === "risks" ? "border-b-2 border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Risks
        </button>
        {/* We can add more buttons here in the future for other asset types */}
      </div>

      {/* Conditionally render the correct manager */}
      <div>
        {activeAssetType === "hazards" && (
          <LibraryManager
            itemType="Hazard"
            itemTypePlural="Hazards"
            tableName="hazards"
            initialItems={hazards}
            teamId={teamId}
          />
        )}
        {activeAssetType === "risks" && (
          <LibraryManager
            itemType="Risk"
            itemTypePlural="Risks"
            tableName="risks"
            initialItems={risks}
            teamId={teamId}
          />
        )}
      </div>
    </div>
  );
}
