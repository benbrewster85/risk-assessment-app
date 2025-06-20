"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Asset, TeamMember, AssetIssue } from "@/lib/types";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Link2,
  XCircle,
  FileText,
  Tool,
} from "react-feather";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import LogAssetIssueModal from "./LogAssetIssueModal";
import LogMaintenanceModal from "./LogMaintenanceModal";
import ResolveIssueModal from "./ResolveIssueModal";
import StorageImage from "./StorageImage";

type ChildAsset = { id: string; system_id: string; model: string | null };
type Status = { id: string; name: string };

type AssetDetailPageProps = {
  initialAsset: Asset;
  teamMembers: TeamMember[];
  childAssets: ChildAsset[];
  availableAssets: ChildAsset[];
  assetStatuses: Status[];
  isCurrentUserAdmin: boolean;
  initialIssues: AssetIssue[];
  currentUserId: string;
};

export default function AssetDetailPage({
  initialAsset,
  teamMembers,
  childAssets,
  availableAssets,
  assetStatuses,
  isCurrentUserAdmin,
  initialIssues,
  currentUserId,
}: AssetDetailPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [asset, setAsset] = useState(initialAsset);
  const [issues, setIssues] = useState(initialIssues);
  const [selectedAssignee, setSelectedAssignee] = useState(
    asset.current_assignee_id || ""
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [isAssociating, setIsAssociating] = useState(false);
  const [isLogIssueModalOpen, setIsLogIssueModalOpen] = useState(false);
  const [isLogMaintenanceModalOpen, setIsLogMaintenanceModalOpen] =
    useState(false);
  const [resolvingIssue, setResolvingIssue] = useState<AssetIssue | null>(null);

  // This effect ensures the component's state stays in sync with new data after a refresh
  useEffect(() => {
    setAsset(initialAsset);
    setIssues(initialIssues);
  }, [initialAsset, initialIssues]);

  const handleAssign = async () => {
    setIsAssigning(true);
    const { error } = await supabase.rpc("assign_asset_with_children", {
      p_asset_id: asset.id,
      p_new_assignee_id: selectedAssignee || null,
      p_team_id: asset.team_id,
    });
    if (error) {
      toast.error(`Failed to assign asset: ${error.message}`);
    } else {
      toast.success("Asset successfully assigned!");
      router.refresh();
    }
    setIsAssigning(false);
  };

  const handleAssociateChild = async () => {
    if (!selectedChildId) {
      toast.error("Please select an asset to associate.");
      return;
    }
    setIsAssociating(true);
    const { error } = await supabase.rpc("associate_child_asset", {
      p_parent_id: asset.id,
      p_child_id: selectedChildId,
    });
    if (error) {
      toast.error(`Failed to associate asset: ${error.message}`);
    } else {
      toast.success("Asset associated successfully!");
      router.refresh();
    }
    setIsAssociating(false);
  };

  const handleDisassociate = async () => {
    if (
      !window.confirm(
        "Are you sure? This will return the item to stores and unassign it."
      )
    )
      return;
    const { error } = await supabase.rpc("disassociate_child_asset", {
      p_child_id: asset.id,
    });
    if (error) {
      toast.error(`Failed to disassociate: ${error.message}`);
    } else {
      toast.success("Asset disassociated and returned to stores.");
      router.refresh();
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    const { error } = await supabase
      .from("assets")
      .update({ status_id: newStatusId })
      .eq("id", asset.id);
    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
    } else {
      toast.success("Status updated!");
      router.refresh();
    }
  };

  const handleLogSuccess = (newLog: AssetIssue) => {
    // We just refresh the page to get all new data, including the new log
    // This is simpler and avoids the loop.
    router.refresh();
  };

  const handleIssueResolved = (updatedIssue: AssetIssue) => {
    setIssues(
      issues.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue
      )
    );
  };

  const currentAssigneeName =
    `${asset.assignee_first_name || ""} ${asset.assignee_last_name || ""}`.trim();
  const unassignedAssetStatuses = assetStatuses.filter(
    (s) => s.name !== "On Site" && s.name !== "In Use"
  );

  let nextDueDate: Date | null = null;
  let statusText = "N/A";
  let statusColor = "text-gray-500";
  let StatusIcon = Calendar;
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
      statusText = "Overdue";
      statusColor = "text-red-600";
      StatusIcon = AlertTriangle;
    } else if (nextDueDate < thirtyDaysFromNow) {
      statusText = "Due Soon";
      statusColor = "text-amber-600";
      StatusIcon = AlertTriangle;
    } else {
      statusText = "OK";
      statusColor = "text-green-600";
      StatusIcon = CheckCircle;
    }
  }

  if (!asset) {
    return <p className="p-8">Loading asset details...</p>;
  }

  return (
    <>
      <LogAssetIssueModal
        isOpen={isLogIssueModalOpen}
        onClose={() => setIsLogIssueModalOpen(false)}
        onSuccess={handleLogSuccess}
        asset={asset}
        userId={currentUserId}
      />
      <LogMaintenanceModal
        isOpen={isLogMaintenanceModalOpen}
        onClose={() => setIsLogMaintenanceModalOpen(false)}
        onSuccess={handleLogSuccess}
        asset={asset}
        userId={currentUserId}
      />
      <ResolveIssueModal
        isOpen={resolvingIssue !== null}
        onClose={() => setResolvingIssue(null)}
        onSuccess={handleIssueResolved}
        issue={resolvingIssue}
      />

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

          {asset.parent_asset_id && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
              <div className="flex items-center">
                <Link2 className="h-5 w-5 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    This item is an accessory for:
                  </p>
                  <Link
                    href={`/dashboard/assets/${asset.parent_asset_id}`}
                    className="text-sm text-blue-600 hover:underline font-semibold"
                  >
                    View Parent Asset
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
                    {asset.category_name || "Uncategorized"}
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
                  <div className="flex items-center">
                    <span className="font-semibold w-32 inline-block">
                      Current Status:
                    </span>
                    {isCurrentUserAdmin && !asset.current_assignee_id ? (
                      <select
                        value={asset.status_id || ""}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm"
                      >
                        {assetStatuses.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1">
                        <StatusBadge status={asset.status} />
                      </div>
                    )}
                  </div>
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
            {childAssets.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {childAssets.map((child) => (
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
                  Only items that are "In Stores" and not part of another kit
                  can be associated.
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

          <div className="mt-8 bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Issue & Maintenance Log</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsLogMaintenanceModalOpen(true)}
                  className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700"
                >
                  + Log Maintenance
                </button>
                <button
                  onClick={() => setIsLogIssueModalOpen(true)}
                  className="bg-orange-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-orange-700"
                >
                  + Log Issue
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {issues.length > 0 ? (
                issues.map((issue) => {
                  const reporterName =
                    `${issue.reporter?.first_name || ""} ${issue.reporter?.last_name || ""}`.trim() ||
                    "System";
                  const resolverName =
                    `${issue.resolver?.first_name || ""} ${issue.resolver?.last_name || ""}`.trim();
                  return (
                    <div
                      key={issue.id}
                      className="border-t pt-4 first:pt-0 first:border-t-0"
                    >
                      <div className="flex justify-between items-start text-sm">
                        <div>
                          <p className="font-semibold">
                            {issue.log_type} logged by {reporterName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(issue.created_at).toLocaleString("en-GB")}
                          </p>
                        </div>
                        {issue.log_type === "Issue" && (
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${issue.status === "Open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                          >
                            {issue.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">
                        {issue.log_notes}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {issue.photos.map((p) => {
                          const isPdf = p.file_path
                            .toLowerCase()
                            .endsWith(".pdf");
                          return (
                            <a
                              key={p.id}
                              href={p.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <StorageImage
                                filePath={p.file_path}
                                bucket="asset-issue-photos"
                                alt="Issue attachment"
                                className="h-24 w-24 object-cover rounded-md border hover:opacity-80"
                              />
                            </a>
                          );
                        })}
                      </div>
                      {issue.status === "Resolved" &&
                        issue.resolution_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                            <p className="text-xs font-semibold text-green-800">
                              Resolution by {resolverName} on{" "}
                              {new Date(issue.resolved_at!).toLocaleDateString(
                                "en-GB"
                              )}
                              :
                            </p>
                            <p className="text-sm text-green-900 whitespace-pre-wrap">
                              {issue.resolution_notes}
                            </p>
                          </div>
                        )}
                      {isCurrentUserAdmin &&
                        issue.status === "Open" &&
                        issue.log_type === "Issue" && (
                          <div className="mt-3 text-right">
                            <button
                              onClick={() => setResolvingIssue(issue)}
                              className="flex items-center text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md ml-auto"
                            >
                              <Tool className="h-3 w-3 mr-1" />
                              Resolve Issue
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No issues or maintenance have been logged for this asset.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
