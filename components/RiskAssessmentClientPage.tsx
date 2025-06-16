"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import AddRaEntryModal from "@/components/AddRaEntryModal";
import SignatoryManager from "./SignatoryManager";
import ConfirmModal from "./ConfirmModal";
import {
  RiskAssessment,
  RaEntry,
  TeamMember,
  Signatory,
  Signature,
} from "@/lib/types";
import { convertToCsv } from "@/lib/export";
import { toast } from "react-hot-toast";

const getRiskColor = (score: number) => {
  if (score >= 15) return "bg-red-200";
  if (score >= 9) return "bg-orange-200";
  if (score >= 5) return "bg-yellow-200";
  return "bg-green-200";
};

type RiskAssessmentClientPageProps = {
  initialRa: RiskAssessment;
  initialEntries: RaEntry[];
  teamMembers: TeamMember[];
  initialSignatories: Signatory[];
  initialSignatures: Signature[];
  currentUserId: string;
  currentUserRole: string;
};

export default function RiskAssessmentClientPage({
  initialRa,
  initialEntries,
  teamMembers,
  initialSignatories,
  initialSignatures,
  currentUserId,
  currentUserRole,
}: RiskAssessmentClientPageProps) {
  const supabase = createClient();
  const [ra] = useState(initialRa);
  const [entries, setEntries] = useState(initialEntries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RaEntry | null>(null);
  const [signatories, setSignatories] = useState(initialSignatories);
  const [signatures, setSignatures] = useState(initialSignatures);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const isCurrentUserAdmin = currentUserRole === "team_admin";

  const refreshSignatureData = useCallback(async () => {
    if (!ra) return;
    const [signatoriesResult, signaturesResult] = await Promise.all([
      supabase.from("ra_signatories").select("user_id").eq("ra_id", ra.id),
      supabase
        .from("ra_signatures")
        .select("user_id, signed_at")
        .eq("ra_id", ra.id),
    ]);
    if (signatoriesResult.data) setSignatories(signatoriesResult.data);
    if (signaturesResult.data) setSignatures(signaturesResult.data);
  }, [ra, supabase]);

  useEffect(() => {
    setSignatories(initialSignatories);
    setSignatures(initialSignatures);
  }, [initialSignatories, initialSignatures]);

  const handleEditClick = (entry: RaEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };
  const handleAddNewClick = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async () => {
    if (deletingEntryId === null) return;
    const { error } = await supabase
      .from("ra_entries")
      .delete()
      .eq("id", deletingEntryId);
    if (error) {
      toast.error(`Failed to delete entry: ${error.message}`);
    } else {
      toast.success("Entry deleted.");
      setEntries((currentEntries) =>
        currentEntries.filter((e) => e.id !== deletingEntryId)
      );
    }
    setDeletingEntryId(null);
  };

  const handleSuccess = (resultEntry: RaEntry) => {
    const transformedEntry = {
      ...resultEntry,
      hazard: Array.isArray(resultEntry.hazard)
        ? resultEntry.hazard[0]
        : resultEntry.hazard,
      risk: Array.isArray(resultEntry.risk)
        ? resultEntry.risk[0]
        : resultEntry.risk,
    };
    if (editingEntry) {
      setEntries((currentEntries) =>
        currentEntries.map((e) =>
          e.id === transformedEntry.id ? transformedEntry : e
        )
      );
    } else {
      setEntries((currentEntries) => [...currentEntries, transformedEntry]);
    }
    setEditingEntry(null);
  };

  const handleExport = () => {
    if (!ra) return;
    const csvData = convertToCsv(entries);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const safeRaName = ra.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const dateStamp = new Date().toISOString().split("T")[0];
    link.setAttribute(
      "download",
      `${safeRaName}_risk_assessment_${dateStamp}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ra) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <>
      {isCurrentUserAdmin && (
        <AddRaEntryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          raId={ra.id}
          teamId={ra.project.team_id}
          onSuccess={handleSuccess}
          entryToEdit={editingEntry}
        />
      )}
      <ConfirmModal
        isOpen={deletingEntryId !== null}
        onClose={() => setDeletingEntryId(null)}
        onConfirm={handleDeleteClick}
        title="Delete Entry"
        message="Are you sure you want to permanently delete this entry?"
        confirmText="Delete"
        isDestructive={true}
      />
      <div className="p-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-6 text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Projects
            </Link>
            <span className="mx-2 text-gray-500">&gt;</span>
            <Link
              href={`/dashboard/project/${ra.project.id}`}
              className="text-blue-600 hover:underline"
            >
              {ra.project.name}
            </Link>
            <span className="mx-2 text-gray-500">&gt;</span>
            <span className="text-gray-700">{ra.name}</span>
          </div>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold">{ra.name}</h1>
              <p className="text-gray-600 mt-2 max-w-3xl whitespace-pre-wrap">
                {ra.description}
              </p>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              {/* THIS BUTTON/LINK IS NOW RESTORED */}
              <Link
                href={`/dashboard/ra/${ra.id}/report`}
                className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700"
              >
                View Report
              </Link>
              <button
                onClick={handleExport}
                className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Export to CSV
              </button>
              {isCurrentUserAdmin && (
                <button
                  onClick={handleAddNewClick}
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  + Add New Entry
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Activity / Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Hazard
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Risk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Who is Affected?
                  </th>
                  <th
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    title="Initial Likelihood"
                  >
                    IL
                  </th>
                  <th
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    title="Initial Impact"
                  >
                    II
                  </th>
                  <th
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    title="Initial Risk"
                  >
                    IR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Control Measures
                  </th>
                  <th
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    title="Resultant Likelihood"
                  >
                    RL
                  </th>
                  <th
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    title="Resultant Impact"
                  >
                    RI
                  </th>
                  <th
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    title="Resultant Risk"
                  >
                    RR
                  </th>
                  {isCurrentUserAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.length > 0 ? (
                  entries.map((entry) => {
                    const initialRisk =
                      entry.initial_likelihood * entry.initial_impact;
                    const resultantRisk =
                      entry.resultant_likelihood * entry.resultant_impact;
                    return (
                      <tr key={entry.id}>
                        <td className="px-4 py-4 whitespace-pre-wrap text-sm">
                          {entry.task_description}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {entry.hazard?.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {entry.risk?.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {entry.person_affected}
                        </td>
                        <td className="px-2 py-4 text-center text-sm">
                          {entry.initial_likelihood}
                        </td>
                        <td className="px-2 py-4 text-center text-sm">
                          {entry.initial_impact}
                        </td>
                        <td
                          className={`px-2 py-4 text-center text-sm font-bold ${getRiskColor(initialRisk)}`}
                        >
                          {initialRisk}
                        </td>
                        <td className="px-4 py-4 whitespace-pre-wrap text-sm">
                          {entry.control_measures}
                        </td>
                        <td className="px-2 py-4 text-center text-sm">
                          {entry.resultant_likelihood}
                        </td>
                        <td className="px-2 py-4 text-center text-sm">
                          {entry.resultant_impact}
                        </td>
                        <td
                          className={`px-2 py-4 text-center text-sm font-bold ${getRiskColor(resultantRisk)}`}
                        >
                          {resultantRisk}
                        </td>
                        {isCurrentUserAdmin && (
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditClick(entry)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingEntryId(entry.id)}
                              className="ml-4 text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={isCurrentUserAdmin ? 12 : 11}
                      className="text-center py-12 text-gray-500"
                    >
                      This Risk Assessment is empty. Start by adding a new
                      entry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <SignatoryManager
            raId={ra.id}
            teamId={ra.project.team_id}
            currentUserId={currentUserId}
            isCurrentUserAdmin={isCurrentUserAdmin}
            teamMembers={teamMembers}
            initialSignatories={signatories}
            initialSignatures={signatures}
            onUpdate={refreshSignatureData}
          />
        </div>
      </div>
    </>
  );
}
