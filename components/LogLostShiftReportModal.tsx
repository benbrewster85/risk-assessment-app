"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import { ProjectListItem, TeamMember } from "@/lib/types";
import Select, { OnChangeValue } from "react-select";

type OptionType = { value: string; label: string };

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
  const [personnel, setPersonnel] = useState<readonly OptionType[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberOptions = useMemo(
    () =>
      teamMembers.map((m) => ({
        value: m.id,
        label: `${m.first_name || ""} ${m.last_name || ""}`.trim(),
      })),
    [teamMembers]
  );

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects[0]?.id || "");
      setShiftDate(new Date().toISOString().split("T")[0]);
      const currentUserOption = memberOptions.find((m) => m.value === userId);
      setPersonnel(currentUserOption ? [currentUserOption] : []);
      setReason("");
    }
  }, [isOpen, projects, userId, memberOptions]);

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
        start_time: new Date(shiftDate).toISOString(),
        log_data: {
          reason_for_loss: reason,
          personnel_ids: personnel.map((p) => p.value),
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Core Details</h3>
          <FormField label="Project">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </FormField>
        </div>

        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Personnel & Reason</h3>
          <FormField label="Personnel Involved">
            <Select
              isMulti
              value={personnel}
              onChange={(selected) =>
                setPersonnel(selected as OnChangeValue<OptionType, true>)
              }
              options={memberOptions}
            />
          </FormField>
          <FormField label="Reason for Loss of Shift">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </FormField>
        </div>

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
