"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EventLog,
  ProjectListItem,
  TeamMember,
  Asset,
  Vehicle,
} from "@/lib/types";
import CreateReportSelectorModal, {
  ReportType,
} from "./CreateReportSelectorModal";
import LogShiftReportModal from "./LogShiftReportModal";
import ShiftReportDetailModal from "./ShiftReportDetailModal";
import { Plus, ChevronLeft, ChevronRight } from "react-feather";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

type LogsListPageProps = {
  initialReports: EventLog[];
  projects: ProjectListItem[];
  teamMembers: TeamMember[];
  assets: Asset[];
  vehicles: Vehicle[];
  teamId: string;
  userId: string;
};

const ITEMS_PER_PAGE = 10;

export default function LogsListPage({
  initialReports,
  projects,
  teamMembers,
  assets,
  vehicles,
  teamId,
  userId,
}: LogsListPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [reports, setReports] = useState(initialReports);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isShiftReportModalOpen, setIsShiftReportModalOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<EventLog | null>(null);

  const [projectFilter, setProjectFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  const handleReportTypeSelect = (reportType: ReportType) => {
    setIsSelectorOpen(false);
    if (reportType === "Shift Report") {
      setIsShiftReportModalOpen(true);
    } else {
      toast.error(`${reportType} form not implemented yet.`);
    }
  };

  const handleViewReportDetails = async (reportId: string) => {
    const loadingToast = toast.loading("Loading report details...");
    // This is the new, more explicit and robust query
    const { data, error } = await supabase
      .from("event_logs")
      .select(
        `
                *,
                project:projects(name),
                created_by:profiles(first_name, last_name),
                personnel:event_log_personnel!inner(profiles(id, first_name, last_name)),
                assets:event_log_assets!inner(assets(id, system_id, model)),
                vehicles:event_log_vehicles!inner(vehicles(id, registration_number, model))
            `
      )
      .eq("id", reportId)
      .single();

    toast.dismiss(loadingToast);
    if (error || !data) {
      toast.error("Could not load report details.");
      console.error("Error fetching report details:", error);
    } else {
      setViewingReport(data as unknown as EventLog);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDate = new Date(report.created_at);
      const projectMatch =
        !projectFilter || report.project?.id === projectFilter;
      const userMatch = !userFilter || report.created_by?.id === userFilter;
      const startDateMatch =
        !startDateFilter || reportDate >= new Date(startDateFilter);
      const endDateMatch =
        !endDateFilter || reportDate <= new Date(endDateFilter);
      return projectMatch && userMatch && startDateMatch && endDateMatch;
    });
  }, [reports, projectFilter, userFilter, startDateFilter, endDateFilter]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);

  return (
    <>
      <CreateReportSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleReportTypeSelect}
      />
      <LogShiftReportModal
        isOpen={isShiftReportModalOpen}
        onClose={() => setIsShiftReportModalOpen(false)}
        onSuccess={() => router.refresh()}
        teamId={teamId}
        userId={userId}
        projects={projects}
        teamMembers={teamMembers}
        assets={assets}
        vehicles={vehicles}
      />
      <ShiftReportDetailModal
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Logs & Records</h1>
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create New Log</span>
            </button>
          </div>

          <div className="mb-4 p-4 bg-white rounded-lg shadow border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <h3 className="text-lg font-semibold col-span-1 md:col-span-4">
                Filter Reports
              </h3>
              <div>
                <label
                  htmlFor="projectFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Project
                </label>
                <select
                  id="projectFilter"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="userFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  User
                </label>
                <select
                  id="userFilter"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">All Users</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {`${m.first_name || ""} ${m.last_name || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="startDateFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDateFilter"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="endDateFilter"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="endDateFilter"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {report.log_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(report.start_time).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {report.project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {`${report.created_by?.first_name || ""} ${report.created_by?.last_name || ""}`.trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewReportDetails(report.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No reports match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredReports.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex justify-between items-center text-sm">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1 border rounded-md disabled:opacity-50"
              >
                <ChevronLeft size={16} className="mr-1" /> Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
