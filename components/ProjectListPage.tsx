"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Modal from "@/components/Modal";
import ConfirmModal from "./ConfirmModal";
import { ProjectListItem } from "@/lib/types";
import { toast } from "react-hot-toast";

// CORRECTED: The type name now matches the component
type ProjectListPageProps = {
  initialProjects: ProjectListItem[];
  currentUserRole: string;
};

// CORRECTED: The component now uses the correct props type
export default function ProjectListPage({
  initialProjects,
  currentUserRole,
}: ProjectListPageProps) {
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(
    null
  );
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );

  // Form state
  const [projectName, setProjectName] = useState("");
  const [projectReference, setProjectReference] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectW3W, setNewProjectW3W] = useState("");

  const isEditing = editingProject !== null;

  useEffect(() => {
    if (isEditing && editingProject) {
      setProjectName(editingProject.name);
      setProjectReference(editingProject.reference || "");
      setProjectAddress("");
      setNewProjectW3W("");
    }
  }, [isEditing, editingProject]);

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName("");
    setProjectReference("");
    setProjectAddress("");
    setNewProjectW3W("");
    setIsModalOpen(true);
  };

  const openEditModal = (project: ProjectListItem) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      toast.error("Project name is required.");
      return;
    }
    const projectData = isEditing
      ? {
          name: projectName,
          reference: projectReference || null,
        }
      : {
          name: projectName,
          reference: projectReference || null,
          location_address: projectAddress || null,
          location_what3words: projectW3W || null,
        };
    const { data: updatedProject, error } = isEditing
      ? await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject!.id)
          .select("id, name, reference, last_edited_at")
          .single()
      : await supabase
          .from("projects")
          .insert(projectData)
          .select("id, name, reference, last_edited_at")
          .single();

    if (error) {
      toast.error(`Failed to save project: ${error.message}`);
    } else if (updatedProject) {
      toast.success(
        `Project ${isEditing ? "updated" : "created"} successfully!`
      );
      if (isEditing) {
        setProjects(
          projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
      } else {
        setProjects([updatedProject, ...projects]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProjectId) return;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deletingProjectId);
    if (error) {
      toast.error(`Failed to delete project: ${error.message}`);
    } else {
      toast.success("Project deleted.");
      setProjects(projects.filter((p) => p.id !== deletingProjectId));
    }
    setDeletingProjectId(null);
  };

  return (
    <>
      <Modal
        title={isEditing ? "Edit Project" : "Create New Project"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-gray-700"
            >
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="projectRef"
              className="block text-sm font-medium text-gray-700"
            >
              Reference (Optional)
            </label>
            <input
              type="text"
              id="projectRef"
              value={projectReference}
              onChange={(e) => setProjectReference(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          {!isEditing && (
            <>
              <div>
                <label
                  htmlFor="projectAddress"
                  className="block text-sm font-medium text-gray-700"
                >
                  Site Address (Optional)
                </label>
                <textarea
                  id="projectAddress"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="projectW3W"
                  className="block text-sm font-medium text-gray-700"
                >
                  what3words Address (Optional)
                </label>
                <input
                  type="text"
                  id="projectW3W"
                  value={projectW3W}
                  onChange={(e) => setNewProjectW3W(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="e.g. ///filled.count.soap"
                />
              </div>
            </>
          )}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deletingProjectId !== null}
        onClose={() => setDeletingProjectId(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete this project? All of its data, including risk assessments, will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Project"
        isDestructive={true}
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">All Projects</h1>
            {currentUserRole === "team_admin" && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Project
              </button>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="border p-4 rounded-lg flex flex-col justify-between hover:shadow-lg transition-shadow"
                  >
                    <Link
                      href={`/dashboard/project/${project.id}`}
                      className="block flex-grow"
                    >
                      <h3 className="font-bold text-xl mb-2 text-blue-700 hover:underline">
                        {project.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Ref: {project.reference || "N/A"}
                      </p>
                    </Link>
                    <div className="flex-shrink-0 mt-4">
                      <p className="text-gray-500 text-xs">
                        Last edited:{" "}
                        {new Date(project.last_edited_at).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </p>
                      {currentUserRole === "team_admin" && (
                        <div className="border-t mt-2 pt-2 flex justify-end space-x-3">
                          <button
                            onClick={() => openEditModal(project)}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingProjectId(project.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-700">
                  No projects yet.
                </h3>
                {currentUserRole === "team_admin" && (
                  <p className="text-gray-500 mt-2">
                    Get started by creating your first project.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
