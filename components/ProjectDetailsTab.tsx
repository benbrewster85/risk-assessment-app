"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Project, TeamMember } from "@/lib/types";
import ColorPicker from "./ColorPicker";
import LocationSearchInput from "./LocationSearchInput";

type ProjectDetailsTabProps = {
  project: Project;
  teamMembers: TeamMember[];
  isCurrentUserAdmin: boolean;
  mapboxToken?: string;
  onUpdate: (updatedProject: Project) => void;
};

const projectStatuses = [
  "Request Recieved",
  "Go Ahead Given",
  "Work Started",
  "Completed",
];

export default function ProjectDetailsTab({
  project,
  teamMembers,
  mapboxToken,
  isCurrentUserAdmin,
  onUpdate,
}: ProjectDetailsTabProps) {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(project.name);
  const [reference, setReference] = useState(project.reference || "");
  const [address, setAddress] = useState(project.location_address || "");
  const [latitude, setLatitude] = useState(project.latitude || null);
  const [longitude, setLongitude] = useState(project.longitude || null);
  const [costCode, setCostCode] = useState(project.cost_code || "");
  const [clientContact, setClientContact] = useState(
    project.client_contact || ""
  );
  const [status, setStatus] = useState(
    project.document_status || "Request Recieved"
  );
  const [pmId, setPmId] = useState("");
  const [pmExternal, setPmExternal] = useState("");
  const [slId, setSlId] = useState("");
  const [slExternal, setSlExternal] = useState("");
  const [jobDescription, setJobDescription] = useState(
    project.job_description || ""
  );
  const [color, setColor] = useState(
    project.color || "bg-slate-200 text-slate-800"
  );

  useEffect(() => {
    setName(project.name);
    setReference(project.reference || "");
    setAddress(project.location_address || "");
    setCostCode(project.cost_code || "");
    setClientContact(project.client_contact || "");
    setStatus(project.document_status || "Request Recieved");
    setJobDescription(project.job_description || "");
    setLatitude(project.latitude || null);
    setLongitude(project.longitude || null);
    setColor(project.color || "bg-slate-200 text-slate-800");

    // **FIXED LOGIC HERE**
    // This now correctly sets the component state to be the single source of truth.
    if (project.project_manager_id) {
      setPmId(project.project_manager_id);
      setPmExternal("");
    } else if (project.project_manager_external_name) {
      setPmId("external");
      setPmExternal(project.project_manager_external_name);
    } else {
      setPmId("");
      setPmExternal("");
    }

    if (project.site_lead_id) {
      setSlId(project.site_lead_id);
      setSlExternal("");
    } else if (project.site_lead_external_name) {
      setSlId("external");
      setSlExternal(project.site_lead_external_name);
    } else {
      setSlId("");
      setSlExternal("");
    }
  }, [project]);

  const handleLocationSelect = (location: {
    address: string;
    longitude: number;
    latitude: number;
  }) => {
    setAddress(location.address);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const updateData = {
      name,
      reference,
      cost_code: costCode,
      client_contact: clientContact,
      document_status: status,
      project_manager_id: pmId === "external" ? null : pmId || null,
      project_manager_external_name: pmId === "external" ? pmExternal : null,
      site_lead_id: slId === "external" ? null : slId || null,
      site_lead_external_name: slId === "external" ? slExternal : null,
      location_address: address,
      latitude: latitude,
      longitude: longitude,
      job_description: jobDescription,
      color: color,
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

  const getMemberName = (id: string | null) => {
    if (!id) return "Not Assigned";
    const member = teamMembers.find((m) => m.id === id);
    return member ? `${member.first_name} ${member.last_name}` : "Not Assigned";
  };

  return (
    <form onSubmit={handleSaveChanges} className="space-y-8">
      {/* Project Details Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Project Details</h2>
          {isCurrentUserAdmin && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Edit Details
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Main Details Grid */}
          <div className="bg-white p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Cost Code</label>
                <input
                  type="text"
                  value={costCode}
                  onChange={(e) => setCostCode(e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Client Contact
                </label>
                <input
                  type="text"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                {isEditing ? (
                  <select
                    value={status || ""}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {projectStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 font-medium">{status}</p>
                )}
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-medium">
                  Project Manager
                </label>
                {isEditing ? (
                  <>
                    <select
                      value={pmId} // **FIXED LOGIC HERE**
                      onChange={(e) => {
                        const value = e.target.value;
                        setPmId(value);
                        if (value !== "external") {
                          setPmExternal("");
                        }
                      }}
                    >
                      <option value="">Select a PM...</option>
                      {teamMembers.map((m) => (
                        <option
                          key={m.id}
                          value={m.id}
                        >{`${m.first_name} ${m.last_name}`}</option>
                      ))}
                      <option value="external">External / Other</option>
                    </select>
                    {pmId === "external" && (
                      <input
                        type="text"
                        value={pmExternal}
                        onChange={(e) => setPmExternal(e.target.value)}
                        placeholder="Enter external PM name"
                        className="mt-2"
                      />
                    )}
                  </>
                ) : (
                  <p className="mt-2">
                    {project.project_manager_external_name ||
                      getMemberName(project.project_manager_id)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Senior Engineer
                </label>
                {isEditing ? (
                  <>
                    <select
                      value={slId} // **FIXED LOGIC HERE**
                      onChange={(e) => {
                        const value = e.target.value;
                        setSlId(value);
                        if (value !== "external") {
                          setSlExternal("");
                        }
                      }}
                    >
                      <option value="">Select an Engineer...</option>
                      {teamMembers.map((m) => (
                        <option
                          key={m.id}
                          value={m.id}
                        >{`${m.first_name} ${m.last_name}`}</option>
                      ))}
                      <option value="external">External / Other</option>
                    </select>
                    {slId === "external" && (
                      <input
                        type="text"
                        value={slExternal}
                        onChange={(e) => setSlExternal(e.target.value)}
                        placeholder="Enter external engineer name"
                        className="mt-2"
                      />
                    )}
                  </>
                ) : (
                  <p className="mt-2">
                    {project.site_lead_external_name ||
                      getMemberName(project.site_lead_id)}
                  </p>
                )}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  Project Colour
                </label>
                <ColorPicker
                  value={color}
                  onChange={setColor}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Site Address Section */}
          <div className="md:col-span-2 lg:col-span-3">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="site-address"
            >
              Site Address
            </label>
            {mapboxToken ? (
              <LocationSearchInput
                accessToken={mapboxToken}
                initialValue={project.location_address || ""}
                onLocationSelect={handleLocationSelect}
                disabled={!isEditing}
              />
            ) : (
              <div className="p-3 w-full bg-gray-100 text-gray-600 text-sm rounded-md border">
                Location search is unavailable (Map token not configured).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Description Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Job Description</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          readOnly={!isEditing}
          rows={8}
          className={`w-full ${!isEditing ? "bg-white" : ""}`}
          placeholder={
            isEditing
              ? "Enter the job description here..."
              : "No job description has been provided."
          }
        />
      </div>

      {isEditing && (
        <div className="flex justify-end pt-2 space-x-2">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              // Optionally reset form state here if needed
            }}
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
  );
}
