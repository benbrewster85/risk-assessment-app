"use client";

import React, { useState } from "react";
import { DayEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface DayEventManagerProps {
  date: string;
  events: DayEvent[];
  onAdd: (date: string, text: string, type: DayEvent["type"]) => void;
  onDelete: (eventId: string) => void;
}

export function DayEventManager({
  date,
  events,
  onAdd,
  onDelete,
}: DayEventManagerProps) {
  const [text, setText] = useState("");
  const [type, setType] = useState<DayEvent["type"]>("event");

  const handleAdd = () => {
    if (text.trim() === "") return;
    onAdd(date, text, type);
    setText("");
    setType("event");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="absolute top-0 right-0 p-0.5 opacity-0 hover:opacity-100 transition-opacity">
          <Plus className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Events for {date}</h4>
          <div className="space-y-2">
            {events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span
                    className={`mr-2 px-2 py-0.5 rounded-full text-xs ${event.color}`}
                  >
                    {event.type}
                  </span>
                  <span className="flex-1">{event.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDelete(event.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No events for this day.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="New event..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-8"
            />
            <Select
              value={type}
              onValueChange={(value: DayEvent["type"]) => setType(value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="blocker">Blocker</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
