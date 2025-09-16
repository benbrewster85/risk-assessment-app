"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { AssetCategory, TeamMember } from "@/lib/types";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import { Plus, Edit2, Trash2, Check } from "react-feather";

// Define AbsenceType to match the database schema
type AbsenceType = {
  id: string;
  name: string;
  color: string;
  category: "personnel" | "vehicle" | "equipment";
};

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
  absenceTypes: AbsenceType[];
};

const assetCategoryClasses = ["Primary", "Secondary", "Consumable", "Other"];
const absenceCategories = ["personnel", "vehicle", "equipment"];

// NEW: Predefined Tailwind CSS color palette for selection
const tailwindColorPairs = [
  { name: "Gray", class: "bg-gray-100 text-gray-800" },
  { name: "Red", class: "bg-red-100 text-red-800" },
  { name: "Orange", class: "bg-orange-100 text-orange-800" },
  { name: "Amber", class: "bg-amber-100 text-amber-800" },
  { name: "Yellow", class: "bg-yellow-100 text-yellow-800" },
  { name: "Lime", class: "bg-lime-100 text-lime-800" },
  { name: "Green", class: "bg-green-100 text-green-800" },
  { name: "Emerald", class: "bg-emerald-100 text-emerald-800" },
  { name: "Teal", class: "bg-teal-100 text-teal-800" },
  { name: "Cyan", class: "bg-cyan-100 text-cyan-800" },
  { name: "Sky", class: "bg-sky-100 text-sky-800" },
  { name: "Blue", class: "bg-blue-100 text-blue-800" },
  { name: "Indigo", class: "bg-indigo-100 text-indigo-800" },
  { name: "Violet", class: "bg-violet-100 text-violet-800" },
  { name: "Purple", class: "bg-purple-100 text-purple-800" },
  { name: "Fuchsia", class: "bg-fuchsia-100 text-fuchsia-800" },
  { name: "Pink", class: "bg-pink-100 text-pink-800" },
  { name: "Rose", class: "bg-rose-100 text-rose-800" },
];

