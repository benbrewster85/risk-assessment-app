"use client";

import { createClient } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type ProjectDetailsTabProps = {
  project: Project;
  isCurrentUserAdmin: boolean;
  onUpdate: (updatedProject: Project) => void;
};

export default function ProjectDetailsTab({
  project,
  isCurrentUserAdmin,
  onUpdate,
}: ProjectDetailsTabProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(project.name);
  const [reference, setReference] = useState(project.reference || "");
  const [address, setAddress] = useState(project.location_address || "");
  const [costCode, setCostCode] = useState(project.cost_code || "");
  const [clientContact, setClientContact] = useState(
    project.client_contact || ""
  );
  const [version, setVersion] = useState(project.version || "1.0");
  const [status, setStatus] = useState(project.document_status || "Draft");

  useEffect(() => {
    setName(project.name);
    setReference(project.reference || "");
    setAddress(project.location_address || "");
    setCostCode(project.cost_code || "");
    setClientContact(project.client_contact || "");
    setVersion(project.version || "1.0");
    setStatus(project.document_status || "Draft");
  }, [project]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData = {
      name,
      reference,
      version,
      document_status: status,
      location_address: address,
      cost_code: costCode,
      client_contact: clientContact,
      last_edited_at: new Date().toISOString(),
    };

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", project.id)
      .select("*")
      .single();

    if (error) {
      toast.error(`Failed to save changes: ${error.message}`);
    } else if (updatedProject) {
      toast.success("Project details saved successfully!");
      onUpdate(updatedProject);
      setIsEditing(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Project Details</h2>
        {isCurrentUserAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Edit Details
          </button>
        )}
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={!isEditing}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              readOnly={!isEditing}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Cost Code</label>
            <input
              type="text"
              value={costCode}
              onChange={(e) => setCostCode(e.target.value)}
              readOnly={!isEditing}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Client Contact</label>
            <input
              type="text"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              readOnly={!isEditing}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              readOnly={!isEditing}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <input
              type="text"
              value={status}
              readOnly={true}
              className="mt-1 block w-full bg-gray-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Site Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            readOnly={!isEditing}
            rows={3}
            className="mt-1 block w-full"
          />
        </div>

        {isEditing && (
          <div className="flex justify-end pt-4 space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-2 px-4 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
