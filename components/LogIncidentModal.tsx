"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import { ProjectListItem, TeamMember, EventLog } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

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
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects[0]?.id || "");
      setIncidentTime(new Date().toISOString().substring(0, 16));
      setSeverity("Near Miss");
      setPeopleInvolved("");
      setDescription("");
      setActionTaken("");
      setAttachments([]);
    }
  }, [isOpen, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("event_logs")
        .insert({
          team_id: teamId,
          project_id: projectId,
          created_by_id: userId,
          log_type: "Incident Report",
          start_time: incidentTime, // We use start_time for the incident time
          log_data: {
            severity,
            people_involved: peopleInvolved,
            description,
            action_taken: actionTaken,
          },
        })
        .select("id")
        .single();

      if (eventError) throw eventError;

      // Handle file uploads if present
      if (attachments.length > 0) {
        const uploadPromises = attachments.map((file) => {
          const fileExt = file.name.split(".").pop();
          const filePath = `${teamId}/${eventData.id}/${uuidv4()}.${fileExt}`;
          return supabase.storage
            .from("event_log_attachments")
            .upload(filePath, file); // We need a new bucket for this
        });
        // ... (Full file upload and linking logic would be added here)
      }

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
        <FormField label="People Involved">
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
