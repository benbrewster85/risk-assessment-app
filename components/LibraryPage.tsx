"use client";

import { useState } from "react";
import LibraryManager from "./LibraryManager";
import { TeamMember, AssetCategory } from "@/lib/types";

type LibraryItem = { id: string; name: string };

type LibraryPageProps = {
  hazards: LibraryItem[];
  risks: LibraryItem[];
  assetCategories: AssetCategory[];
  teamMembers: TeamMember[];
  teamId: string | null;
};

export default function LibraryPage({
  hazards,
  risks,
  assetCategories,
  teamMembers,
  teamId,
}: LibraryPageProps) {
  const [activeAssetType, setActiveAssetType] = useState<
    "hazards" | "risks" | "categories"
  >("hazards");

  return (
    <div>
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveAssetType("hazards")}
          className={`py-2 px-4 text-sm font-medium ${activeAssetType === "hazards" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Hazards
        </button>
        <button
          onClick={() => setActiveAssetType("risks")}
          className={`py-2 px-4 text-sm font-medium ${activeAssetType === "risks" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Risks
        </button>
        {/* NEW: Button for Asset Categories */}
        <button
          onClick={() => setActiveAssetType("categories")}
          className={`py-2 px-4 text-sm font-medium ${activeAssetType === "categories" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Asset Categories
        </button>
      </div>
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
        {/* NEW: Render the manager for Asset Categories */}
        {activeAssetType === "categories" && (
          <LibraryManager
            itemType="Asset Category"
            itemTypePlural="Asset Categories"
            tableName="asset_categories"
            initialItems={assetCategories}
            teamId={teamId}
            teamMembers={teamMembers} // Pass team members for the owner dropdown
            showOwner={true} // Tell the manager to show the owner UI
          />
        )}
      </div>
    </div>
  );
}
