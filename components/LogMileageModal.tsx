"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { v4 as uuidv4 } from "uuid";
import type { Vehicle, VehicleMileageLog } from "@/lib/types";

type LogMileageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: Vehicle[];
  teamId: string | null;
  userId: string;
};

export default function LogMileageModal({
  isOpen,
  onClose,
  onSuccess,
  vehicles,
  teamId,
  userId,
}: LogMileageModalProps) {
  const supabase = createClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [journeyDate, setJourneyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startMileage, setStartMileage] = useState("");
  const [endMileage, setEndMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This effect runs when the modal is first opened
  useEffect(() => {
    if (isOpen && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    } else {
      setSelectedVehicleId("");
    }
  }, [isOpen, vehicles]);

  // NEW: This effect runs whenever the selected vehicle changes
  useEffect(() => {
    const fetchLastMileage = async () => {
      if (!selectedVehicleId) {
        setStartMileage("");
        return;
      }

      // Find the most recent log entry for this vehicle that has an end_mileage
      const { data, error } = await supabase
        .from("vehicle_mileage_logs")
        .select("end_mileage")
        .eq("vehicle_id", selectedVehicleId)
        .not("end_mileage", "is", null)
        .order("journey_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.end_mileage) {
        setStartMileage(String(data.end_mileage));
      } else {
        setStartMileage(""); // No previous mileage found
      }
    };

    fetchLastMileage();
  }, [selectedVehicleId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !startMileage) {
      toast.error("Please select a vehicle and enter a starting mileage.");
      return;
    }
    if (endMileage && Number(endMileage) < Number(startMileage)) {
      toast.error("End mileage cannot be less than start mileage.");
      return;
    }
    setIsSubmitting(true);

    const logData = {
      vehicle_id: selectedVehicleId,
      team_id: teamId,
      user_id: userId,
      journey_date: journeyDate,
      start_mileage: Number(startMileage),
      end_mileage: endMileage ? Number(endMileage) : null,
      notes: notes || null,
    };

    const { error } = await supabase
      .from("vehicle_mileage_logs")
      .insert(logData);

    if (error) {
      toast.error(`Failed to log mileage: ${error.message}`);
    } else {
      toast.success("Mileage log saved successfully!");
      onSuccess();
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal title="Log New Journey" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="vehicle" className="block text-sm font-medium">
            Vehicle
          </label>
          <select
            id="vehicle"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            required
            className="mt-1 block w-full"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration_number} - {v.manufacturer} {v.model}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="journeyDate" className="block text-sm font-medium">
            Journey Date
          </label>
          <input
            type="date"
            id="journeyDate"
            value={journeyDate}
            onChange={(e) => setJourneyDate(e.target.value)}
            required
            className="mt-1 block w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startMileage" className="block text-sm font-medium">
              Start Mileage
            </label>
            <input
              type="number"
              id="startMileage"
              value={startMileage}
              onChange={(e) => setStartMileage(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="endMileage" className="block text-sm font-medium">
              End Mileage
            </label>
            <input
              type="number"
              id="endMileage"
              value={endMileage}
              onChange={(e) => setEndMileage(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full"
          />
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
            {isSubmitting ? "Saving..." : "Log Journey"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
