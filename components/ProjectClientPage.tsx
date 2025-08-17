"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ConfirmModal from "./ConfirmModal";
import {
  Project,
  RiskAssessmentListItem,
  DynamicRisk,
  EventLog,
  Task,
  TeamMember,
} from "@/lib/types";
import DynamicRiskLog from "./DynamicRiskLog";
import ProjectDetailsTab from "./ProjectDetailsTab";
import MethodStatementTab from "./MethodStatementTab";
import ProjectBriefTab from "./ProjectBriefTab";
import ViewReportModal from "./ViewReportModal";
import { toast } from "react-hot-toast";
import { Plus, AlertTriangle } from "react-feather";

type ProjectClientPageProps = {
  initialProject: Project;
  initialRiskAssessments: RiskAssessmentListItem[];
  initialDynamicRisks: DynamicRisk[];
  initialShiftReports: EventLog[];
  initialTasks: Task[];
  teamMembers: TeamMember[];
  currentUserId: string;
  currentUserRole: string;
};

export default function ProjectClientPage({
  initialProject,
  initialRiskAssessments,
  initialDynamicRisks,
  initialShiftReports,
  initialTasks,
  teamMembers,
  currentUserId,
  currentUserRole,
}: ProjectClientPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [riskAssessments, setRiskAssessments] = useState(
    initialRiskAssessments
  );
  const [dynamicRisks, setDynamicRisks] = useState(initialDynamicRisks);
  const [shiftReports, setShiftReports] = useState(initialShiftReports);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState("details");
  const [isRaModalOpen, setIsRaModalOpen] = useState(false);
  const [newRaName, setNewRaName] = useState("");
  const [newRaDescription, setNewRaDescription] = useState("");
  const [editingRa, setEditingRa] = useState<RiskAssessmentListItem | null>(
    null
  );
  const [deletingRa, setDeletingRa] = useState<RiskAssessmentListItem | null>(
    null
  );
  const [isDynamicRiskModalOpen, setIsDynamicRiskModalOpen] = useState(false);
  const [editingDynamicRisk, setEditingDynamicRisk] =
    useState<DynamicRisk | null>(null);
  const [deletingDynamicRiskId, setDeletingDynamicRiskId] = useState<
    number | null
  >(null);
  const [riskDescription, setRiskDescription] = useState("");
  const [personnelOnSite, setPersonnelOnSite] = useState("");
  const [controlsTaken, setControlsTaken] = useState("");
  const [safeToContinue, setSafeToContinue] = useState(true);
  const [riskStatus, setRiskStatus] = useState("Temporary");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);

  const isAdmin = currentUserRole === "team_admin";

  useEffect(() => {
    setProject(initialProject);
    setRiskAssessments(initialRiskAssessments);
    setDynamicRisks(initialDynamicRisks);
    setShiftReports(initialShiftReports);
    setTasks(initialTasks);
  }, [
    initialProject,
    initialRiskAssessments,
    initialDynamicRisks,
    initialShiftReports,
    initialTasks,
  ]);

  // ... all handler functions ...
  const openLogDynamicRiskModal = (risk: DynamicRisk | null) => {
    setEditingDynamicRisk(risk);
    if (!risk) {
      setRiskDescription("");
      setPersonnelOnSite("");
      setControlsTaken("");
      setSafeToContinue(true);
      setRiskStatus("Temporary");
    }
    setIsDynamicRiskModalOpen(true);
  };

  if (!project) return <p className="p-8">Project not found.</p>;

  const tabClass = (tabName: string) =>
    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tabName ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`;

  return (
    <>
      <ViewReportModal
        reportId={viewingReportId}
        onClose={() => setViewingReportId(null)}
      />
      {/* ... other modals ... */}
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-sm">
            <Link
              href="/dashboard/projects"
              className="text-blue-600 hover:underline"
            >
              All Projects
            </Link>
            <span className="mx-2 text-gray-500">&gt;</span>
            <span className="text-gray-700">{project.name}</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600">Ref: {project.reference || "N/A"}</p>
            </div>
            {/* ... buttons ... */}
          </div>

          <div className="border-b border-gray-200">
            <div className="overflow-x-auto no-scrollbar">
              <nav
                className="-mb-px flex space-x-8 flex-shrink-0"
                aria-label="Tabs"
              >
                <button
                  onClick={() => setActiveTab("details")}
                  className={tabClass("details")}
                >
                  Project Details
                </button>
                <button
                  onClick={() => setActiveTab("brief")}
                  className={tabClass("brief")}
                >
                  Brief & Tasks
                </button>
                <button
                  onClick={() => setActiveTab("method_statement")}
                  className={tabClass("method_statement")}
                >
                  Method Statement
                </button>
                <button
                  onClick={() => setActiveTab("risk_assessments")}
                  className={tabClass("risk_assessments")}
                >
                  Risk Assessments
                </button>
                <button
                  onClick={() => setActiveTab("shift_reports")}
                  className={tabClass("shift_reports")}
                >
                  Shift Reports
                </button>
                <button
                  onClick={() => setActiveTab("dynamic_risks")}
                  className={tabClass("dynamic_risks")}
                >
                  Dynamic Risk Log
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-8">
            {activeTab === "details" && (
              <ProjectDetailsTab
                project={project}
                onUpdate={(updatedProject) => setProject(updatedProject)}
                isCurrentUserAdmin={isAdmin}
                teamMembers={teamMembers}
              />
            )}
            {activeTab === "brief" && (
              <ProjectBriefTab
                project={project}
                initialTasks={tasks}
                isCurrentUserAdmin={isAdmin}
                onBriefUpdate={(updatedProject) => setProject(updatedProject)}
              />
            )}
            {activeTab === "method_statement" && (
              <MethodStatementTab
                project={project}
                onUpdate={(updatedProject) => setProject(updatedProject)}
                isCurrentUserAdmin={isAdmin}
              />
            )}
            {activeTab === "risk_assessments" && (
              <div className="bg-white p-6 rounded-lg shadow">
                {/* ... risk assessments tab content ... */}
              </div>
            )}
            {activeTab === "shift_reports" && (
              <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
                <h2 className="text-2xl font-bold mb-4">Shift Reports</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  {/* ... table content ... */}
                </table>
              </div>
            )}
            {activeTab === "dynamic_risks" && (
              <DynamicRiskLog
                risks={dynamicRisks}
                isCurrentUserAdmin={isAdmin}
                onEdit={openLogDynamicRiskModal}
                onDelete={(riskId) => setDeletingDynamicRiskId(riskId)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
