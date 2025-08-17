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

// --- PROPS INTERFACE ---
const getWeekOfYear = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay) + 1;
  return Math.ceil(dayOfYear / 7);
};

interface SchedulerGridProps {
  dates: Date[];
  resources: Resource[];
  assignments: Assignment[];
  notes: SchedulerNote[];
  workItems: WorkItem[];
  shiftView: ShiftView;
  viewType: ResourceType;
  dayEvents: DayEvent[];
  onAddDayEvent: (date: string, text: string, type: DayEvent["type"]) => void;
  onDeleteDayEvent: (eventId: string) => void;
  onDrop: (
    resourceId: string,
    date: string,
    shift: ShiftType,
    item: WorkItem
  ) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onAddNote: (resourceId: string, date: string, shift: ShiftType) => void;
  onUpdateNote: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
}

interface DroppableCellProps {
  resourceId: string;
  date: string;
  shift: ShiftType;
  onDrop: (
    resourceId: string,
    date: string,
    shift: ShiftType,
    item: WorkItem
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
}: DroppableCellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "WORK_ITEM",
    drop: (item: WorkItem) => onDrop(resourceId, date, shift, item),
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
}: SchedulerGridProps) {
  const gridTemplateColumns = `200px repeat(${dates.length}, minmax(120px, 1fr))`;
  const rowCount =
    shiftView === "all" ? resources.length * 2 : resources.length;
  const gridTemplateRows = `auto repeat(${rowCount}, minmax(48px, auto))`;

  return (
    <div className="bg-white rounded-lg shadow overflow-auto">
      <div className="grid" style={{ gridTemplateColumns, gridTemplateRows }}>
        {/* === HEADER ROW === */}
        <div className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-r border-gray-200 p-2 font-semibold text-sm text-gray-600 flex items-center justify-center">
          Resource
        </div>
        {dates.map((date) => {
          const dateString = date.toISOString().split("T")[0];
          const eventsForDay = dayEvents.filter((e) => e.date === dateString);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          // NEW: Determine background color based on events, with holidays taking precedence
          let columnBgClass = isWeekend ? "bg-slate-100" : "bg-gray-50"; // Default to weekend or weekday color
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

          const renderCellContent = (
            shift: ShiftType,
            dateString: string,
            resource: Resource
          ) => {
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
              {/* FIX 2: Added z-20 to ensure this column sits on top of scrolling cells */}
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
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  // NEW: Determine background color for the data cell
                  let columnBgClass = isWeekend ? "bg-slate-100" : "";
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
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  // NEW: Determine background color for the data cell
                  let columnBgClass = isWeekend ? "bg-slate-100" : "";
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
                        shift="night"
                        onDrop={onDrop}
                        onAddNote={() =>
                          onAddNote(resource.id, dateString, "night")
                        }
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
