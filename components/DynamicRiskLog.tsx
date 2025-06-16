"use client";

import { DynamicRisk } from "@/lib/types";

type DynamicRiskLogProps = {
  risks: DynamicRisk[];
  isCurrentUserAdmin: boolean;
  onEdit: (risk: DynamicRisk) => void;
  onDelete: (riskId: number) => void;
};

export default function DynamicRiskLog({
  risks,
  isCurrentUserAdmin,
  onEdit,
  onDelete,
}: DynamicRiskLogProps) {
  if (risks.length === 0) {
    return (
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Dynamic Risk Log</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-center">
            No dynamic risks have been logged for this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Dynamic Risk Log</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {risks.map((risk) => {
          const loggerName =
            `${risk.logged_by?.first_name || ""} ${risk.logged_by?.last_name || ""}`.trim() ||
            "Unknown User";
          return (
            <div
              key={risk.id}
              className="border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">
                  Logged by {loggerName} on{" "}
                  {new Date(risk.logged_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {isCurrentUserAdmin && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onEdit(risk)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(risk.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="font-semibold mt-2">{risk.risk_description}</p>
              <p className="text-sm mt-2">
                <span className="font-semibold">Controls Taken:</span>{" "}
                {risk.control_measures_taken}
              </p>
              <div className="text-sm mt-2">
                Status:{" "}
                <span className="font-semibold">{risk.risk_status}</span> | Safe
                to Continue:{" "}
                <span
                  className={`font-semibold ${risk.is_safe_to_continue ? "text-green-600" : "text-red-600"}`}
                >
                  {risk.is_safe_to_continue ? "Yes" : "No"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
