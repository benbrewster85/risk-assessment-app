"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";

type LibraryItem = {
  id: string;
  name: string;
};

type LibraryManagerProps = {
  itemType: string;
  itemTypePlural: string;
  tableName: "hazards" | "risks";
  initialItems: LibraryItem[];
  teamId: string | null;
};

export default function LibraryManager({
  itemType,
  itemTypePlural,
  tableName,
  initialItems,
  teamId,
}: LibraryManagerProps) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [archivingItem, setArchivingItem] = useState<LibraryItem | null>(null); // Renamed for clarity
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = editingItem !== null;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const openModal = (item: LibraryItem | null) => {
    setEditingItem(item);
    setItemName(item ? item.name : "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) {
      toast.error(`${itemType} name cannot be empty.`);
      return;
    }
    setIsSubmitting(true);
    let result;
    if (isEditing) {
      result = await supabase
        .from(tableName)
        .update({ name: itemName })
        .eq("id", editingItem!.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from(tableName)
        .insert({ name: itemName, team_id: teamId })
        .select()
        .single();
    }
    const { data, error } = result;
    if (error) {
      toast.error(`Failed to save ${itemType.toLowerCase()}: ${error.message}`);
    } else if (data) {
      toast.success(
        `${itemType} ${isEditing ? "updated" : "added"} successfully!`
      );
      if (isEditing) {
        setItems(items.map((item) => (item.id === data.id ? data : item)));
      } else {
        setItems([...items, data]);
      }
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  // UPDATED: This function now Archives instead of Deleting
  const handleArchive = async () => {
    if (!archivingItem) return;

    // Instead of .delete(), we now use .update() to set the is_archived flag
    const { error } = await supabase
      .from(tableName)
      .update({ is_archived: true })
      .eq("id", archivingItem.id);

    if (error) {
      toast.error(
        `Failed to archive ${itemType.toLowerCase()}: ${error.message}`
      );
    } else {
      toast.success(`${itemType} archived successfully.`);
      // The UI updates by filtering the item out of the active list
      setItems(items.filter((item) => item.id !== archivingItem.id));
    }
    setArchivingItem(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* UPDATED: The confirmation modal now uses archiving language */}
      <ConfirmModal
        isOpen={archivingItem !== null}
        onClose={() => setArchivingItem(null)}
        onConfirm={handleArchive}
        title={`Archive ${itemType}`}
        message={`Are you sure you want to archive "${archivingItem?.name}"? It will be hidden from dropdown lists but will remain in old risk assessments for historical accuracy.`}
        confirmText="Archive"
        isDestructive={true}
      />
      <Modal
        title={`${isEditing ? "Edit" : "Add"} ${itemType}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSave}>
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
        {items.map((item) => (
          <li key={item.id} className="py-3 flex justify-between items-center">
            <span className="font-medium">{item.name}</span>
            <div className="space-x-4">
              <button
                onClick={() => openModal(item)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
              {/* UPDATED: This button is now for archiving */}
              <button
                onClick={() => setArchivingItem(item)}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Archive
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-3 text-center text-gray-500">
            No active {itemTypePlural.toLowerCase()} in your library yet.
          </li>
        )}
      </ul>
    </div>
  );
}
