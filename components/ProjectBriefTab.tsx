"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Project, Task } from "@/lib/types";
import AddTaskModal from "./AddTaskModal";
import ConfirmModal from "./ConfirmModal";
import { Plus, Edit2, Trash2 } from "react-feather";

type ProjectBriefTabProps = {
  project: Project;
  initialTasks: Task[];
  isCurrentUserAdmin: boolean;
  onBriefUpdate: (updatedProject: Project) => void;
};

export default function ProjectBriefTab({
  project,
  initialTasks,
  isCurrentUserAdmin,
  onBriefUpdate,
}: ProjectBriefTabProps) {
  const supabase = createClient();
  const [brief, setBrief] = useState(project.brief_statement || "");
  const [tasks, setTasks] = useState(initialTasks);
  const [isSubmittingBrief, setIsSubmittingBrief] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const handleBriefSave = async () => {
    setIsSubmittingBrief(true);
    const { data, error } = await supabase
      .from("projects")
      .update({
        brief_statement: brief,
        last_edited_at: new Date().toISOString(),
      })
      .eq("id", project.id)
      .select()
      .single();

    if (error) {
      toast.error(`Failed to save brief: ${error.message}`);
    } else {
      toast.success("Project brief saved successfully!");
      onBriefUpdate(data as Project);
    }
    setIsSubmittingBrief(false);
  };

  const handleTaskSuccess = (updatedTask: Task) => {
    if (editingTask) {
      setTasks((current) =>
        current.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    } else {
      setTasks((current) => [...current, updatedTask]);
    }
  };

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };
  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", deletingTask.id);
    if (error) {
      toast.error(`Failed to delete task: ${error.message}`);
    } else {
      toast.success("Task deleted.");
      setTasks(tasks.filter((t) => t.id !== deletingTask.id));
    }
    setDeletingTask(null);
  };

  return (
    <>
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={handleTaskSuccess}
        projectId={project.id}
        teamId={project.team_id}
        taskToEdit={editingTask}
      />
      <ConfirmModal
        isOpen={deletingTask !== null}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deletingTask?.title}"?`}
        isDestructive={true}
        confirmText="Delete"
      />

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Project Brief</h2>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={8}
            className="block w-full"
            placeholder={
              isCurrentUserAdmin
                ? "Enter the project brief here..."
                : "No brief has been written for this project."
            }
            readOnly={!isCurrentUserAdmin}
          />
          {isCurrentUserAdmin && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleBriefSave}
                disabled={isSubmittingBrief}
                className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmittingBrief ? "Saving..." : "Save Brief"}
              </button>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Tasks</h2>
            {isCurrentUserAdmin && (
              <button
                onClick={openCreateTaskModal}
                className="bg-green-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            )}
          </div>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border p-4 rounded-md flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {task.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                      {task.status}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold">
                      {task.progress}%
                    </span>
                  </div>
                </div>
                {isCurrentUserAdmin && (
                  <div className="flex space-x-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => openEditTaskModal(task)}
                      className="p-1 text-gray-500 hover:text-indigo-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingTask(task)}
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No tasks have been added to this project yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
