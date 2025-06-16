"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import { TeamMember } from "@/lib/types";

type LibraryItem = {
  id: string;
  name: string;
  owner_id?: string | null;
  owner?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type LibraryManagerProps = {
  itemType: string;
  itemTypePlural: string;
  tableName: "hazards" | "risks" | "asset_categories";
  initialItems: LibraryItem[];
  teamId: string | null;
  teamMembers?: TeamMember[];
  showOwner?: boolean;
};

export default function LibraryManager({
  itemType,
  itemTypePlural,
  tableName,
  initialItems,
  teamId,
  teamMembers = [],
  showOwner = false,
}: LibraryManagerProps) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>("");
  const [deletingItem, setDeletingItem] = useState<LibraryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = editingItem !== null;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const openModal = (item: LibraryItem | null) => {
    setEditingItem(item);
    setItemName(item ? item.name : "");
    setOwnerId(item && item.owner_id ? item.owner_id : "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) {
      toast.error(`${itemType} name cannot be empty.`);
      return;
    }
    setIsSubmitting(true);

    const itemData: {
      name: string;
      team_id: string | null;
      owner_id?: string | null;
    } = {
      name: itemName,
      team_id: teamId,
    };
    if (showOwner) {
      itemData.owner_id = ownerId || null;
    }

    const { data, error } = isEditing
      ? await supabase
          .from(tableName)
          .update(itemData)
          .eq("id", editingItem!.id)
          .select("*, owner:profiles(first_name, last_name)")
          .single()
      : await supabase
          .from(tableName)
          .insert(itemData)
          .select("*, owner:profiles(first_name, last_name)")
          .single();

    if (error) {
      toast.error(`Failed to save ${itemType.toLowerCase()}: ${error.message}`);
    } else if (data) {
      const transformedData = {
        ...data,
        owner: Array.isArray(data.owner) ? data.owner[0] : data.owner,
      };
      toast.success(
        `${itemType} ${isEditing ? "updated" : "added"} successfully!`
      );
      if (isEditing) {
        setItems(
          items.map((item) =>
            item.id === transformedData.id ? transformedData : item
          )
        );
      } else {
        setItems([...items, transformedData]);
      }
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleArchive = async () => {
    if (!deletingItem) return;
    const { error } = await supabase
      .from(tableName)
      .update({ is_archived: true })
      .eq("id", deletingItem.id);
    if (error) {
      if (error.code === "23503") {
        toast.error(
          `Cannot archive "${deletingItem.name}" because it is in use.`
        );
      } else {
        toast.error(
          `Failed to archive ${itemType.toLowerCase()}: ${error.message}`
        );
      }
    } else {
      toast.success(`${itemType} archived.`);
      setItems(items.filter((item) => item.id !== deletingItem.id));
    }
    setDeletingItem(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <ConfirmModal
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleArchive}
        title={`Archive ${itemType}`}
        message={`Are you sure you want to archive "${deletingItem?.name}"? It will be hidden from dropdown lists but will remain in old risk assessments for historical accuracy.`}
        confirmText="Archive"
        isDestructive={true}
      />
      <Modal
        title={`${isEditing ? "Edit" : "Add"} ${itemType}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="itemName"
              className="block text-sm font-medium text-gray-700"
            >
              {itemType} Name
            </label>
            <input
              id="itemName"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          {showOwner && (
            <div>
              <label
                htmlFor="ownerId"
                className="block text-sm font-medium text-gray-700"
              >
                Owner
              </label>
              <select
                id="ownerId"
                value={ownerId || ""}
                onChange={(e) => setOwnerId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">(Unassigned)</option>
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
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : `Add ${itemType}`}
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{itemTypePlural}</h3>
        <button
          onClick={() => openModal(null)}
          className="bg-blue-600 text-white font-bold py-1 px-3 text-sm rounded-lg hover:bg-blue-700"
        >
          + Add New
        </button>
      </div>

      <ul className="divide-y divide-gray-200">
        {items.map((item) => {
          const ownerName = item.owner
            ? `${item.owner.first_name || ""} ${item.owner.last_name || ""}`.trim()
            : "Unassigned";
          return (
            <li
              key={item.id}
              className="py-3 flex justify-between items-center"
            >
              <div>
                <span className="font-medium">{item.name}</span>
                {showOwner && (
                  <p className="text-xs text-gray-500">Owner: {ownerName}</p>
                )}
              </div>
              <div className="space-x-4">
                <button
                  onClick={() => openModal(item)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingItem(item)}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Archive
                </button>
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="py-3 text-center text-gray-500">
            No active {itemTypePlural.toLowerCase()} in your library yet.
          </li>
        )}
      </ul>
    </div>
  );
}
