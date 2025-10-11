// AFTER
"use client";

import { DynamicRisk } from "@/lib/types";
import { Edit2, Trash2, AlertTriangle, Check, X } from "react-feather";

type DynamicRiskLogProps = {
  risks: DynamicRisk[];
  isCurrentUserAdmin: boolean;
  onLogDynamicRisk: () => void;
  onEdit: (risk: DynamicRisk) => void;
  onDelete: (riskId: number) => void;
};

export default function DynamicRiskLog({
  risks,
  isCurrentUserAdmin,
  onLogDynamicRisk,
  onEdit,
  onDelete,
}: DynamicRiskLogProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* The main header and button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dynamic Risk Log</h2>
        <button
          onClick={onLogDynamicRisk}
          className="bg-orange-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-orange-700 flex items-center"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Log New Risk
        </button>
      </div>

      {/* The list of risks, now directly inside the main container */}
      <div className="space-y-4">
        {risks.map((risk) => (
          <div
            key={risk.id}
            className="border p-4 rounded-md bg-orange-50 border-orange-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-orange-700">
                  Logged by{" "}
                  {`${risk.logged_by?.first_name || ""} ${risk.logged_by?.last_name || ""}`.trim()}{" "}
                  on {new Date(risk.logged_at).toLocaleString("en-GB")}
                </p>
                <p className="font-semibold mt-1">{risk.risk_description}</p>
              </div>
              {isCurrentUserAdmin && (
                <div className="flex space-x-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => onEdit(risk)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(risk.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-3 border-t pt-3 space-y-2">
              <div>
                <p className="text-xs font-bold">Control Measures Taken</p>
                <p className="text-sm">{risk.control_measures_taken}</p>
              </div>
              <div>
                <p className="text-xs font-bold">Personnel on Site</p>
                <p className="text-sm">{risk.personnel_on_site || "N/A"}</p>
              </div>
              <div className="flex items-center text-sm">
                {risk.is_safe_to_continue ? (
                  <Check size={16} className="mr-2 text-green-600" />
                ) : (
                  <X size={16} className="mr-2 text-red-600" />
                )}
                Is it safe to continue?{" "}
                <span className="font-semibold ml-2">
                  {risk.is_safe_to_continue ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        ))}
        {risks.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No dynamic risks have been logged for this project yet.
          </p>
        )}
      </div>
    </div>
  );
}
