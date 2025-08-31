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
import { Users, Truck, Wrench, Plus } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { DayEventManager } from "./DayEventManager";
import { DraggableAssignment } from "./DraggableAssignment";

// Helper function to calculate the week of the year (ISO 8601 standard)
const getWeekOfYear = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number
  // Makes Monday=1... Sunday=7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
  isReadOnly: boolean;
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
  isReadOnly: boolean;
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
}: DroppableCellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["WORK_ITEM", "ASSIGNMENT_CARD"],
    drop: (item: WorkItem | Assignment, monitor) => {
      onDrop(item, monitor.getItemType(), resourceId, date, shift);
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
      {!isReadOnly && (
        <button
          onClick={onAddNote}
          className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-3 w-3 text-gray-400" />
        </button>
      )}
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
  isReadOnly,
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

  const renderCellContent = (
    shift: ShiftType,
    dateString: string,
    resource: Resource
  ) => {
    return (
      <>
        {assignments
          .filter((a) => {
            if (a.shift !== shift || a.date !== dateString) return false;
            // An assignment is relevant to this cell if the cell's resource (the row)
            // is involved in the assignment as either the primary resource or the work item.
            return a.resourceId === resource.id || a.workItemId === resource.id;
          })
          .map((assignment) => {
            let itemToDisplay;

            // If the row's resource is the assignment's primary resource, display the work item.
            if (assignment.resourceId === resource.id) {
              itemToDisplay = workItems.find(
                (item) => item.id === assignment.workItemId
              );
            }
            // If the row's resource is the assignment's work item, display the primary resource.
            else if (assignment.workItemId === resource.id) {
              itemToDisplay = workItems.find(
                (item) => item.id === assignment.resourceId
              );
            }

            return itemToDisplay ? (
              <DraggableAssignment
                key={assignment.id}
                assignment={assignment}
                itemToDisplay={itemToDisplay}
                onRemoveAssignment={onRemoveAssignment}
                isReadOnly={isReadOnly}
              />
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
              isReadOnly={isReadOnly}
            />
          ))}
      </>
    );
  };

  return (
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
                {!isReadOnly && (
                  <DayEventManager
                    date={dateString}
                    events={eventsForDay}
                    onAdd={onAddDayEvent}
                    onDelete={onDeleteDayEvent}
                  />
                )}
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
                dates.map((date, dateIndex) => {
                  const dateString = date.toISOString().split("T")[0];
                  const eventsForDay = dayEvents.filter(
                    (e) => e.date === dateString
                  );
                  let columnBgClass = isWeekend(date) ? "bg-slate-100" : "";
                  if (eventsForDay.some((e) => e.type === "event"))
                    columnBgClass = "bg-blue-50";
                  if (eventsForDay.some((e) => e.type === "holiday"))
                    columnBgClass = "bg-green-50";

                  const borderClass =
                    dateIndex === 0
                      ? "shadow-[inset_2px_0_0_0_theme(colors.day-border)]"
                      : "";

                  return (
                    <div
                      key={`${dateString}-day`}
                      className={`border-r border-b border-gray-200 ${columnBgClass} ${borderClass}`}
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
                        {renderCellContent("day", dateString, resource)}
                      </DroppableCell>
                    </div>
                  );
                })}

              {shiftView !== "day" &&
                dates.map((date, dateIndex) => {
                  const dateString = date.toISOString().split("T")[0];
                  const eventsForDay = dayEvents.filter(
                    (e) => e.date === dateString
                  );
                  let columnBgClass = isWeekend(date) ? "bg-slate-100" : "";
                  if (eventsForDay.some((e) => e.type === "event"))
                    columnBgClass = "bg-blue-50";
                  if (eventsForDay.some((e) => e.type === "holiday"))
                    columnBgClass = "bg-green-50";

                  const borderClass =
                    dateIndex === 0
                      ? "shadow-[inset_2px_0_0_0_theme(colors.night-border)]"
                      : "";

                  return (
                    <div
                      key={`${dateString}-night`}
                      className={`border-r border-b border-gray-200 ${columnBgClass} ${borderClass}`}
                    >
                      <DroppableCell
                        resourceId={resource.id}
                        date={dateString}
                        shift="night"
                        onDrop={onDrop}
                        onAddNote={() =>
                          onAddNote(resource.id, dateString, "night")
                        }
                        isReadOnly={isReadOnly}
                      >
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
