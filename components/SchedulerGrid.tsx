"use client";

import React from "react";
import { useDrop, DropTargetMonitor } from "react-dnd";
import {
  Resource,
  Assignment,
  WorkItem,
  ShiftType,
  ShiftView,
  ResourceType,
  SchedulerNote,
  DayEvent,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Users, Truck, Wrench, Plus } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { DayEventManager } from "./DayEventManager";
import { DraggableAssignment } from "./DraggableAssignment";

// Helper function to calculate the week of the year
const getWeekOfYear = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay) + 1;
  return Math.ceil(dayOfYear / 7);
};

// Helper function to check for weekends
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

// --- PROPS INTERFACE ---
interface SchedulerGridProps {
  dates: Date[];
  resources: Resource[];
  assignments: Assignment[];
  notes: SchedulerNote[];
  workItems: WorkItem[];
  shiftView: ShiftView;
  viewType: ResourceType;
  dayEvents: DayEvent[];
  onDrop: (
    item: WorkItem | Assignment,
    type: string | symbol | null,
    targetResourceId: string,
    targetDate: string,
    targetShift: ShiftType
  ) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onAddNote: (resourceId: string, date: string, shift: ShiftType) => void;
  onUpdateNote: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
  onAddDayEvent: (date: string, text: string, type: DayEvent["type"]) => void;
  onDeleteDayEvent: (eventId: string) => void;
  isReadOnly: boolean;
}

interface DroppableCellProps {
  resourceId: string;
  date: string;
  shift: ShiftType;
  onDrop: (
    item: WorkItem | Assignment,
    type: string | symbol | null,
    targetResourceId: string,
    targetDate: string,
    targetShift: ShiftType
  ) => void;
  onAddNote: () => void;
  children: React.ReactNode;
}

// --- DROPPABLE CELL COMPONENT ---
const DroppableCell = ({
  children,
  onDrop,
  onAddNote,
  resourceId,
  date,
  shift,
  isReadOnly,
}: DroppableCellProps & { isReadOnly: boolean }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["WORK_ITEM", "ASSIGNMENT_CARD"], // Accept both types
    drop: (item, monitor) => {
      // Call the unified handler with all the necessary info
      onDrop(
        item as Assignment | WorkItem,
        monitor.getItemType(),
        resourceId,
        date,
        shift
      );
    },
    canDrop: () => !isReadOnly,
    collect: (monitor: DropTargetMonitor) => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div
      ref={drop as any}
      className={`relative group h-full p-1 flex flex-wrap gap-1 items-start content-start transition-colors ${isOver ? "bg-blue-100" : ""}`}
    >
      {children}
      <button
        onClick={onAddNote}
        className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Plus className="h-3 w-3 text-gray-400" />
      </button>
    </div>
  );
};

