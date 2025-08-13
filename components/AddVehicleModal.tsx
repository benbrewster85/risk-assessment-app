"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { Vehicle } from "@/lib/types";

type AddVehicleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicle: Vehicle) => void;
  teamId: string | null;
  vehicleToEdit: Vehicle | null;
};

export default function AddVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  vehicleToEdit,
}: AddVehicleModalProps) {
  const supabase = createClient();
  const [registration, setRegistration] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [lastServiced, setLastServiced] = useState("");
  const [serviceCycle, setServiceCycle] = useState(12);
  const [motDueDate, setMotDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = vehicleToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && vehicleToEdit) {
        setRegistration(vehicleToEdit.registration_number);
        setManufacturer(vehicleToEdit.manufacturer || "");
        setModel(vehicleToEdit.model || "");
        setLastServiced(vehicleToEdit.last_serviced_date || "");
        setServiceCycle(vehicleToEdit.service_cycle_months || 12);
        setMotDueDate(vehicleToEdit.mot_due_date || "");
      } else {
        setRegistration("");
        setManufacturer("");
        setModel("");
        setLastServiced("");
        setServiceCycle(12);
        setMotDueDate("");
      }
    }
  }, [isOpen, vehicleToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) {
      toast.error("Registration Number is required.");
      return;
    }
    setIsSubmitting(true);

    // This data object no longer includes `owner_id`
    const vehicleData = {
      registration_number: registration.toUpperCase().replace(/\s/g, ""),
      manufacturer: manufacturer || null,
      model: model || null,
      last_serviced_date: lastServiced || null,
      service_cycle_months: serviceCycle,
      mot_due_date: motDueDate || null,
    };

    const { data, error } = isEditing
      ? await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", vehicleToEdit!.id)
          .select()
          .single()
      : await supabase
          .from("vehicles")
          .insert({ ...vehicleData, team_id: teamId })
          .select()
          .single();

    if (error) {
      toast.error(`Failed to save vehicle: ${error.message}`);
    } else if (data) {
      toast.success(`Vehicle ${isEditing ? "updated" : "added"} successfully!`);
      onSuccess(data as Vehicle);
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={
        isEditing
          ? `Edit ${vehicleToEdit?.registration_number}`
          : "Add New Vehicle"
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="registration">Registration Number</label>
            <input
              id="registration"
              type="text"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              required
            />
          </div>
          <div></div> {/* This empty div keeps the layout consistent */}
          <div>
            <label htmlFor="manufacturer">Manufacturer</label>
            <input
              id="manufacturer"
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="model">Model</label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </div>
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lastServiced">Last Service Date</label>
            <input
              type="date"
              id="lastServiced"
              value={lastServiced}
              onChange={(e) => setLastServiced(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="serviceCycle">Service Cycle (Months)</label>
            <input
              type="number"
              id="serviceCycle"
              value={serviceCycle}
              onChange={(e) => setServiceCycle(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label htmlFor="motDueDate">MOT Due Date</label>
            <input
              type="date"
              id="motDueDate"
              value={motDueDate}
              onChange={(e) => setMotDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 py-2 px-4 border rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isEditing ? "Save Changes" : "Add Vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
