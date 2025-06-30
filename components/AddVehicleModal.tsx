"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { Vehicle } from "@/lib/types";

type AddVehicleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehicle: Vehicle) => void;
  teamId: string | null;
};

export default function AddVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
}: AddVehicleModalProps) {
  const supabase = createClient();
  const [registration, setRegistration] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [lastServiced, setLastServiced] = useState("");
  const [serviceCycle, setServiceCycle] = useState(12);
  const [motDueDate, setMotDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when the modal opens
  useEffect(() => {
    if (isOpen) {
      setRegistration("");
      setManufacturer("");
      setModel("");
      setLastServiced("");
      setServiceCycle(12);
      setMotDueDate("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration || !teamId) {
      toast.error("Registration Number and Team ID are required.");
      return;
    }
    setIsSubmitting(true);

    const vehicleData = {
      registration_number: registration.toUpperCase().replace(/\s/g, ""),
      manufacturer: manufacturer || null,
      model: model || null,
      team_id: teamId,
      last_serviced_date: lastServiced || null,
      service_cycle_months: serviceCycle,
      mot_due_date: motDueDate || null,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .insert(vehicleData)
      .select()
      .single();

    if (error) {
      toast.error(`Failed to add vehicle: ${error.message}`);
    } else if (data) {
      toast.success("Vehicle added successfully!");
      onSuccess(data as Vehicle);
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal title="Add New Vehicle" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="registration" className="block text-sm font-medium">
              Registration Number
            </label>
            <input
              type="text"
              id="registration"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div></div> {/* Empty div for layout spacing */}
          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium">
              Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="mt-1 block w-full"
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
              className="mt-1 block w-full"
            />
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lastServiced" className="block text-sm font-medium">
              Last Service Date
            </label>
            <input
              type="date"
              id="lastServiced"
              value={lastServiced}
              onChange={(e) => setLastServiced(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="serviceCycle" className="block text-sm font-medium">
              Service Cycle (Months)
            </label>
            <input
              type="number"
              id="serviceCycle"
              value={serviceCycle}
              onChange={(e) => setServiceCycle(Number(e.target.value))}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="motDueDate" className="block text-sm font-medium">
              MOT Due Date
            </label>
            <input
              type="date"
              id="motDueDate"
              value={motDueDate}
              onChange={(e) => setMotDueDate(e.target.value)}
              className="mt-1 block w-full"
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
            {isSubmitting ? "Saving..." : "Add Vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
