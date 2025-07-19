"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import { ProjectListItem, TeamMember } from "@/lib/types";

type LogLostShiftReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  userId: string;
  projects: ProjectListItem[];
  teamMembers: TeamMember[];
};

export default function LogLostShiftReportModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  userId,
  projects,
  teamMembers,
}: LogLostShiftReportModalProps) {
  const supabase = createClient();
  const [projectId, setProjectId] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects[0]?.id || "");
      setShiftDate(new Date().toISOString().split("T")[0]);
      setPersonnel([userId]);
      setReason("");
    }
  }, [isOpen, projects, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error("Please provide a reason for the lost shift.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("event_logs").insert({
        team_id: teamId,
        project_id: projectId,
        created_by_id: userId,
        log_type: "Lost Shift Report",
        // For a lost shift, start_time can represent the date it was meant to happen
        start_time: new Date(shiftDate).toISOString(),
        // All unique data goes into the flexible log_data field
        log_data: {
          reason_for_loss: reason,
          personnel_ids: personnel,
        },
      });

      if (error) throw error;

      toast.success("Lost Shift Report created successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to create report: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Create Lost Shift Report" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Project">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date of Lost Shift">
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Personnel Involved">
          <select
            multiple
            value={personnel}
            onChange={(e) =>
              setPersonnel(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className="h-32"
          >
            {teamMembers.map((m) => (
              <option
                key={m.id}
                value={m.id}
              >{`${m.first_name} ${m.last_name}`}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Reason for Loss of Shift">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            required
          />
        </FormField>

        <div className="flex justify-end pt-2">
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
            {isSubmitting ? "Submitting..." : "Create Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
