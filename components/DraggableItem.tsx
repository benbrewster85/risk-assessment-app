"use client";

import { useDrag, DragSourceMonitor } from "react-dnd";
import { Badge } from "@/components/ui/badge";
import { WorkItem } from "@/lib/types";

interface DraggableItemProps {
  item: WorkItem;
}

export function DraggableItem({ item }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "WORK_ITEM",
    item: item,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: "grab" }}
    >
      <Badge className={`${item.color} text-white hover:opacity-80`}>
        {item.name}
      </Badge>
    </div>
  );
}
