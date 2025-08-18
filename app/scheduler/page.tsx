"use client";

import React, { useState, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { CustomDragLayer } from "@/components/CustomDragLayer";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ToolboxPopover } from "@/components/ToolboxPopover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SchedulerGrid } from "@/components/SchedulerGrid";
import {
  WorkItem,
  Resource,
  Assignment,
  ResourceType,
  ShiftType,
  ShiftView,
  SchedulerNote,
  DayEvent,
} from "@/lib/types";

// MOCK DATA
const mockAbsenceItems: WorkItem[] = [
  {
    id: "absence-1",
    name: "Annual Leave",
    type: "absence",
    color: "bg-cyan-500",
  },
  {
    id: "absence-2",
    name: "Medical Appointment",
    type: "absence",
    color: "bg-amber-500",
  },
  {
    id: "absence-3",
    name: "Training Course",
    type: "absence",
    color: "bg-sky-500",
  },
];

const mockWorkItems: WorkItem[] = [
  {
    id: "project-1",
    name: "Site Survey",
    type: "project",
    color: "bg-orange-500",
  },
  {
    id: "project-2",
    name: "Track Survey",
    type: "project",
    color: "bg-orange-600",
  },
];

const mockResources: Resource[] = [
  { id: "person-1", name: "Fred Flintstone", type: "personnel" },
  { id: "person-2", name: "Bart Simpson", type: "personnel" },
  { id: "person-3", name: "Peter Griffin", type: "personnel" },
  { id: "equip-1", name: "GNSS 001", type: "equipment" },
  { id: "equip-3", name: "RTC360 001", type: "equipment" },
  { id: "vehicle-1", name: "Renault Kangoo 1", type: "vehicles" },
  { id: "vehicle-3", name: "Ford Transit 2", type: "vehicles" },
  { id: "vehicle-A", name: "Ford Transit 1", type: "vehicles" },
  { id: "equip-2", name: "Total Station 2", type: "equipment" },
];
// END MOCK DATA

