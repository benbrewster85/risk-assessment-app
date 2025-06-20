"use client";

import { useState } from "react";
import LibraryManager from "./LibraryManager";
import { TeamMember, AssetCategory } from "@/lib/types";

type LibraryItem = {
  id: string;
  name: string;
  is_system_status?: boolean;
  owner_id?: string | null;
  owner?: { first_name: string | null; last_name: string | null } | null;
};

type LibraryPageProps = {
  hazards: LibraryItem[];
  risks: LibraryItem[];
  assetCategories: AssetCategory[];
  assetStatuses: LibraryItem[];
  teamMembers: TeamMember[];
  teamId: string | null;
};

export default function LibraryPage({
  hazards,
  risks,
  assetCategories,
  assetStatuses,
  teamMembers,
  teamId,
}: LibraryPageProps) {
  const [activeAssetType, setActiveAssetType] = useState<
    "hazards" | "risks" | "categories" | "statuses"
  >("hazards");

  const buttonClass = (type: string) =>
    `whitespace-nowrap py-2 px-4 text-sm font-medium rounded-t-lg ${activeAssetType === type ? "bg-white border-gray-200 border-l border-t border-r" : "bg-gray-50 hover:bg-gray-100"}`;

  return (
    <div>
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveAssetType("hazards")}
          className={buttonClass("hazards")}
        >
          Hazards
        </button>
        <button
          onClick={() => setActiveAssetType("risks")}
          className={buttonClass("risks")}
        >
          Risks
        </button>
        <button
          onClick={() => setActiveAssetType("categories")}
          className={buttonClass("categories")}
        >
          Asset Categories
        </button>
        <button
          onClick={() => setActiveAssetType("statuses")}
          className={buttonClass("statuses")}
        >
          Asset Statuses
        </button>
      </div>
      <div className="-mt-px">
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
        {activeAssetType === "categories" && (
          <LibraryManager
            itemType="Asset Category"
            itemTypePlural="Asset Categories"
            tableName="asset_categories"
            initialItems={assetCategories}
            teamId={teamId}
            teamMembers={teamMembers}
            showOwner={true}
          />
        )}
        {activeAssetType === "statuses" && (
          <LibraryManager
            itemType="Status"
            itemTypePlural="Asset Statuses"
            tableName="asset_statuses"
            initialItems={assetStatuses}
            teamId={teamId}
          />
        )}
      </div>
    </div>
  );
}
