"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Asset, TeamMember } from "@/lib/types";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Link2,
  XCircle,
} from "react-feather";
import { useRouter } from "next/navigation";

type ChildAsset = { id: string; system_id: string; model: string | null };

type AssetDetailPageProps = {
  initialAsset: Asset;
  teamMembers: TeamMember[];
  childAssets: ChildAsset[];
  availableAssets: ChildAsset[];
  isCurrentUserAdmin: boolean;
};

export default function AssetDetailPage({
  initialAsset,
  teamMembers,
  childAssets,
  availableAssets,
  isCurrentUserAdmin,
}: AssetDetailPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [asset, setAsset] = useState(initialAsset);
  const [children, setChildren] = useState(childAssets);
  const [selectedAssignee, setSelectedAssignee] = useState(
    asset.current_assignee_id || ""
  );
  const [isAssigning, setIsAssigning] = useState(false);

  const [selectedChildId, setSelectedChildId] = useState("");
  const [isAssociating, setIsAssociating] = useState(false);

  const handleAssign = async () => {
    setIsAssigning(true);
    const newAssigneeId = selectedAssignee || null;

    const { error } = await supabase.rpc("assign_asset_with_children", {
      p_asset_id: asset.id,
      p_new_assignee_id: newAssigneeId,
      p_team_id: asset.team_id,
    });

    if (error) {
      toast.error(`Failed to assign asset: ${error.message}`);
    } else {
      toast.success("Asset and its accessories successfully assigned!");
      router.refresh(); // Refresh server props to get all updated data
    }
    setIsAssigning(false);
  };

  const handleAssociateChild = async () => {
    if (!selectedChildId) {
      toast.error("Please select an asset to associate.");
      return;
    }
    setIsAssociating(true);

    const { data, error } = await supabase
      .from("assets")
      .update({ parent_asset_id: asset.id })
      .eq("id", selectedChildId)
      .select("id, system_id, model")
      .single();

    if (error) {
      toast.error(`Failed to associate asset: ${error.message}`);
    } else if (data) {
      toast.success("Asset associated successfully!");
      router.refresh(); // Easiest way to update both child and available lists
    }
    setIsAssociating(false);
  };

  const handleDisassociate = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disassociate this item from its parent kit? It will be returned to stores and unassigned."
      )
    )
      return;

    const { error } = await supabase
      .from("assets")
      .update({
        parent_asset_id: null,
        current_assignee_id: null,
        status: "In Stores",
      })
      .eq("id", asset.id);

    if (error) {
      toast.error(`Failed to disassociate: ${error.message}`);
    } else {
      toast.success("Asset disassociated and returned to stores.");
      router.refresh();
    }
  };

  const currentAssigneeName =
    `${asset.assignee?.first_name || ""} ${asset.assignee?.last_name || ""}`.trim();

  // --- Calibration Logic ---
  let nextDueDate: Date | null = null;
  let calibStatus: "ok" | "due" | "overdue" | "n/a" = "n/a";
  let statusColor = "text-gray-500";
  let StatusIcon = Calendar;
  let statusText = "N/A";

  if (asset.last_calibrated_date && asset.calibration_cycle_months) {
    const lastCalib = new Date(asset.last_calibrated_date);
    nextDueDate = new Date(
      new Date(lastCalib).setMonth(
        lastCalib.getMonth() + asset.calibration_cycle_months
      )
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (nextDueDate < today) {
      calibStatus = "overdue";
      statusText = "Overdue";
      statusColor = "text-red-600";
      StatusIcon = AlertTriangle;
    } else if (nextDueDate < thirtyDaysFromNow) {
      calibStatus = "due";
      statusText = "Due Soon";
      statusColor = "text-amber-600";
      StatusIcon = AlertTriangle;
    } else {
      calibStatus = "ok";
      statusText = "OK";
      statusColor = "text-green-600";
      StatusIcon = CheckCircle;
    }
  }

  if (!asset) {
    return <p className="p-8">Loading asset details...</p>;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-sm">
          <Link
            href="/dashboard/assets"
            className="text-blue-600 hover:underline"
          >
            Asset Management
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          <span className="text-gray-700">{asset.system_id}</span>
        </div>

        {asset.parent && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <Link2 className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Associated with Parent Kit
                </p>
                <Link
                  href={`/dashboard/assets/${asset.parent.id}`}
                  className="text-sm text-blue-600 hover:underline font-semibold"
                >
                  {asset.parent.system_id}
                </Link>
              </div>
            </div>
            {isCurrentUserAdmin && (
              <button
                onClick={handleDisassociate}
                className="flex items-center text-xs font-medium text-gray-500 hover:text-red-600"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Disassociate
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {asset.manufacturer} {asset.model}
                </h1>
                <p className="text-lg text-gray-500">
                  {asset.category?.name || "Uncategorized"}
                </p>
              </div>
              <div className="pt-4 space-y-2 text-sm">
                <p>
                  <span className="font-semibold w-32 inline-block">
                    System ID:
                  </span>{" "}
                  {asset.system_id}
                </p>
                <p>
                  <span className="font-semibold w-32 inline-block">
                    Serial Number:
                  </span>{" "}
                  {asset.serial_number || "N/A"}
                </p>
                <p>
                  <span className="font-semibold w-32 inline-block">
                    Current Status:
                  </span>{" "}
                  {asset.status}
                </p>
                <p>
                  <span className="font-semibold w-32 inline-block">
                    Added On:
                  </span>{" "}
                  {new Date(asset.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="md:col-span-1 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium">Currently Assigned To</p>
                <p className="text-xl font-bold mt-1">
                  {currentAssigneeName || "In Stores"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium">Calibration Status</p>
                <div
                  className={`mt-1 flex items-center font-bold text-xl ${statusColor}`}
                >
                  <StatusIcon className="h-5 w-5 mr-2" />
                  <span>{statusText}</span>
                </div>
                {nextDueDate && (
                  <p className="text-xs mt-1">
                    Next due:{" "}
                    {nextDueDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
                {asset.last_calibrated_date && (
                  <p className="text-xs mt-1">
                    Last done:{" "}
                    {new Date(asset.last_calibrated_date).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" }
                    )}
                  </p>
                )}
              </div>
              {isCurrentUserAdmin && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <label htmlFor="assignee" className="text-sm font-medium">
                    Re-assign To
                  </label>
                  <div className="flex items-center space-x-2 mt-2">
                    <select
                      id="assignee"
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      <option value="">(Back to Stores)</option>
                      {teamMembers.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >{`${member.first_name} ${member.last_name}`}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={isAssigning}
                      className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex-shrink-0"
                    >
                      {isAssigning ? "..." : "Assign"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">
            Associated Kit / Accessories
          </h2>
          {children.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {children.map((child) => (
                <li
                  key={child.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-blue-600">
                      <Link
                        href={`/dashboard/assets/${child.id}`}
                        className="hover:underline"
                      >
                        {child.system_id}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500">{child.model}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              No accessories are associated with this item.
            </p>
          )}

          {isCurrentUserAdmin && (
            <div className="mt-6 border-t pt-6">
              <label htmlFor="associate" className="text-sm font-medium">
                Associate Existing Item
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Only items that are "In Stores" and not part of another kit can
                be associated.
              </p>
              <div className="flex items-center space-x-2">
                <select
                  id="associate"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Select an asset to associate...</option>
                  {availableAssets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.system_id} ({item.model || "No model"})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssociateChild}
                  disabled={isAssociating}
                  className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 flex-shrink-0 disabled:bg-gray-400"
                >
                  {isAssociating ? "..." : "Associate"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
