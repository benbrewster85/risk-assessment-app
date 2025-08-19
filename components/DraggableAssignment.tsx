"use client";

import React, { useEffect } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { Badge } from "@/components/ui/badge";
import { Assignment, WorkItem } from "@/lib/types";

// 1. Add onRemoveAssignment to the props interface
interface DraggableAssignmentProps {
  assignment: Assignment;
  itemToDisplay: WorkItem;
  onRemoveAssignment: (assignmentId: string) => void;
}

export function DraggableAssignment({
  assignment,
  itemToDisplay,
  onRemoveAssignment,
}: DraggableAssignmentProps) {
  // 2. Receive the new prop
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: "ASSIGNMENT_CARD",
    item: assignment,
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
        // 3. Add the onClick handler and update the cursor
        onClick={() => onRemoveAssignment(assignment.id)}
        className={`${itemToDisplay.color} text-white cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity`}
      >
        {itemToDisplay.name}
      </Badge>
    </div>
  );
}
