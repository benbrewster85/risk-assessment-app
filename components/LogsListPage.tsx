"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShiftReport,
  ProjectListItem,
  TeamMember,
  Asset,
  Vehicle,
} from "@/lib/types";
import CreateShiftReportModal from "./CreateShiftReportModal";
import { Plus } from "react-feather";

type LogsListPageProps = {
  initialReports: ShiftReport[];
  projects: ProjectListItem[];
  teamMembers: TeamMember[];
  assets: Asset[];
  vehicles: Vehicle[];
  teamId: string;
  userId: string;
};

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
  const [reports, setReports] = useState(initialReports);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CreateShiftReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        teamId={teamId}
        userId={userId}
        projects={projects}
        teamMembers={teamMembers}
        assets={assets}
        vehicles={vehicles}
      />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Logs & Records</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Shift Report</span>
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Created By
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(report.start_time).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {`${report.created_by?.first_name || ""} ${report.created_by?.last_name || ""}`.trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/logs/${report.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-8">
                      No reports have been created yet.
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
