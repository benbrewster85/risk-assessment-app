"use client";

import { useRouter } from "next/navigation";
import { RiskAssessmentListItem, DynamicRisk } from "@/lib/types";
import { Plus, Edit2, Trash2, AlertTriangle } from "react-feather";
import DynamicRiskLog from "./DynamicRiskLog"; // We'll still use this component

type ProjectRisksTabProps = {
  riskAssessments: RiskAssessmentListItem[];
  dynamicRisks: DynamicRisk[];
  isCurrentUserAdmin: boolean;
  // Handlers for Risk Assessments
  onAddRa: () => void;
  onEditRa: (ra: RiskAssessmentListItem) => void;
  onDeleteRa: (ra: RiskAssessmentListItem) => void;
  // Handlers for Dynamic Risks
  onLogDynamicRisk: () => void;
  onEditDynamicRisk: (risk: DynamicRisk) => void;
  onDeleteDynamicRisk: (riskId: number) => void;
};

export default function ProjectRisksTab({
  riskAssessments,
  dynamicRisks,
  isCurrentUserAdmin,
  onAddRa,
  onEditRa,
  onDeleteRa,
  onLogDynamicRisk,
  onEditDynamicRisk,
  onDeleteDynamicRisk,
}: ProjectRisksTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Section 1: Risk Assessments */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Risk Assessments</h2>
          {isCurrentUserAdmin && (
            <button
              onClick={onAddRa}
              className="bg-green-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New RA
            </button>
          )}
        </div>
        {riskAssessments.length > 0 ? (
          <div className="space-y-4">
            {riskAssessments.map((ra) => (
              <div
                key={ra.id}
                className="border p-4 rounded-md hover:bg-gray-50 flex justify-between items-center"
              >
                <div
                  onClick={() => router.push(`/dashboard/ra/${ra.id}`)}
                  className="flex-grow cursor-pointer"
                >
                  <h3 className="font-semibold text-lg text-blue-700">
                    {ra.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {ra.description}
                  </p>
                </div>
                <div className="flex items-center flex-shrink-0 ml-4">
                  <p className="text-xs text-gray-400 mr-4">
                    Created:{" "}
                    {new Date(ra.created_at).toLocaleDateString("en-GB")}
                  </p>
                  {isCurrentUserAdmin && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onEditRa(ra)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteRa(ra)}
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
            <h3 className="text-xl font-medium">No risk assessments yet.</h3>
            {isCurrentUserAdmin && (
              <p className="text-gray-500 mt-2">
                Get started by creating your first RA for this project.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Dynamic Risk Log */}
      {/* Section 2: Dynamic Risk Log */}
      <DynamicRiskLog
        risks={dynamicRisks}
        isCurrentUserAdmin={isCurrentUserAdmin}
        onLogDynamicRisk={onLogDynamicRisk} // Pass this handler down
        onEdit={onEditDynamicRisk}
        onDelete={onDeleteDynamicRisk}
      />
    </div>
  );
}
