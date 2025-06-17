"use client";

import { useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddAssetModal from "./AddAssetModal";
import ConfirmModal from "./ConfirmModal";
import Modal from "./Modal";
import { Asset, TeamMember } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { AlertTriangle, CheckCircle, Download } from "react-feather";
import Papa from "papaparse";

type Category = { id: string; name: string };

type AssetListPageProps = {
  initialAssets: Asset[];
  categories: Category[];
  teamMembers: TeamMember[];
  teamId: string | null;
  isCurrentUserAdmin: boolean;
};

const getCalibrationStatus = (asset: Asset) => {
  if (!asset.last_calibrated_date || !asset.calibration_cycle_months) {
    return { text: "N/A", Icon: null, color: "text-gray-500" };
  }
  const lastCalib = new Date(asset.last_calibrated_date);
  const nextDueDate = new Date(
    new Date(lastCalib).setMonth(
      lastCalib.getMonth() + asset.calibration_cycle_months
    )
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (nextDueDate < today) {
    return { text: "Overdue", Icon: AlertTriangle, color: "text-red-600" };
  }
  if (nextDueDate < thirtyDaysFromNow) {
    return { text: "Due Soon", Icon: AlertTriangle, color: "text-amber-600" };
  }
  return { text: "OK", Icon: CheckCircle, color: "text-green-600" };
};

export default function AssetListPage({
  initialAssets,
  categories,
  teamMembers,
  teamId,
  isCurrentUserAdmin,
}: AssetListPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set()
  );
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [bulkAssignCategoryId, setBulkAssignCategoryId] = useState("");

  const handleSuccess = (resultAsset: Asset) => {
    if (editingAsset) {
      setAssets(
        assets.map((asset) =>
          asset.id === resultAsset.id ? resultAsset : asset
        )
      );
    } else {
      setAssets((currentAssets) => [resultAsset, ...currentAssets]);
    }
    setEditingAsset(null);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAsset) return;
    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", deletingAsset.id);
    if (error) {
      toast.error(`Failed to delete asset: ${error.message}`);
    } else {
      toast.success("Asset deleted.");
      setAssets(assets.filter((asset) => asset.id !== deletingAsset.id));
    }
    setDeletingAsset(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadToast = toast.loading("Parsing CSV file...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!results.data || results.data.length === 0) {
          toast.error("CSV file is empty or invalid.", { id: uploadToast });
          setIsUploading(false);
          return;
        }
        toast.loading(`Processing ${results.data.length} records...`, {
          id: uploadToast,
        });
        const response = await fetch("/api/assets/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assets: results.data, teamId: teamId }),
        });
        const result = await response.json();
        if (!response.ok) {
          toast.error(`Import failed: ${result.error}`, { id: uploadToast });
        } else {
          toast.success("Import complete! Refreshing list...", {
            id: uploadToast,
          });
          router.refresh();
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsUploading(false);
      },
      error: (parseError: Error) => {
        toast.error(`Error parsing file: ${parseError.message}`, {
          id: uploadToast,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsUploading(false);
      },
    });
  };

  const filteredAssets = useMemo(() => {
    let items = [...assets];
    if (categoryFilter) {
      items = items.filter((asset) => asset.category_id === categoryFilter);
    }
    if (statusFilter) {
      items = items.filter((asset) => asset.status === statusFilter);
    }
    if (assigneeFilter) {
      if (assigneeFilter === "unassigned") {
        items = items.filter(
          (asset) => !asset.current_assignee_id && !asset.parent_asset_id
        );
      } else {
        const directlyAssignedAssetIds = new Set(
          assets
            .filter((a) => a.current_assignee_id === assigneeFilter)
            .map((a) => a.id)
        );
        items = items.filter(
          (asset) =>
            asset.current_assignee_id === assigneeFilter ||
            (asset.parent_asset_id &&
              directlyAssignedAssetIds.has(asset.parent_asset_id))
        );
      }
    }
    return items;
  }, [assets, categoryFilter, statusFilter, assigneeFilter]);

  const handleSelectOne = (assetId: string) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedAssetIds(new Set(filteredAssets.map((a) => a.id)));
    } else {
      setSelectedAssetIds(new Set());
    }
  };

  const handleBulkAssignCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.size === 0) {
      toast.error("No assets selected.");
      return;
    }
    if (!bulkAssignCategoryId) {
      toast.error("Please select a category to assign.");
      return;
    }
    const { error } = await supabase
      .from("assets")
      .update({ category_id: bulkAssignCategoryId })
      .in("id", Array.from(selectedAssetIds));

    if (error) {
      toast.error(`Failed to update assets: ${error.message}`);
    } else {
      toast.success(`${selectedAssetIds.size} assets have been updated.`);
      setSelectedAssetIds(new Set());
      setIsBulkAssignModalOpen(false);
      router.refresh();
    }
  };

  const isAllSelected =
    selectedAssetIds.size > 0 &&
    selectedAssetIds.size === filteredAssets.length;
  const assetStatuses = [
    "In Stores",
    "On Site",
    "In Repair",
    "Missing",
    "Sold",
  ];

  return (
    <>
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        teamId={teamId}
        categories={categories}
        assetToEdit={editingAsset}
      />
      <ConfirmModal
        isOpen={deletingAsset !== null}
        onClose={() => setDeletingAsset(null)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete the asset "${deletingAsset?.system_id} - ${deletingAsset?.model}"?`}
        confirmText="Delete"
        isDestructive={true}
      />
      <Modal
        title="Bulk Assign Category"
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
      >
        <form onSubmit={handleBulkAssignCategory} className="space-y-4">
          <p>
            You have selected <strong>{selectedAssetIds.size}</strong> asset(s).
            Choose a category to assign to all of them.
          </p>
          <div>
            <label htmlFor="bulkCategory" className="block text-sm font-medium">
              Category
            </label>
            <select
              id="bulkCategory"
              value={bulkAssignCategoryId}
              onChange={(e) => setBulkAssignCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="" disabled>
                Select a category...
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsBulkAssignModalOpen(false)}
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Apply Category
            </button>
          </div>
        </form>
      </Modal>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Asset Management</h1>
            {isCurrentUserAdmin && (
              <div className="flex space-x-2">
                <a
                  href="/api/assets/export"
                  download
                  className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Inventory
                </a>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
                >
                  {isUploading ? "Processing..." : "Import from CSV"}
                </button>
                <button
                  onClick={openCreateModal}
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  + Add New Asset
                </button>
              </div>
            )}
          </div>
          {selectedAssetIds.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-800">
                {selectedAssetIds.size} asset(s) selected.
              </p>
              <div>
                <button
                  onClick={() => setIsBulkAssignModalOpen(true)}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
                >
                  Assign Category...
                </button>
              </div>
            </div>
          )}
          <div className="mb-4 p-4 bg-white rounded-lg shadow border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <h3 className="text-lg font-semibold col-span-1 md:col-span-4">
                Filter Inventory
              </h3>
              <div>
                <label
                  htmlFor="categoryFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="statusFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">All Statuses</option>
                  {assetStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="assigneeFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Assigned To
                </label>
                <select
                  id="assigneeFilter"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">All Users</option>
                  <option value="unassigned">(In Stores)</option>
                  {teamMembers.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >{`${member.first_name} ${member.last_name}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      disabled={filteredAssets.length === 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calibration
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => {
                  const directAssignee =
                    `${asset.assignee_first_name || ""} ${asset.assignee_last_name || ""}`.trim();
                  const parentAssignee =
                    `${asset.parent_assignee_first_name || ""} ${asset.parent_assignee_last_name || ""}`.trim();
                  const assigneeName = directAssignee || parentAssignee;
                  const calib = getCalibrationStatus(asset);
                  return (
                    <tr
                      key={asset.id}
                      className={
                        selectedAssetIds.has(asset.id) ? "bg-blue-50" : ""
                      }
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedAssetIds.has(asset.id)}
                          onChange={() => handleSelectOne(asset.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/assets/${asset.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {asset.system_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {asset.manufacturer} {asset.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          S/N: {asset.serial_number || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {assigneeName || "In Stores"}
                        {parentAssignee && !directAssignee && (
                          <span className="text-xs text-gray-400 block">
                            (Inherited)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`flex items-center text-sm ${calib.color}`}
                        >
                          {calib.Icon && (
                            <calib.Icon className="h-4 w-4 mr-1.5" />
                          )}{" "}
                          {calib.text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isCurrentUserAdmin && (
                          <div className="flex items-center justify-end space-x-4">
                            <button
                              onClick={() => openEditModal(asset)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingAsset(asset)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-8">
                      No assets match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
