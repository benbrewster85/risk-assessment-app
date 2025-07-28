"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Modal from "@/components/Modal";
import ConfirmModal from "./ConfirmModal";
import { ProjectListItem } from "@/lib/types";
import { toast } from "react-hot-toast";
import { Plus, Edit, Trash2 } from "react-feather";

type ProjectListPageProps = {
  initialProjects: ProjectListItem[];
  currentUserRole: string;
  teamId: string | null;
};

export default function ProjectListPage({
  initialProjects,
  currentUserRole,
  teamId,
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

  const [projectName, setProjectName] = useState("");
  const [projectReference, setProjectReference] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectW3W, setNewProjectW3W] = useState("");

  const [filter, setFilter] = useState("");
  // Sorting state
  const [sortBy, setSortBy] = useState<"name" | "reference" | "last_edited_at">(
    "name"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

    const insertData = {
      name: projectName,
      reference: projectReference || null,
      location_address: projectAddress || null,
      location_what3words: projectW3W || null,
      team_id: teamId,
    };
    const updateData = {
      name: projectName,
      reference: projectReference || null,
    };

    const { data: updatedProject, error } = isEditing
      ? await supabase
          .from("projects")
          .update(updateData)
          .eq("id", editingProject!.id)
          .select("id, name, reference, last_edited_at")
          .single()
      : await supabase
          .from("projects")
          .insert(insertData)
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

  // Filtering
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(filter.toLowerCase()) ||
      (project.reference || "").toLowerCase().includes(filter.toLowerCase())
  );

  // Sorting
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue = a[sortBy] || "";
    let bValue = b[sortBy] || "";

    if (sortBy === "last_edited_at") {
      const aTime = aValue ? new Date(aValue).getTime() : 0;
      const bTime = bValue ? new Date(bValue).getTime() : 0;
      if (aTime < bTime) return sortDirection === "asc" ? -1 : 1;
      if (aTime > bTime) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(column: "name" | "reference" | "last_edited_at") {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  }

  return (
    <>
      <Modal
        title={isEditing ? "Edit Project" : "Create New Project"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="projectRef" className="block text-sm font-medium">
              Reference (Optional)
            </label>
            <input
              id="projectRef"
              type="text"
              value={projectReference}
              onChange={(e) => setProjectReference(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>
          {!isEditing && (
            <>
              <div>
                <label
                  htmlFor="projectAddress"
                  className="block text-sm font-medium"
                >
                  Site Address (Optional)
                </label>
                <textarea
                  id="projectAddress"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="projectW3W"
                  className="block text-sm font-medium"
                >
                  what3words Address (Optional)
                </label>
                <input
                  id="projectW3W"
                  type="text"
                  value={projectW3W}
                  onChange={(e) => setNewProjectW3W(e.target.value)}
                  className="mt-1 block w-full"
                  placeholder="e.g. ///filled.count.soap"
                />
              </div>
            </>
          )}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-2 py-2 px-4 border rounded-md"
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
        message={`Are you sure you want to delete this project? All of its data will be permanently removed.`}
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
                className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Project</span>
              </button>
            )}
          </div>
          {/* Filter Section */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Filter Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Name or Reference
                </label>
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2"
                />
              </div>
              {/* Example: Add more filters here later */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm p-2">
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div> */}
            </div>
          </div>
          {/* Project Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort("name")}
                    >
                      Name{" "}
                      {sortBy === "name" &&
                        (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort("reference")}
                    >
                      Reference{" "}
                      {sortBy === "reference" &&
                        (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort("last_edited_at")}
                    >
                      Last Edited{" "}
                      {sortBy === "last_edited_at" &&
                        (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProjects.length > 0 ? (
                    sortedProjects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <Link
                            href={`/dashboard/project/${project.id}`}
                            className="text-blue-700 hover:underline font-bold"
                          >
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {project.reference || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(project.last_edited_at).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {currentUserRole === "team_admin" && (
                            <>
                              <button
                                onClick={() => openEditModal(project)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingProjectId(project.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-gray-500 py-8"
                      >
                        No projects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
