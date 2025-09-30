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
    if (!teamId) {
      toast.error("Cannot create a project without a team.");
      return;
    }
    setIsSubmitting(true);

    const projectData = {
      name,
      team_id: teamId,
      document_status: "Request Recieved", // Set a default status
      last_edited_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (error) {
      toast.error(`Failed to create project: ${error.message}`);
    } else if (data) {
      toast.success(`Project "${data.name}" created successfully!`);
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
        <div>
          <label className="block mb-2">Project Name</label>
          <input
            className="block w-full border rounded-md p-2"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New Retail Store Fit-out"
            required
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
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
