"use client";

import { DynamicRisk } from "@/lib/types";

type DynamicRiskLogProps = {
  risks: DynamicRisk[];
};

export default function DynamicRiskLog({ risks }: DynamicRiskLogProps) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Dynamic Risk Log</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {risks.length > 0 ? (
          risks.map((risk) => {
            // CORRECTED: Display name logic updated
            const loggerName =
              `${risk.logged_by?.first_name || ""} ${
                risk.logged_by?.last_name || ""
              }`.trim() || "Unknown User";
            return (
              <div
                key={risk.id}
                className="border-b pb-4 last:border-b-0 last:pb-0"
              >
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
                <p className="font-semibold mt-2">{risk.risk_description}</p>
                <p className="text-sm mt-2">
                  <span className="font-semibold">Controls Taken:</span>{" "}
                  {risk.control_measures_taken}
                </p>
                <div className="text-sm mt-2">
                  Status:{" "}
                  <span className="font-semibold">{risk.risk_status}</span> |
                  Safe to Continue:{" "}
                  <span
                    className={`font-semibold ${
                      risk.is_safe_to_continue
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {risk.is_safe_to_continue ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">
            No dynamic risks have been logged for this project.
          </p>
        )}
      </div>
    </div>
  );
}
