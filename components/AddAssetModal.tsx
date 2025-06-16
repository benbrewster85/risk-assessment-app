"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { Asset } from "@/lib/types";

type Category = { id: string; name: string };

type AddAssetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resultAsset: Asset) => void;
  teamId: string | null;
  categories: Category[];
  assetToEdit: Asset | null;
};

export default function AddAssetModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  categories,
  assetToEdit,
}: AddAssetModalProps) {
  const supabase = createClient();
  const [systemId, setSystemId] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: State for calibration fields
  const [lastCalibrated, setLastCalibrated] = useState("");
  const [calibCycle, setCalibCycle] = useState<number | "">("");

  const isEditing = assetToEdit !== null;

  useEffect(() => {
    if (assetToEdit) {
      setSystemId(assetToEdit.system_id);
      setManufacturer(assetToEdit.manufacturer || "");
      setModel(assetToEdit.model || "");
      setSerialNumber(assetToEdit.serial_number || "");
      setCategoryId(assetToEdit.category_id || "");
      setLastCalibrated(assetToEdit.last_calibrated_date || "");
      setCalibCycle(assetToEdit.calibration_cycle_months || "");
    } else {
      // Reset form for new entry
      setSystemId("");
      setManufacturer("");
      setModel("");
      setSerialNumber("");
      setCategoryId("");
      setLastCalibrated("");
      setCalibCycle("");
    }
  }, [assetToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemId || !teamId) {
      toast.error("System ID and Team ID are required.");
      return;
    }
    setIsSubmitting(true);

    const assetData = {
      system_id: systemId,
      manufacturer,
      model,
      serial_number: serialNumber,
      category_id: categoryId || null,
      team_id: teamId,
      last_calibrated_date: lastCalibrated || null,
      calibration_cycle_months: calibCycle === "" ? null : Number(calibCycle),
    };

    const { data, error } = isEditing
      ? await supabase
          .from("assets")
          .update(assetData)
          .eq("id", assetToEdit!.id)
          .select(
            "*, category:asset_categories(name), assignee:profiles(first_name, last_name)"
          )
          .single()
      : await supabase
          .from("assets")
          .insert(assetData)
          .select(
            "*, category:asset_categories(name), assignee:profiles(first_name, last_name)"
          )
          .single();

    if (error) {
      toast.error(`Failed to save asset: ${error.message}`);
    } else if (data) {
      toast.success(`Asset ${isEditing ? "updated" : "added"} successfully!`);
      onSuccess(data as Asset);
      onClose();
    }
    setIsSubmitting(false);
  };

  const calibrationCycles = [
    { label: "1 Month", value: 1 },
    { label: "3 Months", value: 3 },
    { label: "6 Months", value: 6 },
    { label: "1 Year", value: 12 },
    { label: "2 Years", value: 24 },
    { label: "3 Years", value: 36 },
  ];

  return (
    <Modal
      title={isEditing ? "Edit Asset" : "Add New Asset"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="systemId" className="block text-sm font-medium">
              System ID
            </label>
            <input
              type="text"
              id="systemId"
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">(No Category)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium">
              Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium">
              Model
            </label>
            <input
              type="text"
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="serialNumber" className="block text-sm font-medium">
            Serial Number
          </label>
          <input
            type="text"
            id="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="lastCalibrated"
              className="block text-sm font-medium"
            >
              Last Calibrated Date
            </label>
            <input
              type="date"
              id="lastCalibrated"
              value={lastCalibrated}
              onChange={(e) => setLastCalibrated(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="calibCycle" className="block text-sm font-medium">
              Calibration Cycle
            </label>
            <select
              id="calibCycle"
              value={calibCycle}
              onChange={(e) =>
                setCalibCycle(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">(Not Required)</option>
              {calibrationCycles.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
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
                : "Add Asset"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
