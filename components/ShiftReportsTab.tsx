"use client";

import { EventLog, Task } from "@/lib/types";

type ShiftReportsTabProps = {
  shiftReports: EventLog[];
  tasks: Task[];
  onViewReport: (reportId: string) => void;
};

export default function ShiftReportsTab({
  shiftReports,
  tasks,
  onViewReport,
}: ShiftReportsTabProps) {
  // Helper to determine the color for the variance
  const getVarianceColor = (estimate: number, actual: number) => {
    if (actual > estimate) return "text-red-600"; // Over budget
    if (actual === 0) return "text-gray-500";
    if (actual < estimate) return "text-green-600"; // Under budget
    return "text-blue-600"; // On budget
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Task Time Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Task Time Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Task Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estimated Shifts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actual Shifts Logged
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => {
                const estimate = task.duration_shifts || 0;
                const actual = task.actual_shifts_logged || 0;
                const variance = actual - estimate;
                return (
                  <tr key={task.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                      {task.title}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {estimate}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {actual}
                    </td>
                    <td
                      className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${getVarianceColor(estimate, actual)}`}
                    >
                      {variance > 0 ? `+${variance}` : variance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Shift Report History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Shift Report History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Date
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
              {shiftReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {report.log_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(report.start_time).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {`${report.created_by?.first_name || ""} ${report.created_by?.last_name || ""}`.trim()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewReport(report.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {shiftReports.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    No shift reports have been logged for this project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
