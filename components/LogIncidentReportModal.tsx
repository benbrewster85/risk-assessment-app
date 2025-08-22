"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import { ProjectListItem, TeamMember } from "@/lib/types";
import Select, { OnChangeValue } from "react-select";

type OptionType = { value: string; label: string };

type LogIncidentReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  userId: string;
  projects: ProjectListItem[];
  teamMembers: TeamMember[];
};

const severityLevels = [
  "Near Miss",
  "First Aid",
  "Minor Injury",
  "Reportable Injury",
];

export default function LogIncidentReportModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  userId,
  projects,
  teamMembers,
}: LogIncidentReportModalProps) {
  const supabase = createClient();
  const [projectId, setProjectId] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState("Near Miss");
  const [peopleInvolved, setPeopleInvolved] = useState<readonly OptionType[]>(
    []
  );
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
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
      setIncidentTime(new Date().toISOString().substring(0, 16));
      setSeverity("Near Miss");
      setPeopleInvolved([]);
      setDescription("");
      setActionTaken("");
    }
  }, [isOpen, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("event_logs").insert({
        team_id: teamId,
        project_id: projectId,
        created_by_id: userId,
        log_type: "Incident Report",
        start_time: incidentTime,
        log_data: {
          severity,
          people_involved_ids: peopleInvolved.map((p) => p.value),
          description,
          action_taken: actionTaken,
        },
      });

      if (error) throw error;
      toast.success("Incident Report created successfully!");
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
    <Modal title="Create Incident Report" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Incident Details</h3>
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
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Time of Incident">
              <input
                type="datetime-local"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </FormField>
            <FormField label="Severity Level">
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {severityLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="People Involved">
            <Select
              isMulti
              value={peopleInvolved}
              onChange={(selected) =>
                setPeopleInvolved(selected as OnChangeValue<OptionType, true>)
              }
              options={memberOptions}
              placeholder="Select team members..."
            />
          </FormField>
        </div>

        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Description & Actions</h3>
          <FormField label="Description of Incident">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </FormField>
          <FormField label="Immediate Action Taken">
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows={3}
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
            className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Create Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
