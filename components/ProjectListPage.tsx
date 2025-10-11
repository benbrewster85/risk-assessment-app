"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ProjectListItem, TeamMember, Project } from "@/lib/types";
import {
  Plus,
  ArrowDown,
  ArrowUp,
  List,
  Map as MapIcon,
  ChevronDown,
} from "react-feather";
import AddProjectModal from "./AddProjectModal";
import ConfirmModal from "./ConfirmModal";
// NEW: Import shadcn/ui components for the dropdown
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ProjectMap = dynamic(() => import("./ProjectMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[70vh] rounded-lg bg-gray-200 animate-pulse" />
  ),
});

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

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] =
    useState<ProjectListItem | null>(null);

  // --- FILTERING & SORTING STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "reference" | "last_edited_at">(
    "last_edited_at"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  // UPDATED: State for status filter is now an array
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [pmFilter, setPmFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setProjects(initialProjects || []);
  }, [initialProjects]);

  // NEW: Handler to toggle a status in the selectedStatuses array
  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatuses, pmFilter, pageSize]);

  // --- DATA PREPARATION FOR DROPDOWNS ---
  const statusOptions = useMemo(() => {
    const validStatuses = projects
      .map((p) => p.document_status)
      .filter((status): status is string => !!status);
    return Array.from(new Set(validStatuses));
  }, [projects]);

  const projectManagerOptions = useMemo(() => {
    const pmIds = new Set(
      projects.map((p) => p.project_manager_id).filter(Boolean)
    );
    return teamMembers.filter((member) => member.id && pmIds.has(member.id));
  }, [projects, teamMembers]);

  // --- CORE FILTERING & SORTING LOGIC ---
  const sortedAndFilteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const searchMatch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.reference?.toLowerCase().includes(searchTerm.toLowerCase());

        const statusMatch =
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(p.document_status || "");

        const pmMatch = !pmFilter || p.project_manager_id === pmFilter;

        return searchMatch && statusMatch && pmMatch;
      })
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
  }, [projects, searchTerm, sortBy, sortDirection, selectedStatuses, pmFilter]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedAndFilteredProjects.slice(startIndex, endIndex);
  }, [sortedAndFilteredProjects, currentPage, pageSize]);

  const handleSort = (column: "name" | "reference" | "last_edited_at") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleSuccess = (updatedProject: Project) => {
    router.refresh();
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

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

      <div className="p-8 relative z-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">All Projects</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                aria-label="List View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-md ${
                  viewMode === "map"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                aria-label="Map View"
              >
                <MapIcon size={18} />
              </button>
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

          {/* UPDATED: Filter UI Section */}
          <div className="mb-4 p-4 bg-white rounded-lg shadow border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <h3 className="text-lg font-semibold col-span-1 md:col-span-2">
                Filter Projects
              </h3>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="mt-1 w-full justify-between"
                    >
                      <span>
                        {selectedStatuses.length > 0
                          ? `${selectedStatuses.length} selected`
                          : "Select statuses..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statusOptions.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => handleStatusChange(status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <label htmlFor="pmFilter" className="block text-sm font-medium">
                  Project Manager
                </label>
                <select
                  id="pmFilter"
                  value={pmFilter}
                  onChange={(e) => setPmFilter(e.target.value)}
                  className="mt-1 block w-full"
                >
                  <option value="">All PMs</option>
                  {projectManagerOptions.map((pm) => (
                    <option
                      key={pm.id}
                      value={pm.id}
                    >{`${pm.first_name} ${pm.last_name}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {viewMode === "list" ? (
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
                  {paginatedProjects.length > 0 ? (
                    paginatedProjects.map((project) => (
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
          ) : (
            <ProjectMap projects={sortedAndFilteredProjects} />
          )}
          {viewMode === "list" && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSize" className="text-sm">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="p-1 border rounded-md"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  Page {currentPage} of{" "}
                  {Math.ceil(sortedAndFilteredProjects.length / pageSize) || 1}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(sortedAndFilteredProjects.length / pageSize)
                        )
                      )
                    }
                    disabled={
                      currentPage >=
                      Math.ceil(sortedAndFilteredProjects.length / pageSize)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
