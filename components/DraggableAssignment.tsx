"use client";

import React, { useEffect } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { Badge } from "@/components/ui/badge";
import { Assignment, WorkItem } from "@/lib/types";

// 1. Add `isReadOnly` to the props
interface DraggableAssignmentProps {
  assignment: Assignment;
  itemToDisplay: WorkItem;
  onRemoveAssignment: (assignmentId: string) => void;
  isReadOnly: boolean;
}

export function DraggableAssignment({
  assignment,
  itemToDisplay,
  onRemoveAssignment,
  isReadOnly,
}: DraggableAssignmentProps) {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: "ASSIGNMENT_CARD",
    item: assignment,
    // 2. Use the `canDrag` property to disable dragging
    canDrag: () => !isReadOnly,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div ref={drag as any} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Badge
        variant="secondary"
        // 3. Make the onClick handler conditional
        onClick={
          isReadOnly ? undefined : () => onRemoveAssignment(assignment.id)
        }
        // 4. Make the cursor style conditional
        className={`${itemToDisplay.color} text-white transition-opacity ${isReadOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing hover:opacity-80"}`}
      >
        {itemToDisplay.name}
      </Badge>
    </div>
  );
}
