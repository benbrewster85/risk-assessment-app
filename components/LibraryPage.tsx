"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { AssetCategory, TeamMember } from "@/lib/types";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import { Plus, Edit2, Trash2 } from "react-feather";

type LibraryItem = {
  id: string;
  name: string;
  is_system_status?: boolean;
};

type LibraryPageProps = {
  hazards: LibraryItem[];
  risks: LibraryItem[];
  assetCategories: AssetCategory[];
  assetStatuses: LibraryItem[];
  competencies: LibraryItem[];
  teamMembers: TeamMember[];
  teamId: string;
  jobRoles: LibraryItem[];
  subTeams: LibraryItem[];
};

const assetCategoryClasses = ["Primary", "Secondary", "Consumable", "Other"];

export default function LibraryPage({
  hazards: initialHazards,
  risks: initialRisks,
  assetCategories: initialAssetCategories,
  assetStatuses: initialAssetStatuses,
  competencies: initialCompetencies,
  jobRoles: initialJobRoles, // ADDED
  subTeams: initialSubTeams, // ADDED
  teamMembers,
  teamId,
}: LibraryPageProps) {
  const supabase = createClient();

  // 2. ADD STATE: Create state for competencies
  const [hazards, setHazards] = useState(initialHazards);
  const [risks, setRisks] = useState(initialRisks);
  const [assetCategories, setAssetCategories] = useState(
    initialAssetCategories
  );
  const [assetStatuses, setAssetStatuses] = useState(initialAssetStatuses);
  const [competencies, setCompetencies] = useState(initialCompetencies);
  const [jobRoles, setJobRoles] = useState(initialJobRoles); // ADDED
  const [subTeams, setSubTeams] = useState(initialSubTeams); // ADDED

  const [isModalOpen, setIsModalOpen] = useState(false);
  // 3. UPDATE TYPES: Add 'competency' as a possible modal type
  const [modalType, setModalType] = useState<
    | "hazard"
    | "risk"
    | "category"
    | "status"
    | "competency"
    | "job_role"
    | "sub_team"
    | null
  >(null);
  const [editingItem, setEditingItem] = useState<
    LibraryItem | AssetCategory | null
  >(null);
  const [newItemName, setNewItemName] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    setAssetCategories(initialAssetCategories);
  }, [initialAssetCategories]);

  // 4. UPDATE HELPER: Add cases for the new tables
  const getTableName = (type: string | null) => {
    switch (type) {
      case "hazard":
        return "hazards";
      case "risk":
        return "risks";
      case "category":
        return "asset_categories";
      case "status":
        return "asset_statuses";
      case "competency":
        return "competencies";
      case "job_role": // ADDED
        return "job_roles";
      case "sub_team": // ADDED
        return "sub_teams";
      default:
        return "";
    }
  };

  const openModal = (
    type:
      | "hazard"
      | "risk"
      | "category"
      | "status"
      | "competency"
      | "job_role"
      | "sub_team", // MODIFIED
    item: LibraryItem | AssetCategory | null = null
  ) => {
    setModalType(type);
    setEditingItem(item);
    setNewItemName(item ? item.name : "");
    if (type === "category" && item) {
      setSelectedOwner((item as AssetCategory).owner_id || null);
    } else {
      setSelectedOwner(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setIsSubmitting(true);
    const tableName = getTableName(modalType);
    if (!tableName) return;

    let recordData: any = { name: newItemName, team_id: teamId };
    if (modalType === "category") {
      recordData.owner_id = selectedOwner;
    }
    // ADDED: Set the category for a new competency
    if (modalType === "competency" && !editingItem) {
      recordData.category = "certification";
    }

    const { data, error } = editingItem
      ? await supabase
          .from(tableName)
          .update(recordData)
          .eq("id", editingItem.id)
          .select()
          .single()
      : await supabase.from(tableName).insert(recordData).select().single();

    if (error) {
      toast.error(
        `Failed to save ${modalType.replace("_", " ")}: ${error.message}`
      );
    } else if (data) {
      toast.success(
        `${modalType.charAt(0).toUpperCase() + modalType.slice(1).replace("_", " ")} ${editingItem ? "updated" : "added"}!`
      );
      window.location.reload();
    }
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingItem || !deletingItem.type) return;
    const tableName = getTableName(deletingItem.type);
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", deletingItem.id);

    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
    } else {
      toast.success(`${deletingItem.type.replace("_", " ")} deleted.`);
      window.location.reload();
    }
    setDeletingItem(null);
  };

  const handleCategoryClassChange = async (
    categoryId: string,
    newClass: string
  ) => {
    setAssetCategories((current) =>
      current.map((cat) =>
        cat.id === categoryId ? { ...cat, asset_category_class: newClass } : cat
      )
    );
    const { error } = await supabase
      .from("asset_categories")
      .update({ asset_category_class: newClass })
      .eq("id", categoryId);
    if (error) {
      toast.error("Failed to update category class.");
      setAssetCategories(initialAssetCategories);
    } else {
      toast.success("Category class updated!");
    }
  };

  return (
    <div className="space-y-8">
      <Modal
        title={`${editingItem ? "Edit" : "Add"} ${modalType || "Item"}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          {modalType === "category" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Owner
              </label>
              <select
                value={selectedOwner || ""}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">(No specific owner)</option>
                {teamMembers.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >{`${member.first_name} ${member.last_name}`}</option>
                ))}
              </select>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-2 py-2 px-4 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={`Delete ${deletingItem?.type || "Item"}`}
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        isDestructive={true}
        confirmText="Delete"
      />

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Asset Categories</h2>
          <button
            onClick={() => openModal("category")}
            className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {assetCategories.map((category) => (
            <li
              key={category.id}
              className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-gray-500">
                  Owner:{" "}
                  {category.owner
                    ? `${category.owner.first_name} ${category.owner.last_name}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <select
                  value={category.asset_category_class || ""}
                  onChange={(e) =>
                    handleCategoryClassChange(category.id, e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                >
                  <option value="">Select a class...</option>
                  {assetCategoryClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end items-center space-x-2">
                <button
                  onClick={() => openModal("category", category)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    setDeletingItem({ ...category, type: "category" })
                  }
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. ADD UI: New sections for Job Roles, Sub-Teams, etc. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* --- JOB ROLES --- */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Job Roles</h2>
            <button
              onClick={() => openModal("job_role")}
              className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {jobRoles.map((item) => (
              <li
                key={item.id}
                className="py-2 flex justify-between items-center"
              >
                <p>{item.name}</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal("job_role", item)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setDeletingItem({ ...item, type: "job_role" })
                    }
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* --- SUB-TEAMS --- */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Sub-Teams</h2>
            <button
              onClick={() => openModal("sub_team")}
              className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {subTeams.map((item) => (
              <li
                key={item.id}
                className="py-2 flex justify-between items-center"
              >
                <p>{item.name}</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal("sub_team", item)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setDeletingItem({ ...item, type: "sub_team" })
                    }
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Competencies</h2>
          <button
            onClick={() => openModal("competency")}
            className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {competencies.map((item) => (
            <li
              key={item.id}
              className="py-2 flex justify-between items-center"
            >
              <p>{item.name}</p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openModal("competency", item)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    setDeletingItem({ ...item, type: "competency" })
                  }
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Asset Statuses</h2>
          <button
            onClick={() => openModal("status")}
            className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Status
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {assetStatuses.map((item) => (
            <li
              key={item.id}
              className="py-2 flex justify-between items-center"
            >
              <p>
                {item.name}{" "}
                {item.is_system_status && (
                  <span className="text-xs text-gray-500">(System)</span>
                )}
              </p>
              {!item.is_system_status && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal("status", item)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingItem({ ...item, type: "status" })}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
