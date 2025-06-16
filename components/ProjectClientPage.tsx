"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ConfirmModal from "./ConfirmModal";
import { Project, RiskAssessmentListItem, DynamicRisk } from "@/lib/types";
import DynamicRiskLog from "./DynamicRiskLog";
import { toast } from "react-hot-toast";

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
  const [project] = useState(initialProject);
  const [riskAssessments, setRiskAssessments] = useState(
    initialRiskAssessments
  );
  const [dynamicRisks, setDynamicRisks] = useState(initialDynamicRisks);
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
    /* ... no change ... */
  };
  const openEditRaModal = (ra: RiskAssessmentListItem) => {
    /* ... no change ... */
  };
  const handleRaSubmit = async (e: React.FormEvent) => {
    /* ... no change ... */
  };
  const handleDeleteRa = async () => {
    /* ... no change ... */
  };

  const openLogDynamicRiskModal = (risk: DynamicRisk | null) => {
    setEditingDynamicRisk(risk);
    if (risk) {
      // Pre-fill logic is now in useEffect
    } else {
      // Reset for new entry
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
      {/* ... RA and RA Delete Modals ... */}
      <Modal
        title={isEditingDynamicRisk ? "Edit Dynamic Risk" : "Log Dynamic Risk"}
        isOpen={isDynamicRiskModalOpen}
        onClose={() => setIsDynamicRiskModalOpen(false)}
      >
        <form onSubmit={handleLogDynamicRiskSubmit} className="space-y-4">
          {/* ... Dynamic Risk Form JSX from before ... */}
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deletingDynamicRiskId !== null}
        onClose={() => setDeletingDynamicRiskId(null)}
        onConfirm={handleDeleteDynamicRisk}
        title="Delete Dynamic Risk"
        message="Are you sure you want to permanently delete this logged risk?"
        confirmText="Delete"
        isDestructive={true}
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* ... Project Header and Tab Navigation ... */}
          <div className="flex justify-between items-start mb-4">
            {/* ... */}
            <div className="flex space-x-2 flex-shrink-0">
              {/* UPDATED: Pass null to indicate a new risk */}
              <button
                onClick={() => openLogDynamicRiskModal(null)}
                className="bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700"
              >
                Log Dynamic Risk
              </button>
              {isAdmin && (
                <button
                  onClick={openCreateRaModal}
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  + New Risk Assessment
                </button>
              )}
            </div>
          </div>
          {/* ... */}
          <div className="mt-8">
            {/* ... other tabs ... */}
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
