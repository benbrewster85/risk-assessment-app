"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { v4 as uuidv4 } from "uuid";
import type { Asset, AssetIssue } from "@/lib/types";

type LogMaintenanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newIssue: AssetIssue) => void;
  asset: Asset;
  userId: string;
};

export default function LogMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
  userId,
}: LogMaintenanceModalProps) {
  const supabase = createClient();
  const [logType, setLogType] = useState("Calibration");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [logNotes, setLogNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNotes) {
      toast.error("Please provide some notes for the log.");
      return;
    }
    if (logType === "Calibration" && !eventDate) {
      toast.error("Please provide a date for the calibration.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: logData, error: logError } = await supabase
        .from("asset_issues")
        .insert({
          asset_id: asset.id,
          team_id: asset.team_id,
          reported_by_id: userId,
          log_type: logType,
          log_notes: logNotes,
          event_date: logType === "Calibration" ? eventDate : null,
          status: "Resolved", // Maintenance logs are typically "resolved" by default
        })
        .select("id")
        .single();
      if (logError) throw logError;

      if (attachments.length > 0) {
        const attachmentUploadPromises = attachments.map((file) => {
          const fileExt = file.name.split(".").pop();
          const filePath = `${asset.team_id}/${logData.id}/${uuidv4()}.${fileExt}`;
          return supabase.storage
            .from("asset-issue-photos")
            .upload(filePath, file);
        });
        const uploadResults = await Promise.all(attachmentUploadPromises);
        const photoRecords = [];
        for (const result of uploadResults) {
          if (result.error) throw result.error;
          if (!result.data?.path)
            throw new Error("File upload did not return a path.");
          photoRecords.push({
            issue_id: logData.id,
            file_path: result.data.path,
          });
        }
        if (photoRecords.length > 0) {
          const { error: photoError } = await supabase
            .from("asset_issue_photos")
            .insert(photoRecords);
          if (photoError) throw photoError;
        }
      }

      const { data: finalLog, error: finalError } = await supabase
        .from("asset_issues")
        .select("*, reporter:reported_by_id(*), photos:asset_issue_photos(*)")
        .eq("id", logData.id)
        .single();
      if (finalError) throw finalError;

      toast.success("Maintenance log added successfully!");
      onSuccess(finalLog as AssetIssue);
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
      title={`Log Maintenance for ${asset.system_id}`}
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
            <option>Calibration</option>
            <option>Service</option>
            <option>Repair</option>
          </select>
        </div>
        {logType === "Calibration" && (
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium">
              Calibration Date
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
        )}
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
