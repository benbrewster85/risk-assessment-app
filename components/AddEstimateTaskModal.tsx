"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Task } from "@/lib/types";
import Modal from "./Modal"; // Assuming you have a generic Modal component

type AddEstimateTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  projectId: string;
  teamId: string | null;
  taskToEdit?: Task | null;
};

export default function AddEstimateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  teamId,
  taskToEdit,
}: AddEstimateTaskModalProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(1);
  const [staff, setStaff] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setDuration(taskToEdit.duration_shifts || 1);
      setStaff(taskToEdit.personnel_count || 1);
    } else {
      setTitle("");
      setDescription("");
      setDuration(1);
      setStaff(1);
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || duration < 1 || staff < 1) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    const taskData = {
      title,
      description: description || null,
      duration_shifts: duration,
      personnel_count: staff,
      project_id: projectId,
      team_id: teamId,
      status: taskToEdit?.status || "Not Started",
      progress: taskToEdit?.progress || 0,
    };

    let result;
    if (taskToEdit) {
      result = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", taskToEdit.id)
        .select()
        .single();
    } else {
      result = await supabase.from("tasks").insert(taskData).select().single();
    }

    setIsSubmitting(false);

    if (result.error) {
      toast.error(`Error saving task: ${result.error.message}`);
    } else {
      toast.success(`Task ${taskToEdit ? "updated" : "created"} successfully!`);
      onSuccess(result.data as Task);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Estimate Task" : "Add Estimate Task"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Task Name
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full"
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="duration" className="block text-sm font-medium">
              Duration (Shifts)
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="staff" className="block text-sm font-medium">
              Staff Count
            </label>
            <input
              id="staff"
              type="number"
              min="1"
              value={staff}
              onChange={(e) => setStaff(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Save Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
