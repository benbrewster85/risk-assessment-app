"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import { ProjectListItem, TeamMember } from "@/lib/types";

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
}: LogIncidentReportModalProps) {
  const supabase = createClient();
  const [projectId, setProjectId] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState("Near Miss");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects[0]?.id || "");
      setIncidentTime(new Date().toISOString().substring(0, 16));
      setSeverity("Near Miss");
      setPeopleInvolved("");
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
          people_involved: peopleInvolved,
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Time of Incident">
            <input
              type="datetime-local"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Severity Level">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              {severityLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="People Involved (Names)">
          <input
            type="text"
            value={peopleInvolved}
            onChange={(e) => setPeopleInvolved(e.target.value)}
            placeholder="e.g., John Doe, Jane Smith"
          />
        </FormField>
        <FormField label="Description of Incident">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </FormField>
        <FormField label="Immediate Action Taken">
          <textarea
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            rows={3}
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
            className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Create Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
