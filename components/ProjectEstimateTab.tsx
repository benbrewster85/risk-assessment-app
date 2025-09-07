"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Project, Task } from "@/lib/types";
import AddEstimateTaskModal from "./AddEstimateTaskModal";
import ConfirmModal from "./ConfirmModal";
import { Plus, Edit2, Trash2, Menu } from "react-feather";
import { StrictModeDroppable } from "./StrictModeDroppable";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";

type ProjectEstimateTabProps = {
  project: Project;
  tasks: Task[];
  isCurrentUserAdmin: boolean;
  onTasksUpdate: (newTasks: Task[]) => void;
};

export default function ProjectEstimateTab({
  project,
  tasks,
  isCurrentUserAdmin,
  onTasksUpdate,
}: ProjectEstimateTabProps) {
  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const totals = useMemo(() => {
    const totalShifts = tasks.reduce(
      (sum, task) => sum + (task.duration_shifts || 0),
      0
    );
    const totalManShifts = tasks.reduce(
      (sum, task) =>
        sum + (task.duration_shifts || 0) * (task.personnel_count || 0),
      0
    );
    return { totalShifts, totalManShifts };
  }, [tasks]);

  const handleTaskSuccess = (newTask: Task) => {
    const newTasks = [...tasks, { ...newTask, sort_order: tasks.length }];
    onTasksUpdate(newTasks);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleEditSuccess = (updatedTask: Task) => {
    const newTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
    onTasksUpdate(newTasks);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
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
      onTasksUpdate(tasks.filter((t) => t.id !== deletingTask.id));
    }
    setDeletingTask(null);
  };

  // --- NEW DRAG HANDLER ---
  const handleOnDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedTasksWithOrder = items.map((task, index) => ({
      ...task,
      sort_order: index,
    }));

    // 1. Update the UI optimistically
    onTasksUpdate(updatedTasksWithOrder);

    // 2. Prepare data for the database function
    const tasksToUpdate = updatedTasksWithOrder.map(({ id, sort_order }) => ({
      id,
      sort_order,
    }));

    // 3. Call the database function to persist the new order
    const { error } = await supabase.rpc("update_task_sort_order", {
      tasks_to_update: tasksToUpdate,
    });

    if (error) {
      toast.error("Failed to save new task order. Please refresh.");
      // Optional: Revert to the original order if the save fails
      onTasksUpdate(tasks);
    } else {
      toast.success("Task order saved!");
    }
  };

  return (
    <>
      <AddEstimateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // --- MODIFIED: Handles both create and edit ---
        onSuccess={editingTask ? handleEditSuccess : handleTaskSuccess}
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

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Project Estimate</h2>
          {isCurrentUserAdmin && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Estimate Task
            </button>
          )}
        </div>

        {/* Table for Estimate Tasks */}
        <div className="overflow-x-auto">
          {/* --- NEW: WRAP TABLE IN DragDropContext --- */}
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* --- NEW: Header for Drag Handle --- */}
                  {isCurrentUserAdmin && <th className="w-12 px-4 py-3"></th>}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration (Shifts)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Man-Shifts
                  </th>
                  {isCurrentUserAdmin && (
                    <th className="relative px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <StrictModeDroppable droppableId="tasks">
                {(provided) => (
                  <tbody {...provided.droppableProps} ref={provided.innerRef}>
                    {tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                        isDragDisabled={!isCurrentUserAdmin}
                      >
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={
                              snapshot.isDragging ? "bg-blue-50 shadow-lg" : ""
                            }
                          >
                            {isCurrentUserAdmin && (
                              <td className="px-4 text-center text-gray-400 cursor-grab">
                                <div {...provided.dragHandleProps}>
                                  <Menu size={16} />
                                </div>
                              </td>
                            )}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className="font-semibold text-sm">
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {task.description}
                              </p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {task.duration_shifts}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {task.personnel_count}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              {(task.duration_shifts || 0) *
                                (task.personnel_count || 0)}
                            </td>
                            {isCurrentUserAdmin && (
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => openEditModal(task)}
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
                              </td>
                            )}
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </StrictModeDroppable>
              <tfoot className="bg-gray-100">
                <tr>
                  {isCurrentUserAdmin && <td className="px-4 py-3"></td>}
                  <td className="px-4 py-3 text-right font-bold text-sm">
                    Totals:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">
                    {totals.totalShifts}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm font-bold">
                    {totals.totalManShifts}
                  </td>
                  {isCurrentUserAdmin && <td className="px-4 py-3"></td>}
                </tr>
              </tfoot>
            </table>
          </DragDropContext>
        </div>
      </div>
    </>
  );
}
