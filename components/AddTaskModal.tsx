"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { Task } from "@/lib/types";

type AddTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  projectId: string;
  teamId: string;
  taskToEdit: Task | null;
};

const taskStatuses = ["Not Started", "In Progress", "Completed"];

export default function AddTaskModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  teamId,
  taskToEdit,
}: AddTaskModalProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = taskToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setStatus(taskToEdit.status);
        setProgress(taskToEdit.progress);
      } else {
        setTitle("");
        setDescription("");
        setStatus("Not Started");
        setProgress(0);
      }
    }
  }, [isOpen, taskToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const taskData = {
      project_id: projectId,
      team_id: teamId,
      title,
      description,
      status,
      progress,
    };

    const { data, error } = isEditing
      ? await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", taskToEdit!.id)
          .select()
          .single()
      : await supabase.from("tasks").insert(taskData).select().single();

    if (error) {
      toast.error(`Failed to save task: ${error.message}`);
    } else if (data) {
      toast.success(`Task ${isEditing ? "updated" : "added"} successfully!`);
      onSuccess(data as Task);
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={isEditing ? "Edit Task" : "Add New Task"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 block w-full"
            >
              {taskStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Progress (%)</label>
            <input
              type="number"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              min="0"
              max="100"
              className="mt-1 block w-full"
            />
          </div>
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
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Add Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
