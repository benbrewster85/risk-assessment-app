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
import { toast } from "react-hot-toast";

// Import all tab components
import DynamicRiskLog from "./DynamicRiskLog";
import ProjectDetailsTab from "./ProjectDetailsTab";
import ProjectEstimateTab from "./ProjectEstimateTab";
import ProjectBriefTab from "./ProjectBriefTab";
import MethodStatementTab from "./MethodStatementTab";
import ProjectRisksTab from "./ProjectRisksTab"; // <-- NEW
import ViewReportModal from "./ViewReportModal";
import { Plus, AlertTriangle } from "react-feather";
import ShiftReportsTab from "./ShiftReportsTab";

type ProjectClientPageProps = {
  initialProject: Project;
  initialRiskAssessments: RiskAssessmentListItem[];
  initialDynamicRisks: DynamicRisk[];
  initialShiftReports: EventLog[];
  initialTasks: Task[];
  teamMembers: TeamMember[];
  currentUserId: string;
  currentUserRole: string;
  mapboxToken?: string;
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
  mapboxToken,
}: ProjectClientPageProps) {
  const supabase = createClient();
  const router = useRouter();

  // All your existing state is preserved
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

  // All your existing handler functions are preserved
  const handleProjectUpdate = (updatedProject: Project) =>
    setProject(updatedProject);
  const handleTasksUpdate = (newTasks: Task[]) => setTasks(newTasks);

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

  useEffect(() => {
    if (editingRa) {
      setNewRaName(editingRa.name);
      setNewRaDescription(editingRa.description || "");
    }
  }, [editingRa]);

  useEffect(() => {
    if (isDynamicRiskModalOpen && editingDynamicRisk) {
      setRiskDescription(editingDynamicRisk.risk_description);
      setPersonnelOnSite(editingDynamicRisk.personnel_on_site || "");
      setControlsTaken(editingDynamicRisk.control_measures_taken);
      setSafeToContinue(editingDynamicRisk.is_safe_to_continue);
      setRiskStatus(editingDynamicRisk.risk_status || "Temporary");
    }
  }, [isDynamicRiskModalOpen, editingDynamicRisk]);

  const openCreateRaModal = () => {
    setEditingRa(null);
    setNewRaName("");
    setNewRaDescription("");
    setIsRaModalOpen(true);
  };
  const openEditRaModal = (ra: RiskAssessmentListItem) => {
    setEditingRa(ra);
    setIsRaModalOpen(true);
  };

  const handleRaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaName) {
      toast.error("Risk Assessment name is required.");
      return;
    }
    const raData = {
      name: newRaName,
      description: newRaDescription || null,
      project_id: project.id,
      team_id: project.team_id,
    };
    const { data, error } = editingRa
      ? await supabase
          .from("risk_assessments")
          .update(raData)
          .eq("id", editingRa.id)
          .select()
          .single()
      : await supabase
          .from("risk_assessments")
          .insert(raData)
          .select()
          .single();
    if (error) {
      toast.error(`Failed to save RA: ${error.message}`);
    } else if (data) {
      toast.success(`RA ${editingRa ? "updated" : "created"} successfully!`);
      setRiskAssessments(
        editingRa
          ? riskAssessments.map((ra) => (ra.id === data.id ? data : ra))
          : [data, ...riskAssessments]
      );
      setIsRaModalOpen(false);
    }
  };

  const handleDeleteRa = async () => {
    if (!deletingRa) return;
    const { error } = await supabase
      .from("risk_assessments")
      .delete()
      .eq("id", deletingRa.id);
    if (error) {
      toast.error(`Failed to delete RA: ${error.message}`);
    } else {
      toast.success("Risk Assessment deleted.");
      setRiskAssessments(
        riskAssessments.filter((ra) => ra.id !== deletingRa.id)
      );
    }
    setDeletingRa(null);
  };

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

  const handleLogDynamicRiskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dynamicRiskData = {
      project_id: project.id,
      team_id: project.team_id,
      logged_by_user_id: currentUserId,
      risk_description: riskDescription,
      personnel_on_site: personnelOnSite,
      control_measures_taken: controlsTaken,
      is_safe_to_continue: safeToContinue,
      risk_status: riskStatus,
    };
    const { data: resultRisk, error } = editingDynamicRisk
      ? await supabase
          .from("dynamic_risks")
          .update(dynamicRiskData)
          .eq("id", editingDynamicRisk.id)
          .select("*, logged_by:profiles(first_name, last_name)")
          .single()
      : await supabase
          .from("dynamic_risks")
          .insert(dynamicRiskData)
          .select("*, logged_by:profiles(first_name, last_name)")
          .single();

    if (error) {
      toast.error(`Error saving dynamic risk: ${error.message}`);
    } else if (resultRisk) {
      toast.success(
        `Dynamic risk ${editingDynamicRisk ? "updated" : "logged"} successfully!`
      );
      const transformedRisk = {
        ...resultRisk,
        logged_by: Array.isArray(resultRisk.logged_by)
          ? resultRisk.logged_by[0]
          : resultRisk.logged_by,
      };
      setDynamicRisks(
        editingDynamicRisk
          ? dynamicRisks.map((r) =>
              r.id === transformedRisk.id ? transformedRisk : r
            )
          : [transformedRisk, ...dynamicRisks]
      );
      setIsDynamicRiskModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteDynamicRisk = async () => {
    if (!deletingDynamicRiskId) return;
    const { error } = await supabase
      .from("dynamic_risks")
      .delete()
      .eq("id", deletingDynamicRiskId);
    if (error) {
      toast.error(`Failed to delete dynamic risk: ${error.message}`);
    } else {
      toast.success("Dynamic risk deleted.");
      setDynamicRisks(
        dynamicRisks.filter((r) => r.id !== deletingDynamicRiskId)
      );
    }
    setDeletingDynamicRiskId(null);
  };

  const tabClass = (tabName: string) =>
    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tabName ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`;

  // ### The New Tabs Array ###
  // All your tab content is now defined here.
  const tabs = [
    {
      key: "details",
      name: "Project Details",
      component: (
        <ProjectDetailsTab
          project={project}
          onUpdate={setProject}
          isCurrentUserAdmin={isAdmin}
          teamMembers={teamMembers}
          mapboxToken={mapboxToken}
        />
      ),
    },
    {
      key: "estimate",
      name: "Estimate",
      component: (
        <ProjectEstimateTab
          project={project}
          tasks={tasks}
          isCurrentUserAdmin={isAdmin}
          onTasksUpdate={setTasks}
        />
      ),
    },
    {
      key: "brief",
      name: "Brief & Tasks",
      component: (
        <ProjectBriefTab
          project={project}
          initialTasks={tasks}
          isCurrentUserAdmin={isAdmin}
          onBriefUpdate={setProject}
        />
      ),
    },
    {
      key: "method_statement",
      name: "Method Statement",
      component: (
        <MethodStatementTab
          project={project}
          onUpdate={setProject}
          isCurrentUserAdmin={isAdmin}
        />
      ),
    },
    // --- NEW COMBINED TAB ---
    {
      key: "risks",
      name: "Risks",
      component: (
        <ProjectRisksTab
          riskAssessments={riskAssessments}
          dynamicRisks={dynamicRisks}
          isCurrentUserAdmin={isAdmin}
          onAddRa={openCreateRaModal}
          onEditRa={openEditRaModal}
          onDeleteRa={(ra) => setDeletingRa(ra)}
          onLogDynamicRisk={() => openLogDynamicRiskModal(null)}
          onEditDynamicRisk={openLogDynamicRiskModal}
          onDeleteDynamicRisk={(id) => setDeletingDynamicRiskId(id)}
        />
      ),
    },

    {
      key: "shift_reports",
      name: "Shift Reports",
      component: (
        <ShiftReportsTab
          shiftReports={shiftReports}
          tasks={tasks}
          onViewReport={(id) => setViewingReportId(id)}
        />
      ),
    },
    // --- OLD TABS REMOVED ---
  ];

  const activeTabComponent = tabs.find(
    (tab) => tab.key === activeTab
  )?.component;

  if (!project) return <p className="p-8">Project not found.</p>;

  return (
    <>
      {/* All your modals are preserved */}
      <ViewReportModal
        reportId={viewingReportId}
        onClose={() => setViewingReportId(null)}
      />
      <Modal
        title={
          editingRa ? "Edit Risk Assessment" : "Create New Risk Assessment"
        }
        isOpen={isRaModalOpen}
        onClose={() => setIsRaModalOpen(false)}
      >
        <form onSubmit={handleRaSubmit} className="space-y-4">
          <div>
            <label htmlFor="raName" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="raName"
              type="text"
              value={newRaName}
              onChange={(e) => setNewRaName(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="raDesc" className="block text-sm font-medium">
              Site & Risk Summary (Optional)
            </label>
            <textarea
              id="raDesc"
              value={newRaDescription}
              onChange={(e) => setNewRaDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full"
              placeholder="e.g. This is a ballasted rail track..."
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsRaModalOpen(false)}
              className="mr-2 py-2 px-4 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              {editingRa ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        title={editingDynamicRisk ? "Edit Dynamic Risk" : "Log Dynamic Risk"}
        isOpen={isDynamicRiskModalOpen}
        onClose={() => setIsDynamicRiskModalOpen(false)}
      >
        <form onSubmit={handleLogDynamicRiskSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Description of New Risk
            </label>
            <textarea
              value={riskDescription}
              onChange={(e) => setRiskDescription(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Control Measures Taken
            </label>
            <textarea
              value={controlsTaken}
              onChange={(e) => setControlsTaken(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Personnel on Site
            </label>
            <input
              type="text"
              value={personnelOnSite}
              onChange={(e) => setPersonnelOnSite(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Is it safe to continue?
              </label>
              <select
                value={String(safeToContinue)}
                onChange={(e) => setSafeToContinue(e.target.value === "true")}
                className="mt-1 block w-full"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Risk Status</label>
              <select
                value={riskStatus}
                onChange={(e) => setRiskStatus(e.target.value)}
                className="mt-1 block w-full"
              >
                <option>Temporary</option>
                <option>Permanent</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsDynamicRiskModalOpen(false)}
              className="mr-2 py-2 px-4 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Logging..." : "Log Risk"}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deletingRa !== null}
        onClose={() => setDeletingRa(null)}
        onConfirm={handleDeleteRa}
        title="Delete Risk Assessment"
        message={`Are you sure you want to delete "${deletingRa?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
      <ConfirmModal
        isOpen={deletingDynamicRiskId !== null}
        onClose={() => setDeletingDynamicRiskId(null)}
        onConfirm={handleDeleteDynamicRisk}
        title="Delete Dynamic Risk"
        message="Are you sure you want to permanently delete this logged risk?"
        isDestructive={true}
        confirmText="Delete"
      />

      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header section is preserved */}
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
            {/* --- BUTTONS REMOVED FROM HERE --- */}
          </div>

          {/* Tab navigation is now mapped from the array */}
          <div className="border-b border-gray-200">
            <div className="overflow-x-auto no-scrollbar">
              <nav
                className="-mb-px flex space-x-8 flex-shrink-0"
                aria-label="Tabs"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={tabClass(tab.key)}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-8">{activeTabComponent}</div>
        </div>
      </div>
    </>
  );
}
