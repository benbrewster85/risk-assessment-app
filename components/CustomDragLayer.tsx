"use client";

import React from "react";
import { useDragLayer } from "react-dnd";
import { WorkItem } from "@/lib/types"; // Make sure this path is correct
import { Badge } from "@/components/ui/badge";

const layerStyles: React.CSSProperties = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 100,
  left: 0,
  top: 0,
  width: "auto",
  height: "auto",
};

function getItemStyles(currentOffset: { x: number; y: number } | null) {
  if (!currentOffset) {
    return {
      display: "none",
    };
  }
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

export function CustomDragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as WorkItem,
    itemType: monitor.getItemType(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(currentOffset)}>
        <Badge className={`${item.color} text-white`}>{item.name}</Badge>
      </div>
    </div>
  );
}
