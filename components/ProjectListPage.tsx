"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ProjectListItem, TeamMember, Project } from "@/lib/types";
import { Plus, Edit2, Trash2, ArrowDown, ArrowUp } from "react-feather";
import AddProjectModal from "./AddProjectModal";
import ConfirmModal from "./ConfirmModal";

type ProjectListPageProps = {
  initialProjects: ProjectListItem[];
  teamMembers: TeamMember[];
  currentUserRole: string;
  teamId: string | null;
};

export default function ProjectListPage({
  initialProjects,
  teamMembers,
  currentUserRole,
  teamId,
}: ProjectListPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects || []);

  // State for the new modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] =
    useState<ProjectListItem | null>(null);

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "reference" | "last_edited_at">(
    "last_edited_at"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setProjects(initialProjects || []);
  }, [initialProjects]);

  // Handler for when a project is successfully created or edited
  const handleSuccess = (updatedProject: Project) => {
    router.refresh();
    setIsModalOpen(false);
  };

  // Opens the modal in "Create" mode
  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  // Opens the modal in "Edit" mode after fetching the full project details
  const openEditModal = async (projectId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (error) {
      toast.error("Could not load project details to edit.");
    } else {
      setEditingProject(data);
      setIsModalOpen(true);
    }
  };

  // Handles the final deletion after confirmation
  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deletingProject.id);
    if (error) {
      toast.error(`Failed to delete project: ${error.message}`);
    } else {
      toast.success("Project deleted.");
      setProjects(projects.filter((p) => p.id !== deletingProject.id));
    }
    setDeletingProject(null);
  };

  const sortedAndFilteredProjects = useMemo(() => {
    return projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : 1;
        } else {
          return aValue > bValue ? -1 : 1;
        }
      });
  }, [projects, searchTerm, sortBy, sortDirection]);

  const handleSort = (column: "name" | "reference" | "last_edited_at") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  return (
    <>
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        teamId={teamId}
        teamMembers={teamMembers}
        projectToEdit={editingProject}
      />
      <ConfirmModal
        isOpen={deletingProject !== null}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${deletingProject?.name}"? All related data will be lost.`}
        isDestructive={true}
        confirmText="Delete"
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
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

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 p-2 border rounded-md"
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Project Name{" "}
                    {sortBy === "name" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("last_edited_at")}
                  >
                    Last Edited{" "}
                    {sortBy === "last_edited_at" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredProjects.length > 0 ? (
                  sortedAndFilteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/project/${project.id}`}
                          className="text-blue-700 hover:underline"
                        >
                          <div className="text-sm font-semibold">
                            {project.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {project.reference}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {project.document_status || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.last_edited_at).toLocaleString(
                          "en-GB"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        {currentUserRole === "team_admin" && (
                          <>
                            <button
                              onClick={() => openEditModal(project.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingProject(project)}
                              className="text-red-600 hover:text-red-900"
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
                    <td colSpan={4} className="text-center text-gray-500 py-8">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
