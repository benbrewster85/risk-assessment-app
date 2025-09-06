"use client";

import React, { useEffect } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { Badge } from "@/components/ui/badge";
import { Assignment, WorkItem } from "@/lib/types";
import { X } from "lucide-react";

// 1. Add `isReadOnly` to the props
interface DraggableAssignmentProps {
  assignment: Assignment;
  itemToDisplay: WorkItem;
  onRemoveAssignment: (assignmentId: string) => void;
  isReadOnly: boolean;
  onAssignmentClick: (assignment: Assignment) => void;
}

export function DraggableAssignment({
  assignment,
  itemToDisplay,
  onRemoveAssignment,
  isReadOnly,
  onAssignmentClick,
}: DraggableAssignmentProps) {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: "ASSIGNMENT_CARD",
    item: assignment,
    canDrag: () => !isReadOnly,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group w-full"
    >
      <Badge
        variant="secondary"
        onClick={isReadOnly ? undefined : () => onAssignmentClick(assignment)}
        // CORRECTED: Removed the hardcoded 'text-white' class
        className={`${itemToDisplay.color} w-full justify-start transition-opacity ${isReadOnly ? "cursor-default" : "cursor-pointer active:cursor-grabbing hover:opacity-80"}`}
      >
        {itemToDisplay.name}
      </Badge>

      {!isReadOnly && (
        <button
          onClick={() => onRemoveAssignment(assignment.id)}
          className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove assignment"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
