"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import { ProjectListItem, TeamMember, Asset, Vehicle } from "@/lib/types";

type LogShiftReportModalProps = {
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

export default function LogShiftReportModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  userId,
  projects,
  teamMembers,
  assets,
  vehicles,
}: LogShiftReportModalProps) {
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
      setProjectId(projects.length > 0 ? projects[0].id : "");
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        8,
        0
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        17,
        0
      );
      setStartTime(startOfDay.toISOString().substring(0, 16));
      setEndTime(endOfDay.toISOString().substring(0, 16));
      setWorkCompleted("");
      setNotes("");
      setPersonnel([userId]);
      setUsedAssets([]);
      setUsedVehicles([]);
    }
  }, [isOpen, projects, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: reportData, error: reportError } = await supabase
        .from("event_logs")
        .insert({
          team_id: teamId,
          project_id: projectId,
          created_by_id: userId,
          log_type: "Shift Report",
          start_time: startTime,
          end_time: endTime,
          work_completed: workCompleted,
          notes: notes || null,
        })
        .select("id")
        .single();

      if (reportError) throw reportError;
      const logId = reportData.id;

      // UPDATED: All linking records now include the team_id for security
      const personnelRecords = personnel.map((id) => ({
        log_id: logId,
        user_id: id,
        team_id: teamId,
      }));
      const assetRecords = usedAssets.map((id) => ({
        log_id: logId,
        asset_id: id,
        team_id: teamId,
      }));
      const vehicleRecords = usedVehicles.map((id) => ({
        log_id: logId,
        vehicle_id: id,
        team_id: teamId,
      }));

      const promises = [];
      if (personnelRecords.length > 0) {
        promises.push(
          supabase.from("event_log_personnel").insert(personnelRecords)
        );
      }
      if (assetRecords.length > 0) {
        promises.push(supabase.from("event_log_assets").insert(assetRecords));
      }
      if (vehicleRecords.length > 0) {
        promises.push(
          supabase.from("event_log_vehicles").insert(vehicleRecords)
        );
      }

      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.error) throw result.error;
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Core Details</h3>
          <FormField label="Project">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a project
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time">
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </FormField>
            <FormField label="End Time">
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>
        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Personnel & Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Personnel on Site">
              <select
                multiple
                value={personnel}
                onChange={(e) =>
                  setPersonnel(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
                className="h-32"
              >
                {teamMembers.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                  >{`${m.first_name} ${m.last_name}`}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Equipment Used">
              <select
                multiple
                value={usedAssets}
                onChange={(e) =>
                  setUsedAssets(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
                className="h-32"
              >
                {assets.map((a) => (
                  <option
                    key={a.id}
                    value={a.id}
                  >{`${a.system_id} - ${a.model}`}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Vehicles Used">
              <select
                multiple
                value={usedVehicles}
                onChange={(e) =>
                  setUsedVehicles(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
                className="h-32"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Work Summary</h3>
          <FormField label="Work Completed">
            <textarea
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              rows={6}
              required
            />
          </FormField>
          <FormField label="Notes (Optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
        <div className="flex justify-end pt-2">
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
