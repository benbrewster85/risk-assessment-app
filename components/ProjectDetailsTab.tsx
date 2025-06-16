"use client";

import { createClient } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { useState } from "react";
import { toast } from "react-hot-toast";

// UPDATED: The component now accepts the user's admin status
type ProjectDetailsTabProps = {
  project: Project;
  isCurrentUserAdmin: boolean;
};

export default function ProjectDetailsTab({
  project,
  isCurrentUserAdmin,
}: ProjectDetailsTabProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state, initialized with the project data
  const [name, setName] = useState(project.name);
  const [reference, setReference] = useState(project.reference || "");
  const [address, setAddress] = useState(project.location_address || "");
  const [w3w, setW3w] = useState(project.location_what3words || "");
  const [scope, setScope] = useState(project.scope || "");
  const [author, setAuthor] = useState(project.author || "");
  const [reviewer, setReviewer] = useState(project.reviewer || "");
  const [version, setVersion] = useState(project.version || "1.0");
  const [status, setStatus] = useState(project.document_status || "Draft");

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name,
        reference,
        location_address: address,
        location_what3words: w3w,
        scope,
        author,
        reviewer,
        version,
        document_status: status,
      })
      .eq("id", project.id);

    if (error) {
      toast.error(`Failed to save changes: ${error.message}`);
    } else {
      toast.success("Project details saved successfully!");
    }
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSaveChanges}
      className="space-y-6 bg-white p-8 rounded-lg shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            readOnly={!isCurrentUserAdmin}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="projectRef" className="block text-sm font-medium">
            Reference
          </label>
          <input
            id="projectRef"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            readOnly={!isCurrentUserAdmin}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="projectVersion" className="block text-sm font-medium">
            Version
          </label>
          <input
            id="projectVersion"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            readOnly={!isCurrentUserAdmin}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="projectStatus" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="projectStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={!isCurrentUserAdmin}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
          >
            <option>Draft</option>
            <option>In Review</option>
            <option>Approved</option>
            <option>Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="projectAuthor" className="block text-sm font-medium">
            Author
          </label>
          <input
            id="projectAuthor"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            readOnly={!isCurrentUserAdmin}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="projectReviewer"
            className="block text-sm font-medium"
          >
            Reviewer
          </label>
          <input
            id="projectReviewer"
            type="text"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            readOnly={!isCurrentUserAdmin}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
          />
        </div>
      </div>
      <div>
        <label htmlFor="projectAddress" className="block text-sm font-medium">
          Site Address
        </label>
        <textarea
          id="projectAddress"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          readOnly={!isCurrentUserAdmin}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="projectW3W" className="block text-sm font-medium">
          what3words Address
        </label>
        <input
          id="projectW3W"
          type="text"
          value={w3w}
          onChange={(e) => setW3w(e.target.value)}
          readOnly={!isCurrentUserAdmin}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="projectScope" className="block text-sm font-medium">
          Scope of Work
        </label>
        <textarea
          id="projectScope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          rows={5}
          readOnly={!isCurrentUserAdmin}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm read-only:bg-gray-100"
        />
      </div>
      {/* Only show the save button to admins */}
      {isCurrentUserAdmin && (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-6 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </form>
  );
}
