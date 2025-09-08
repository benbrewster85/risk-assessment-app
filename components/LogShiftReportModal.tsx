"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import FormField from "./FormField";
import {
  ProjectListItem,
  TeamMember,
  Asset,
  Vehicle,
  Task,
  AssetCategory,
} from "@/lib/types";
import Select, { OnChangeValue } from "react-select";

type OptionType = { value: string; label: string };

type TaskUpdate = {
  taskId: string;
  title: string;
  status: "Not Started" | "In Progress" | "Completed";
  progress: number;
  initialProgress: number;
};

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
  const [personnel, setPersonnel] = useState<readonly OptionType[]>([]);
  const [usedAssets, setUsedAssets] = useState<readonly OptionType[]>([]);
  const [usedVehicles, setUsedVehicles] = useState<readonly OptionType[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberOptions = useMemo(
    () =>
      teamMembers.map((m) => ({
        value: m.id,
        label: `${m.first_name} ${m.last_name}`,
      })),
    [teamMembers]
  );
  const assetOptions = useMemo(() => {
    return assets
      .filter((a) => a.asset_categories?.asset_category_class === "Primary")
      .map((a) => ({
        value: a.id,
        label: `${a.system_id} - ${a.model}`,
      }));
  }, [assets]);
  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: v.registration_number })),
    [vehicles]
  );

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects[0]?.id || "");
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
      const currentUserOption = memberOptions.find((m) => m.value === userId);
      setPersonnel(currentUserOption ? [currentUserOption] : []);
      setUsedAssets([]);
      setUsedVehicles([]);
      setTaskUpdates([]);
    }
  }, [isOpen, projects, userId, memberOptions]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) {
        setTaskUpdates([]);
        return;
      }
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      if (data) {
        setTaskUpdates(
          data.map((task) => ({
            taskId: task.id,
            title: task.title,
            status: task.status,
            progress: task.progress,
            initialProgress: task.progress,
          }))
        );
      }
    };
    fetchTasks();
  }, [projectId, supabase]);

  const handleTaskUpdate = (taskId: string, newProgress: number) => {
    setTaskUpdates((currentUpdates) =>
      currentUpdates.map((task) => {
        if (task.taskId === taskId) {
          const updatedTask = { ...task, progress: newProgress };
          if (newProgress >= 100) {
            updatedTask.progress = 100;
            updatedTask.status = "Completed";
          } else if (newProgress > 0) {
            updatedTask.status = "In Progress";
          } else {
            updatedTask.progress = 0;
            updatedTask.status = "Not Started";
          }
          return updatedTask;
        }
        return task;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("--- DEBUG: Starting Report Submission ---");
    try {
      console.log("DEBUG Step 1: Inserting into event_logs...");
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
      console.log("DEBUG Step 1 Result:", { reportData, reportError });
      if (reportError)
        throw new Error(
          `Failed at Step 1 (Main Report): ${reportError.message}`
        );
      const logId = reportData.id;

      const promises = [];
      if (personnel.length > 0) {
        const personnelRecords = personnel.map((p) => ({
          log_id: logId,
          user_id: p.value,
          team_id: teamId,
        }));
        console.log("DEBUG Step 2: Inserting personnel...", personnelRecords);
        promises.push(
          supabase.from("event_log_personnel").insert(personnelRecords)
        );
      }
      if (usedAssets.length > 0) {
        const assetRecords = usedAssets.map((a) => ({
          log_id: logId,
          asset_id: a.value,
          team_id: teamId,
        }));
        console.log("DEBUG Step 3: Inserting assets...", assetRecords);
        promises.push(supabase.from("event_log_assets").insert(assetRecords));
      }
      if (usedVehicles.length > 0) {
        const vehicleRecords = usedVehicles.map((v) => ({
          log_id: logId,
          vehicle_id: v.value,
          team_id: teamId,
        }));
        console.log("DEBUG Step 4: Inserting vehicles...", vehicleRecords);
        promises.push(
          supabase.from("event_log_vehicles").insert(vehicleRecords)
        );
      }
      if (taskUpdates.length > 0) {
        const taskLogRecords = taskUpdates.map((t) => ({
          log_id: logId,
          task_id: t.taskId,
          team_id: teamId,
          status_on_report: t.status,
          progress_on_report: t.progress,
          progress_at_shift_start: t.initialProgress,
        }));
        console.log("DEBUG Step 5: Inserting task logs...", taskLogRecords);
        promises.push(supabase.from("event_log_tasks").insert(taskLogRecords));

        for (const task of taskUpdates) {
          if (task.progress !== task.initialProgress) {
            console.log(`DEBUG Step 6: Updating task ${task.taskId}...`);
            promises.push(
              supabase.rpc("update_task_progress", {
                p_task_id: task.taskId,
                p_new_status: task.status,
                p_new_progress: task.progress,
                p_team_id: teamId,
              })
            );
          }
        }
      }

      const results = await Promise.all(promises);
      console.log("DEBUG Final Step: All promises resolved. Results:", results);
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
      console.error("--- DEBUG: SUBMISSION FAILED ---");
      console.error("Full error object:", error);
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
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {taskUpdates.length > 0 && (
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-3">Task Progress</h3>
            <div className="space-y-4">
              {taskUpdates.map((task) => (
                <div key={task.taskId} className="p-3 bg-slate-50 rounded-md">
                  <p className="font-medium">{task.title}</p>
                  <div className="mt-2">
                    <FormField label={`Progress (${task.status})`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          value={task.progress}
                          onChange={(e) =>
                            handleTaskUpdate(
                              task.taskId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                          max="100"
                          step="10"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-semibold text-sm w-12 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Personnel & Equipment</h3>
          <FormField label="Personnel on Site">
            <Select
              isMulti
              value={personnel}
              onChange={(selected) =>
                setPersonnel(selected as OnChangeValue<OptionType, true>)
              }
              options={memberOptions}
            />
          </FormField>
          <FormField label="Equipment Used">
            <Select
              isMulti
              value={usedAssets}
              onChange={(selected) =>
                setUsedAssets(selected as OnChangeValue<OptionType, true>)
              }
              options={assetOptions}
            />
          </FormField>
          <FormField label="Vehicles Used">
            <Select
              isMulti
              value={usedVehicles}
              onChange={(selected) =>
                setUsedVehicles(selected as OnChangeValue<OptionType, true>)
              }
              options={vehicleOptions}
            />
          </FormField>
        </div>

        <div className="p-4 border rounded-md space-y-4">
          <h3 className="text-lg font-semibold mb-3">Work Summary</h3>
          <FormField label="Work Completed">
            <textarea
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              rows={6}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </FormField>
          <FormField label="Notes (Optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