export default function LibraryPage({
  hazards: initialHazards,
  risks: initialRisks,
  assetCategories: initialAssetCategories,
  assetStatuses: initialAssetStatuses,
  competencies: initialCompetencies,
  jobRoles: initialJobRoles,
  subTeams: initialSubTeams,
  absenceTypes: initialAbsenceTypes,
  teamMembers,
  teamId,
}: LibraryPageProps) {
  const supabase = createClient();

  // States for each library section
  const [hazards, setHazards] = useState(initialHazards);
  const [risks, setRisks] = useState(initialRisks);
  const [assetCategories, setAssetCategories] = useState(
    initialAssetCategories
  );
  const [assetStatuses, setAssetStatuses] = useState(initialAssetStatuses);
  const [competencies, setCompetencies] = useState(initialCompetencies);
  const [jobRoles, setJobRoles] = useState(initialJobRoles);
  const [subTeams, setSubTeams] = useState(initialSubTeams);
  const [absenceTypes, setAbsenceTypes] = useState(initialAbsenceTypes);

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    | "hazard"
    | "risk"
    | "category"
    | "status"
    | "competency"
    | "job_role"
    | "sub_team"
    | "absence_type"
    | null
  >(null);
  const [editingItem, setEditingItem] = useState<
    LibraryItem | AssetCategory | AbsenceType | null
  >(null);
  const [newItemName, setNewItemName] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  // UPDATED: Default color is now a Tailwind class string
  const [newItemColor, setNewItemColor] = useState(tailwindColorPairs[0].class);
  const [newItemCategory, setNewItemCategory] = useState<
    "personnel" | "vehicle" | "equipment"
  >("personnel");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    setAssetCategories(initialAssetCategories);
  }, [initialAssetCategories]);

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
      case "job_role":
        return "job_roles";
      case "sub_team":
        return "sub_teams";
      case "absence_type":
        return "absence_types";
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
      | "sub_team"
      | "absence_type",
    item: LibraryItem | AssetCategory | AbsenceType | null = null
  ) => {
    setModalType(type);
    setEditingItem(item);
    setNewItemName(item ? item.name : "");

    if (type === "category" && item) {
      setSelectedOwner((item as AssetCategory).owner_id || null);
    } else {
      setSelectedOwner(null);
    }

    // UPDATED: Handle color class state for absence types
    if (type === "absence_type") {
      if (item) {
        const absenceItem = item as AbsenceType;
        setNewItemColor(absenceItem.color || tailwindColorPairs[0].class);
        setNewItemCategory(absenceItem.category || "personnel");
      } else {
        setNewItemColor(tailwindColorPairs[0].class);
        setNewItemCategory("personnel");
      }
    }

    setIsModalOpen(true);
  };

  // --- REFACTORED: handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setIsSubmitting(true);
    const tableName = getTableName(modalType);
    if (!tableName) return;

    let recordData: any = { name: newItemName, team_id: teamId };

    if (modalType === "category") recordData.owner_id = selectedOwner;
    if (modalType === "competency" && !editingItem)
      recordData.category = "certification";
    if (modalType === "absence_type") {
      recordData.color = newItemColor;
      recordData.category = newItemCategory;
    }

    // Determine if we are updating or inserting
    const query = editingItem
      ? supabase.from(tableName).update(recordData).eq("id", editingItem.id)
      : supabase.from(tableName).insert(recordData);

    const { data, error } = await query.select().single();

    if (error) {
      toast.error(
        `Failed to save ${modalType.replace("_", " ")}: ${error.message}`
      );
    } else if (data) {
      toast.success(
        `${modalType.charAt(0).toUpperCase() + modalType.slice(1).replace("_", " ")} ${editingItem ? "updated" : "added"}!`
      );

      // Update state directly instead of reloading the page
      const updateState = (setter: Function, itemData: any) => {
        if (editingItem) {
          setter((currentItems: any[]) =>
            currentItems.map((item) =>
              item.id === itemData.id ? itemData : item
            )
          );
        } else {
          setter((currentItems: any[]) => [...currentItems, itemData]);
        }
      };

      switch (modalType) {
        case "hazard":
          updateState(setHazards, data);
          break;
        case "risk":
          updateState(setRisks, data);
          break;
        case "category":
          // Special handling for category owner data
          const ownerProfile = teamMembers.find((m) => m.id === data.owner_id);
          const enrichedData = {
            ...data,
            owner: ownerProfile
              ? {
                  first_name: ownerProfile.first_name,
                  last_name: ownerProfile.last_name,
                }
              : null,
          };
          updateState(setAssetCategories, enrichedData);
          break;
        case "status":
          updateState(setAssetStatuses, data);
          break;
        case "competency":
          updateState(setCompetencies, data);
          break;
        case "job_role":
          updateState(setJobRoles, data);
          break;
        case "sub_team":
          updateState(setSubTeams, data);
          break;
        case "absence_type":
          updateState(setAbsenceTypes, data);
          break;
      }
    }
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  // --- REFACTORED: handleDelete ---
  const handleDelete = async () => {
    if (!deletingItem) return;
    const tableName = getTableName(deletingItem.type);
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", deletingItem.id);

    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
    } else {
      toast.success(`${deletingItem.type.replace("_", " ")} deleted.`);

      // Update state directly by filtering out the deleted item
      const updateState = (setter: Function) => {
        setter((currentItems: any[]) =>
          currentItems.filter((item) => item.id !== deletingItem.id)
        );
      };

      switch (deletingItem.type) {
        case "hazard":
          updateState(setHazards);
          break;
        case "risk":
          updateState(setRisks);
          break;
        case "category":
          updateState(setAssetCategories);
          break;
        case "status":
          updateState(setAssetStatuses);
          break;
        case "competency":
          updateState(setCompetencies);
          break;
        case "job_role":
          updateState(setJobRoles);
          break;
        case "sub_team":
          updateState(setSubTeams);
          break;
        case "absence_type":
          updateState(setAbsenceTypes);
          break;
      }
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
      // Revert on failure
      setAssetCategories(initialAssetCategories);
    } else {
      toast.success("Category class updated!");
    }
  };

  return (
    <div className="space-y-8">
      {/* --- MODAL --- */}
      <Modal
        title={`${editingItem ? "Edit" : "Add"} ${modalType?.replace("_", " ") || "Item"}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Common) */}
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

          {/* Asset Category Fields */}
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
          {/* UPDATED: Absence Type fields now use a color swatch grid */}
          {modalType === "absence_type" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) =>
                    setNewItemCategory(
                      e.target.value as "personnel" | "vehicle" | "equipment"
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm capitalize"
                >
                  {absenceCategories.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                  {tailwindColorPairs.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewItemColor(color.class)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        color.class.split(" ")[0]
                      } ${
                        newItemColor === color.class
                          ? "ring-2 ring-offset-2 ring-blue-500"
                          : ""
                      }`}
                      aria-label={`Select ${color.name}`}
                    >
                      {newItemColor === color.class && (
                        <Check className="h-5 w-5 text-gray-900" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Form Buttons */}
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
        title={`Delete ${deletingItem?.type.replace("_", " ") || "Item"}`}
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        isDestructive={true}
        confirmText="Delete"
      />

      {/* UPDATED: Absence Types list now uses Tailwind classes for display */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Absence Types</h2>
          <button
            onClick={() => openModal("absence_type")}
            className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Absence Type
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {absenceTypes.map((item) => (
            <li
              key={item.id}
              className="py-3 grid grid-cols-3 gap-4 items-center"
            >
              <div className="flex items-center">
                <span
                  className="h-4 w-4 rounded-full mr-3"
                  style={{ backgroundColor: item.color }}
                ></span>
                <p className="font-medium">{item.name}</p>
              </div>
              <div>
                <p
                  className={`text-sm px-2 py-1 rounded-md inline-block capitalize font-medium ${item.color}`}
                >
                  {item.category}
                </p>
              </div>
              <div className="flex justify-end items-center space-x-2">
                <button
                  onClick={() => openModal("absence_type", item)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    setDeletingItem({ ...item, type: "absence_type" })
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

      {/* --- Existing Sections (Unchanged) --- */}

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
      {/* --- HAZARDS --- */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Hazards</h2>
          <button
            onClick={() => openModal("hazard")}
            className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Hazard
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {hazards.map((item) => (
            <li
              key={item.id}
              className="py-2 flex justify-between items-center"
            >
              <p>{item.name}</p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openModal("hazard", item)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeletingItem({ ...item, type: "hazard" })}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* --- RISKS --- */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Risks</h2>
          <button
            onClick={() => openModal("risk")}
            className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {risks.map((item) => (
            <li
              key={item.id}
              className="py-2 flex justify-between items-center"
            >
              <p>{item.name}</p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openModal("risk", item)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeletingItem({ ...item, type: "risk" })}
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
  );
}
