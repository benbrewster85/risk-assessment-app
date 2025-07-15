"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { ProjectListItem, TeamMember, Asset, Vehicle } from "@/lib/types";

type CreateShiftReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  userId: string;
  projects: ProjectListItem[];
  teamMembers: TeamMember[];
  assets: Asset[];
  vehicles: Vehicle[];
};

export default function CreateShiftReportModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  userId,
  projects,
  teamMembers,
  assets,
  vehicles,
}: CreateShiftReportModalProps) {
  const supabase = createClient();
  const [projectId, setProjectId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");
  const [notes, setNotes] = useState("");
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [usedAssets, setUsedAssets] = useState<string[]>([]);
  const [usedVehicles, setUsedVehicles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setProjectId(projects[0]?.id || "");
      const now = new Date();
      setStartTime(now.toISOString().substring(0, 16));
      setEndTime(now.toISOString().substring(0, 16));
      setWorkCompleted("");
      setNotes("");
      setPersonnel([userId]); // Default to including the current user
      setUsedAssets([]);
      setUsedVehicles([]);
    }
  }, [isOpen, projects, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Insert the main shift report record
      const { data: reportData, error: reportError } = await supabase
        .from("shift_reports")
        .insert({
          team_id: teamId,
          project_id: projectId,
          created_by_id: userId,
          start_time: startTime,
          end_time: endTime,
          work_completed: workCompleted,
          notes: notes,
        })
        .select("id")
        .single();

      if (reportError) throw reportError;
      const reportId = reportData.id;

      // 2. Insert linked records for personnel, assets, and vehicles
      const personnelRecords = personnel.map((id) => ({
        report_id: reportId,
        user_id: id,
      }));
      const assetRecords = usedAssets.map((id) => ({
        report_id: reportId,
        asset_id: id,
      }));
      const vehicleRecords = usedVehicles.map((id) => ({
        report_id: reportId,
        vehicle_id: id,
      }));

      if (personnelRecords.length > 0) {
        const { error } = await supabase
          .from("shift_report_personnel")
          .insert(personnelRecords);
        if (error) throw error;
      }
      if (assetRecords.length > 0) {
        const { error } = await supabase
          .from("shift_report_assets")
          .insert(assetRecords);
        if (error) throw error;
      }
      if (vehicleRecords.length > 0) {
        const { error } = await supabase
          .from("shift_report_vehicles")
          .insert(vehicleRecords);
        if (error) throw error;
      }

      toast.success("Shift Report created successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to create report: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Create New Shift Report" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selection */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium">
            Project
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="mt-1 block w-full"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {/* Start/End Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime">Start Time</label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="endTime">End Time</label>
            <input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
        {/* Personnel Multi-Select */}
        <div>
          <label htmlFor="personnel" className="block text-sm font-medium">
            Personnel on Site
          </label>
          <select
            id="personnel"
            multiple
            value={personnel}
            onChange={(e) =>
              setPersonnel(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className="mt-1 block w-full h-32"
          >
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>
        </div>
        {/* Work Completed */}
        <div>
          <label htmlFor="workCompleted">Work Completed</label>
          <textarea
            id="workCompleted"
            value={workCompleted}
            onChange={(e) => setWorkCompleted(e.target.value)}
            rows={5}
            required
          />
        </div>
        {/* Assets Used */}
        <div>
          <label htmlFor="assets" className="block text-sm font-medium">
            Equipment Used
          </label>
          <select
            id="assets"
            multiple
            value={usedAssets}
            onChange={(e) =>
              setUsedAssets(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className="mt-1 block w-full h-32"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.system_id} - {a.model}
              </option>
            ))}
          </select>
        </div>
        {/* Vehicles Used */}
        <div>
          <label htmlFor="vehicles" className="block text-sm font-medium">
            Vehicles Used
          </label>
          <select
            id="vehicles"
            multiple
            value={usedVehicles}
            onChange={(e) =>
              setUsedVehicles(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className="mt-1 block w-full h-24"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration_number}
              </option>
            ))}
          </select>
        </div>
        {/* Notes */}
        <div>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 py-2 px-4 border rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Create Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
