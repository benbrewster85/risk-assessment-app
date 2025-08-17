"use client";

import React, { useState, useEffect } from "react";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { WorkItem } from "@/lib/types"; // Make sure this path is correct
import { Check } from "lucide-react";

interface ToolboxPopoverProps {
  trigger: React.ReactNode;
  items: WorkItem[];
  title: string;
}

// A small internal component to make each item in the command list draggable
function DraggableCommandItem({
  item,
  onDragEnd,
}: {
  item: WorkItem;
  onDragEnd: () => void;
}) {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: "WORK_ITEM",
    item: item,
    end: () => onDragEnd(), // Close the popover when dragging ends
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <CommandItem
      ref={drag as any}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: "grab" }}
      value={item.name}
    >
      <Check
        className={`mr-2 h-4 w-4 ${isDragging ? "opacity-100" : "opacity-0"}`}
      />
      {item.name}
    </CommandItem>
  );
}

export function ToolboxPopover({ trigger, items, title }: ToolboxPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <DraggableCommandItem
                  key={item.id}
                  item={item}
                  onDragEnd={() => setOpen(false)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