export default function SchedulerPage() {
  // --- STATE DECLARATIONS (GROUPED) ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ResourceType>("all");
  const [shiftView, setShiftView] = useState<ShiftView>("all");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<SchedulerNote[]>([]);
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([
    {
      id: "evt-1",
      date: "2025-08-25",
      text: "Summer Bank Holiday",
      type: "holiday",
      color: "bg-green-100 text-green-800",
    },
  ]);

  // --- HANDLER FUNCTIONS ---
  const handleAddDayEvent = (
    date: string,
    text: string,
    type: DayEvent["type"]
  ) => {
    const newEvent: DayEvent = {
      id: `event-${Date.now()}`,
      date,
      text,
      type,
      color:
        type === "holiday"
          ? "bg-green-100 text-green-800"
          : type === "blocker"
            ? "bg-red-100 text-red-800"
            : "bg-blue-100 text-blue-800",
    };
    setDayEvents((prev) => [...prev, newEvent]);
  };

  const handleDeleteDayEvent = (eventId: string) => {
    setDayEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
  };

  const handleDrop = (
    resourceId: string,
    date: string,
    shift: ShiftType,
    item: WorkItem
  ) => {
    setAssignments((prevAssignments) => {
      // ... (handleDrop logic is correct, no changes needed)
      let assignmentType: "project" | "equipment" | "vehicle" | "absence";
      if (item.type === "project") {
        assignmentType = "project";
      } else if (item.type === "equipment") {
        assignmentType = "equipment";
      } else if (item.type === "vehicle") {
        assignmentType = "vehicle";
      } else if (item.type === "personnel") {
        const targetResource = mockResources.find((r) => r.id === resourceId);
        if (targetResource?.type === "equipment") {
          assignmentType = "equipment";
        } else if (targetResource?.type === "vehicles") {
          assignmentType = "vehicle";
        } else {
          console.warn("🛑 EXIT: Invalid assignment target.");
          return prevAssignments;
        }
      } else if (item.type === "absence") {
        assignmentType = "absence";
      } else {
        console.warn("🛑 EXIT: Unknown item type.", item);
        return prevAssignments;
      }

      if (viewType === "personnel" || viewType === "all") {
        if (assignmentType === "equipment" || assignmentType === "vehicle") {
          const itemAlreadyAssigned = prevAssignments.some(
            (a) =>
              a.workItemId === item.id && a.date === date && a.shift === shift
          );
          if (itemAlreadyAssigned) {
            console.warn(
              `🛑 EXIT: Rule failed. ${item.name} is already assigned elsewhere.`
            );
            return prevAssignments;
          }
        }
      } else {
        const equipmentAlreadyAssigned = prevAssignments.some(
          (a) =>
            a.workItemId === resourceId && a.date === date && a.shift === shift
        );
        if (equipmentAlreadyAssigned) {
          console.warn(
            "🛑 EXIT: Rule failed. This equipment/vehicle is already assigned."
          );
          return prevAssignments;
        }
        const personAlreadyAssigned = prevAssignments.some(
          (a) =>
            a.resourceId === item.id &&
            a.date === date &&
            a.shift === shift &&
            a.assignmentType === assignmentType
        );
        if (personAlreadyAssigned) {
          console.warn(
            `🛑 EXIT: Rule failed. ${item.name} is already assigned elsewhere.`
          );
          return prevAssignments;
        }
      }

      let workItemId: string;
      let actualResourceId: string;
      if (viewType === "personnel" || viewType === "all") {
        workItemId = item.id;
        actualResourceId = resourceId;
      } else {
        workItemId = resourceId;
        actualResourceId = item.id;
      }

      const newAssignment: Assignment = {
        id: `${actualResourceId}-${date}-${shift}-${workItemId}-${Date.now()}`,
        workItemId,
        resourceId: actualResourceId,
        date,
        shift,
        assignmentType,
        duration: item.duration || 1,
      };
      console.log(
        "%c SUCCESS: Creating new assignment!",
        "color: green; font-weight: bold;",
        newAssignment
      );
      return [...prevAssignments, newAssignment];
    });
  };

  const handleAddNote = (
    resourceId: string,
    date: string,
    shift: ShiftType
  ) => {
    const newNote: SchedulerNote = {
      id: `note-${Date.now()}`,
      resourceId,
      date,
      shift,
      text: "",
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const handleUpdateNote = (noteId: string, newText: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const removeAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  // --- MEMOIZED CALCULATIONS ---
  const weekDates = useMemo(() => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(
      currentDate.getDate() - (currentDate.getDay() || 7) + 1
    );
    for (let i = 0; i < 14; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  const filteredResources = useMemo(() => {
    if (viewType === "all") return mockResources;
    return mockResources.filter((resource) => resource.type === viewType);
  }, [viewType]);

  const draggableItems = useMemo((): WorkItem[] => {
    switch (viewType) {
      case "equipment":
      case "vehicles":
        return mockResources
          .filter((resource) => resource.type === "personnel")
          .map(
            (resource): WorkItem => ({
              // <-- Type annotation added here
              id: resource.id,
              name: resource.name,
              type: "personnel",
              color: "bg-blue-500",
            })
          );
      case "personnel":
        return [
          ...mockResources
            .filter((resource) => resource.type === "equipment")
            .map(
              (resource): WorkItem => ({
                // <-- Type annotation added here
                id: resource.id,
                name: resource.name,
                type: "equipment",
                color: "bg-purple-500",
              })
            ),
          ...mockResources
            .filter((resource) => resource.type === "vehicles")
            .map(
              (resource): WorkItem => ({
                // <-- Type annotation added here
                id: resource.id,
                name: resource.name,
                type: "vehicle",
                color: "bg-green-500",
              })
            ),
          ...mockWorkItems.filter((item) => item.type === "project"),
          ...mockAbsenceItems,
        ];
      default:
        return mockWorkItems;
    }
  }, [viewType]);

  const groupedItems = useMemo(() => {
    return draggableItems.reduce(
      (acc: Record<string, WorkItem[]>, item: WorkItem) => {
        const typeKey = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        if (!acc[typeKey]) {
          acc[typeKey] = [];
        }
        acc[typeKey].push(item);
        return acc;
      },
      {} as Record<string, WorkItem[]>
    );
  }, [draggableItems]);

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer />
      <div className="p-8 flex flex-col h-[calc(100vh-theme(space.16))] bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white p-4 rounded-t-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">Work Scheduler</h1>
              <Select
                value={viewType}
                onValueChange={(value: ResourceType) => setViewType(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="personnel">Personnel</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={shiftView}
                onValueChange={(value: ShiftView) => setShiftView(value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="day">Day Only</SelectItem>
                  <SelectItem value="night">Night Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("prev")}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("next")}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center pt-4">
            <span className="text-sm text-gray-500 mr-2">
              Drag to schedule:
            </span>
            {Object.entries(groupedItems).map(([type, items]) => (
              <ToolboxPopover
                key={type}
                title={type}
                items={items}
                trigger={
                  <Button variant="outline" size="sm">
                    {type}
                  </Button>
                }
              />
            ))}
          </div>
        </div>

        {/* Scheduler Grid */}
        <div className="flex-1 mt-4">
          <SchedulerGrid
            dates={weekDates}
            resources={filteredResources}
            assignments={assignments}
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            dayEvents={dayEvents}
            onAddDayEvent={handleAddDayEvent}
            onDeleteDayEvent={handleDeleteDayEvent}
            workItems={[
              ...mockWorkItems,
              ...mockAbsenceItems,
              ...mockResources.map((r) => ({
                id: r.id,
                name: r.name,
                type: r.type as any,
                color:
                  r.type === "personnel"
                    ? "bg-blue-500"
                    : r.type === "equipment"
                      ? "bg-purple-500"
                      : "bg-green-500",
              })),
            ]}
            shiftView={shiftView}
            viewType={viewType}
            onDrop={handleDrop}
            onRemoveAssignment={removeAssignment}
          />
        </div>
      </div>
    </DndProvider>
  );
}
