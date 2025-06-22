"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ConfirmModal from "./ConfirmModal";
import { Project, RiskAssessmentListItem, DynamicRisk } from "@/lib/types";
import DynamicRiskLog from "./DynamicRiskLog";
import ProjectDetailsTab from "./ProjectDetailsTab";
import MethodStatementTab from "./MethodStatementTab";
import { toast } from "react-hot-toast";
import { Plus, AlertTriangle, Trash2 } from "react-feather";

type ProjectClientPageProps = {
  initialProject: Project;
  initialRiskAssessments: RiskAssessmentListItem[];
  initialDynamicRisks: DynamicRisk[];
  currentUserId: string;
  currentUserRole: string;
};

export default function ProjectClientPage({
  initialProject,
  initialRiskAssessments,
  initialDynamicRisks,
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
  const [activeTab, setActiveTab] = useState("details");

  // State for RA Modal
  const [isRaModalOpen, setIsRaModalOpen] = useState(false);
  const [newRaName, setNewRaName] = useState("");
  const [newRaDescription, setNewRaDescription] = useState("");
  const [editingRa, setEditingRa] = useState<RiskAssessmentListItem | null>(
    null
  );
  const [deletingRa, setDeletingRa] = useState<RiskAssessmentListItem | null>(
    null
  );

  // State for Dynamic Risk Modal
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

  const isEditingRa = editingRa !== null;
  const isEditingDynamicRisk = editingDynamicRisk !== null;
  const isAdmin = currentUserRole === "team_admin";

  useEffect(() => {
    if (isEditingRa && editingRa) {
      setNewRaName(editingRa.name);
      setNewRaDescription(editingRa.description || "");
    }
  }, [isEditingRa, editingRa]);

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
    const { data, error } = isEditingRa
      ? await supabase
          .from("risk_assessments")
          .update(raData)
          .eq("id", editingRa!.id)
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
      toast.success(`RA ${isEditingRa ? "updated" : "created"} successfully!`);
      if (isEditingRa) {
        setRiskAssessments(
          riskAssessments.map((ra) => (ra.id === data.id ? data : ra))
        );
      } else {
        setRiskAssessments([data, ...riskAssessments]);
      }
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
    const { data: resultRisk, error } = isEditingDynamicRisk
      ? await supabase
          .from("dynamic_risks")
          .update(dynamicRiskData)
          .eq("id", editingDynamicRisk!.id)
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
        `Dynamic risk ${isEditingDynamicRisk ? "updated" : "logged"} successfully!`
      );
      const transformedRisk = {
        ...resultRisk,
        logged_by: Array.isArray(resultRisk.logged_by)
          ? resultRisk.logged_by[0]
          : resultRisk.logged_by,
      };
      if (isEditingDynamicRisk) {
        setDynamicRisks(
          dynamicRisks.map((r) =>
            r.id === transformedRisk.id ? transformedRisk : r
          ) as DynamicRisk[]
        );
      } else {
        setDynamicRisks([transformedRisk as DynamicRisk, ...dynamicRisks]);
      }
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

  if (!project) return <p className="p-8">Project not found.</p>;

  return (
    <>
      <Modal
        title={
          isEditingRa ? "Edit Risk Assessment" : "Create New Risk Assessment"
        }
        isOpen={isRaModalOpen}
        onClose={() => setIsRaModalOpen(false)}
      >
        <form onSubmit={handleRaSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="raName"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="raName"
              value={newRaName}
              onChange={(e) => setNewRaName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="raDesc"
              className="block text-sm font-medium text-gray-700"
            >
              Site & Risk Summary (Optional)
            </label>
            <textarea
              id="raDesc"
              value={newRaDescription}
              onChange={(e) => setNewRaDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g. This is a ballasted rail track..."
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsRaModalOpen(false)}
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              {isEditingRa ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        title={isEditingDynamicRisk ? "Edit Dynamic Risk" : "Log Dynamic Risk"}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving..." : "Log Risk"}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deletingRa !== null}
        onClose={() => setDeletingRa(null)}
        onConfirm={handleDeleteRa}
        title="Delete Risk Assessment"
        message={`Are you sure you want to delete "${deletingRa?.name}" and all of its entries? This cannot be undone.`}
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

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Projects
            </Link>
            <span className="mx-2 text-gray-500">&gt;</span>
            <span className="text-gray-700">{project.name}</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600">Ref: {project.reference || "N/A"}</p>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <button
              onClick={() => openLogDynamicRiskModal(null)}
              className="bg-orange-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-700 flex items-center"
            >
              <AlertTriangle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Log Dynamic Risk</span>
            </button>
            {isAdmin && (
              <button
                onClick={openCreateRaModal}
                className="bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New RA</span>
              </button>
            )}
          </div>

          <div className="border-b border-gray-200">
            <div className="overflow-x-auto">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`${activeTab === "details" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Project Details
                </button>
                <button
                  onClick={() => setActiveTab("method_statement")}
                  className={`${activeTab === "method_statement" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Method Statement
                </button>
                <button
                  onClick={() => setActiveTab("risk_assessments")}
                  className={`${activeTab === "risk_assessments" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Risk Assessments
                </button>
                <button
                  onClick={() => setActiveTab("dynamic_risks")}
                  className={`${activeTab === "dynamic_risks" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
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
                isCurrentUserAdmin={isAdmin}
              />
            )}
            {activeTab === "method_statement" && (
              <MethodStatementTab
                project={project}
                isCurrentUserAdmin={isAdmin}
              />
            )}
            {activeTab === "risk_assessments" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Risk Assessments</h2>
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
                          <h3 className="font-semibold text-lg text-blue-700 hover:underline">
                            {ra.name}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {ra.description}
                          </p>
                        </div>
                        <div className="flex items-center flex-shrink-0 ml-4">
                          <p className="text-xs text-gray-400 mr-4">
                            Created:{" "}
                            {new Date(ra.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          {isAdmin && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => openEditRaModal(ra)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingRa(ra)}
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
                    <h3 className="text-xl font-medium text-gray-700">
                      No risk assessments yet.
                    </h3>
                    {isAdmin && (
                      <p className="text-gray-500 mt-2">
                        Get started by creating your first RA for this project.
                      </p>
                    )}
                  </div>
                )}
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
