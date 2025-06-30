"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { v4 as uuidv4 } from "uuid";
import type { Vehicle, VehicleEvent } from "@/lib/types";

type LogVehicleIssueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: VehicleEvent) => void;
  vehicle: Vehicle;
  userId: string;
};

export default function LogVehicleIssueModal({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
  userId,
}: LogVehicleIssueModalProps) {
  const supabase = createClient();
  const [logNotes, setLogNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLogNotes("");
      setAttachments([]);
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
      toast.error("Please provide details about the issue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("vehicle_events")
        .insert({
          vehicle_id: vehicle.id,
          team_id: vehicle.team_id,
          reported_by_id: userId,
          log_notes: logNotes,
          log_type: "Issue",
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
          "*, reporter:reported_by_id(first_name, last_name), attachments:vehicle_event_attachments(*)"
        )
        .eq("id", eventData.id)
        .single();
      if (finalError) throw finalError;

      toast.success("Issue logged successfully!");
      onSuccess(finalEvent as VehicleEvent);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to log issue: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Log Issue for ${vehicle.registration_number}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="logNotes" className="block text-sm font-medium">
            Issue Details
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
            Upload Attachments (Optional)
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
            className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Log Issue"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
