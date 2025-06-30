"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { v4 as uuidv4 } from "uuid";
import type { Vehicle, VehicleEvent } from "@/lib/types";

type LogVehicleServiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: VehicleEvent) => void;
  vehicle: Vehicle;
  userId: string;
};

export default function LogVehicleServiceModal({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
  userId,
}: LogVehicleServiceModalProps) {
  const supabase = createClient();
  const [logType, setLogType] = useState("Service");
  const [logNotes, setLogNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (isOpen) {
      setLogType("Service");
      setLogNotes("");
      setAttachments([]);
      setEventDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNotes) {
      toast.error("Please provide some notes for the log.");
      return;
    }
    if (!eventDate) {
      toast.error("Please provide a date for the event.");
      return;
    }

    setIsSubmitting(true);
    try {
      // UPDATED: 'status' is no longer set here, it will default to NULL in the DB for these log types
      const { data: eventData, error: eventError } = await supabase
        .from("vehicle_events")
        .insert({
          vehicle_id: vehicle.id,
          team_id: vehicle.team_id,
          reported_by_id: userId,
          log_notes: logNotes,
          log_type: logType,
          event_date: eventDate,
        })
        .select("id")
        .single();

      if (eventError) throw eventError;

      if (attachments.length > 0) {
        const uploadPromises = attachments.map((file) => {
          const fileExt = file.name.split(".").pop();
          const filePath = `${vehicle.team_id}/${eventData.id}/${uuidv4()}.${fileExt}`;
          return supabase.storage
            .from("vehicle-event-attachments")
            .upload(filePath, file);
        });
        const uploadResults = await Promise.all(uploadPromises);
        const attachmentRecords = uploadResults.map((result) => {
          if (result.error) throw result.error;
          if (!result.data?.path)
            throw new Error("File upload did not return a path.");
          return { event_id: eventData.id, file_path: result.data.path };
        });
        if (attachmentRecords.length > 0) {
          const { error: attachmentError } = await supabase
            .from("vehicle_event_attachments")
            .insert(attachmentRecords);
          if (attachmentError) throw attachmentError;
        }
      }

      const { data: finalEvent, error: finalError } = await supabase
        .from("vehicle_events")
        .select(
          "*, reporter:reported_by_id(first_name, last_name), resolver:resolved_by_id(first_name, last_name), attachments:vehicle_event_attachments(*)"
        )
        .eq("id", eventData.id)
        .single();
      if (finalError) throw finalError;

      toast.success("Log added successfully!");
      onSuccess(finalEvent as VehicleEvent);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to log event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Log Maintenance for ${vehicle.registration_number}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="logType" className="block text-sm font-medium">
            Log Type
          </label>
          <select
            id="logType"
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="mt-1 block w-full"
          >
            <option>Service</option>
            <option>MOT</option>
            <option>Repair</option>
          </select>
        </div>
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium">
            {logType === "MOT" ? "MOT Test Date" : `${logType} Date`}
          </label>
          <input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <label htmlFor="logNotes" className="block text-sm font-medium">
            Notes / Details
          </label>
          <textarea
            id="logNotes"
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            rows={5}
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium">
            Upload Certificate/Files (Optional)
          </label>
          <input
            id="attachments"
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf"
            className="mt-1 block w-full text-sm"
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
            {isSubmitting ? "Submitting..." : "Add Log Entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
