"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { Project, TeamMember } from "@/lib/types";

type AddProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  teamId: string | null;
  teamMembers: TeamMember[];
  projectToEdit: Project | null;
};

const projectStatuses = [
  "Request Recieved",
  "Go Ahead Given",
  "Work Started",
  "Completed",
];

export default function AddProjectModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  teamMembers,
  projectToEdit,
}: AddProjectModalProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [costCode, setCostCode] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [status, setStatus] = useState("Request Recieved");
  const [siteAddress, setSiteAddress] = useState("");

  const [projectManagerId, setProjectManagerId] = useState<string | null>("");
  const [projectManagerExternal, setProjectManagerExternal] = useState("");
  const [siteLeadId, setSiteLeadId] = useState<string | null>("");
  const [siteLeadExternal, setSiteLeadExternal] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = projectToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && projectToEdit) {
        setName(projectToEdit.name);
        setReference(projectToEdit.reference || "");
        setCostCode(projectToEdit.cost_code || "");
        setClientContact(projectToEdit.client_contact || "");
        setStatus(projectToEdit.document_status || "Request Recieved");
        setSiteAddress(projectToEdit.location_address || "");
        setProjectManagerId(projectToEdit.project_manager_id || "");
        setProjectManagerExternal(
          projectToEdit.project_manager_external_name || ""
        );
        // This line is now corrected
        setSiteLeadId(projectToEdit.site_lead_id || "");
        setSiteLeadExternal(projectToEdit.site_lead_external_name || "");
      } else {
        setName("");
        setReference("");
        setCostCode("");
        setClientContact("");
        setStatus("Request Recieved");
        setSiteAddress("");
        setProjectManagerId("");
        setProjectManagerExternal("");
        setSiteLeadId("");
        setSiteLeadExternal("");
      }
    }
  }, [isOpen, projectToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const projectData = {
      name,
      reference: reference || null,
      cost_code: costCode || null,
      client_contact: clientContact || null,
      document_status: status,
      location_address: siteAddress || null,
      project_manager_id:
        projectManagerId === "external" ? null : projectManagerId,
      project_manager_external_name:
        projectManagerId === "external" ? projectManagerExternal : null,
      // This line is now corrected
      site_lead_id: siteLeadId === "external" ? null : siteLeadId,
      site_lead_external_name:
        siteLeadId === "external" ? siteLeadExternal : null,
      last_edited_at: new Date().toISOString(),
    };

    const { data, error } = isEditing
      ? await supabase
          .from("projects")
          .update(projectData)
          .eq("id", projectToEdit!.id)
          .select()
          .single()
      : await supabase
          .from("projects")
          .insert({ ...projectData, team_id: teamId })
          .select()
          .single();

    if (error) {
      toast.error(`Failed to save project: ${error.message}`);
    } else if (data) {
      toast.success(`Project ${isEditing ? "updated" : "added"} successfully!`);
      onSuccess(data as Project);
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={
        isEditing
          ? `Edit Project: ${projectToEdit?.name}`
          : "Create New Project"
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div>
            <label>Cost Code</label>
            <input
              type="text"
              value={costCode}
              onChange={(e) => setCostCode(e.target.value)}
            />
          </div>
          <div>
            <label>Client Contact</label>
            <input
              type="text"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
            />
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {projectStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label>Project Manager</label>
            <select
              value={projectManagerId || ""}
              onChange={(e) => setProjectManagerId(e.target.value)}
            >
              <option value="">Select a team member...</option>
              {teamMembers.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                >{`${m.first_name} ${m.last_name}`}</option>
              ))}
              <option value="external">External / Other</option>
            </select>
            {projectManagerId === "external" && (
              <input
                type="text"
                value={projectManagerExternal}
                onChange={(e) => setProjectManagerExternal(e.target.value)}
                placeholder="Enter external PM name"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label>Site Lead</label>
            <select
              value={siteLeadId || ""}
              onChange={(e) => setSiteLeadId(e.target.value)}
            >
              <option value="">Select a team member...</option>
              {teamMembers.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                >{`${m.first_name} ${m.last_name}`}</option>
              ))}
              <option value="external">External / Other</option>
            </select>
            {siteLeadId === "external" && (
              <input
                type="text"
                value={siteLeadExternal}
                onChange={(e) => setSiteLeadExternal(e.target.value)}
                placeholder="Enter external lead name"
                className="mt-2"
              />
            )}
          </div>
        </div>

        <div>
          <label>Site Address</label>
          <textarea
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
            rows={3}
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
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