// --- MAIN SCHEDULER GRID COMPONENT ---
export function SchedulerGrid({
  dates,
  resources,
  assignments,
  notes,
  workItems,
  shiftView,
  viewType,
  dayEvents,
  onDrop,
  onRemoveAssignment,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddDayEvent,
  onDeleteDayEvent,
  isReadOnly,
}: SchedulerGridProps) {
  const gridTemplateColumns = `200px repeat(${dates.length}, minmax(120px, 1fr))`;
  const rowCount =
    shiftView === "all" ? resources.length * 2 : resources.length;
  const gridTemplateRows = `auto repeat(${rowCount}, minmax(48px, auto))`;

  return (
    // FIX: Added `relative` class to establish a firm positioning context for sticky elements
    <div className="relative bg-white rounded-lg shadow overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns, gridTemplateRows }}>
        {/* === HEADER ROW === */}
        <div className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-r border-gray-200 p-2 font-semibold text-sm text-gray-600 flex items-center justify-center">
          Resource
        </div>
        {dates.map((date) => {
          const dateString = date.toISOString().split("T")[0];
          const eventsForDay = dayEvents.filter((e) => e.date === dateString);

          let columnBgClass = isWeekend(date) ? "bg-slate-100" : "bg-gray-50";
          if (eventsForDay.some((e) => e.type === "event"))
            columnBgClass = "bg-blue-50";
          if (eventsForDay.some((e) => e.type === "holiday"))
            columnBgClass = "bg-green-50";

          return (
            <div
              key={date.toISOString()}
              className={`group sticky top-0 z-10 border-b border-r border-gray-200 p-2 text-center ${columnBgClass}`}
            >
              <div className="absolute top-1 right-1">
                <DayEventManager
                  date={dateString}
                  events={eventsForDay}
                  onAdd={onAddDayEvent}
                  onDelete={onDeleteDayEvent}
                />
              </div>
              <div className="font-semibold text-gray-800">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-gray-500 text-sm">
                {date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Wk {getWeekOfYear(date)}
              </div>
              <div className="flex flex-col items-start gap-1 mt-1">
                {eventsForDay.map((event) => (
                  <Badge
                    key={event.id}
                    variant="secondary"
                    className={`w-full justify-start text-xs font-normal ${event.color}`}
                  >
                    {event.text}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}

        {/* === RESOURCE DATA ROWS === */}
        {resources.map((resource, resourceIndex) => {
          const rowSpan = shiftView === "all" ? 2 : 1;
          const gridRowStart =
            2 + (shiftView === "all" ? resourceIndex * 2 : resourceIndex);

          // Replace the existing renderCellContent function with this one
          const renderCellContent = (
            shift: ShiftType,
            dateString: string,
            resource: Resource
          ) => {
            // This block will log debug info for the first resource in your list to avoid spamming the console
            if (
              resources.length > 0 &&
              resource.id === resources[0].id &&
              shift === "day"
            ) {
              console.groupCollapsed(
                `--- Debugging Cell: ${resource.name} / ${dateString} ---`
              );

              // Log the first assignment from the master list to see its format
              if (assignments.length > 0) {
                console.log(
                  "Data format of first assignment from database:",
                  assignments[0]
                );
              }

              console.log("This cell is looking for values matching:", {
                resourceId: resource.id,
                date: dateString,
                shift: shift,
              });

              // Log the result of each comparison for the first assignment
              if (assignments.length > 0) {
                const a = assignments[0];
                console.log(`Comparing with assignment ${a.id}:`);
                console.log(
                  `  - Shift Test: '${a.shift}' === '${shift}'  -->  ${a.shift === shift}`
                );
                console.log(
                  `  - Date Test:  '${a.date}' === '${dateString}'  -->  ${a.date === dateString}`
                );
                console.log(
                  `  - Resource Test (for personnel view): '${a.resourceId}' === '${resource.id}'  -->  ${a.resourceId === resource.id}`
                );
              }

              console.groupEnd();
            }

            return (
              <>
                {assignments
                  .filter((a) => {
                    if (a.shift !== shift || a.date !== dateString)
                      return false;
                    if (viewType === "personnel" || viewType === "all") {
                      return a.resourceId === resource.id;
                    } else {
                      return a.workItemId === resource.id;
                    }
                  })
                  .map((assignment) => {
                    const itemToDisplay =
                      viewType === "personnel" || viewType === "all"
                        ? workItems.find(
                            (item) => item.id === assignment.workItemId
                          )
                        : workItems.find(
                            (item) => item.id === assignment.resourceId
                          );
                    return itemToDisplay ? (
                      <Badge
                        key={assignment.id}
                        variant="secondary"
                        className={`${itemToDisplay.color} text-white cursor-pointer`}
                        onClick={() => onRemoveAssignment(assignment.id)}
                      >
                        {itemToDisplay.name}
                      </Badge>
                    ) : null;
                  })}
                {notes
                  .filter(
                    (n) =>
                      n.resourceId === resource.id &&
                      n.date === dateString &&
                      n.shift === shift
                  )
                  .map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onUpdate={onUpdateNote}
                      onDelete={onDeleteNote}
                    />
                  ))}
              </>
            );
          };

          return (
            <React.Fragment key={resource.id}>
              <div
                className="sticky left-0 z-20 bg-white border-r border-b border-gray-200 p-2 font-medium text-sm flex items-center"
                style={{ gridRow: `${gridRowStart} / span ${rowSpan}` }}
              >
                {resource.type === "personnel" && (
                  <Users className="w-4 h-4 mr-2 text-gray-500" />
                )}
                {resource.type === "equipment" && (
                  <Wrench className="w-4 h-4 mr-2 text-gray-500" />
                )}
                {resource.type === "vehicles" && (
                  <Truck className="w-4 h-4 mr-2 text-gray-500" />
                )}
                {resource.name}
              </div>

              {shiftView !== "night" &&
                dates.map((date) => {
                  const dateString = date.toISOString().split("T")[0];
                  const eventsForDay = dayEvents.filter(
                    (e) => e.date === dateString
                  );

                  let columnBgClass = isWeekend(date) ? "bg-slate-100" : "";
                  if (eventsForDay.some((e) => e.type === "event"))
                    columnBgClass = "bg-blue-50";
                  if (eventsForDay.some((e) => e.type === "holiday"))
                    columnBgClass = "bg-green-50";

                  return (
                    <div
                      key={`${dateString}-day`}
                      className={`border-r border-b border-gray-200 ${columnBgClass}`}
                    >
                      <DroppableCell
                        resourceId={resource.id}
                        date={dateString}
                        shift="day"
                        onDrop={onDrop}
                        onAddNote={() =>
                          onAddNote(resource.id, dateString, "day")
                        }
                        isReadOnly={isReadOnly}
                      >
                        <Sun className="w-3 h-3 text-yellow-500 mr-1 opacity-50" />
                        {renderCellContent("day", dateString, resource)}
                      </DroppableCell>
                    </div>
                  );
                })}

              {shiftView !== "day" &&
                dates.map((date) => {
                  const dateString = date.toISOString().split("T")[0];
                  const eventsForDay = dayEvents.filter(
                    (e) => e.date === dateString
                  );

                  let columnBgClass = isWeekend(date) ? "bg-slate-100" : "";
                  if (eventsForDay.some((e) => e.type === "event"))
                    columnBgClass = "bg-blue-50";
                  if (eventsForDay.some((e) => e.type === "holiday"))
                    columnBgClass = "bg-green-50";

                  return (
                    <div
                      key={`${dateString}-night`}
                      className={`border-r border-b border-gray-200 ${columnBgClass}`}
                    >
                      <DroppableCell
                        resourceId={resource.id}
                        date={dateString}
                        shift="day"
                        onDrop={onDrop}
                        onAddNote={() =>
                          onAddNote(resource.id, dateString, "day")
                        }
                        isReadOnly={isReadOnly}
                      >
                        <Moon className="w-3 h-3 text-indigo-500 mr-1 opacity-50" />
                        {renderCellContent("night", dateString, resource)}
                      </DroppableCell>
                    </div>
                  );
                })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
