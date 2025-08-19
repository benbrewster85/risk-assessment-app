"use client";

import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import React, { useState, useMemo, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
import { CustomDragLayer } from "@/components/CustomDragLayer";
import { ToolboxPopover } from "@/components/ToolboxPopover";
import { SchedulerGrid } from "@/components/SchedulerGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getSchedulableResources,
  getSchedulableWorkItems,
  getSchedulerData,
  createAssignment,
  deleteAssignment,
  createDayEvent,
  deleteDayEvent,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/supabase/scheduler";
import { getUserProfile } from "@/lib/supabase/profiles";

type TimeView = "day" | "week" | "month";

export default function SchedulerPage() {
  const router = useRouter();
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [allWorkItems, setAllWorkItems] = useState<WorkItem[]>([]);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      console.log("Debug Step 1: Starting to load initial data...");
      setIsLoading(true);
      try {
        // --- Check 1: Can we get the user's profile and team? ---
        const profile = await getUserProfile();
        console.log("Debug Step 2: Fetched profile:", profile);

        if (!profile || !profile.team_id) {
          console.error(
            "DEBUG FAIL: No profile or team_id was found for the current user. Halting data load."
          );
          setIsLoading(false); // Stop the loading indicator
          return;
        }

        const teamId = profile.team_id;
        console.log("Debug Step 3: Found team_id:", teamId);
        setCurrentUserRole(profile.role);
        setTeamId(teamId);

        // --- Check 2: Can we get the data for that team? ---
        console.log(
          "Debug Step 4: Fetching all scheduler data for the team..."
        );
        const resources = await getSchedulableResources(teamId);
        const workItems = await getSchedulableWorkItems(teamId);
        const { assignments, notes, dayEvents } =
          await getSchedulerData(teamId);
        console.log("Debug Step 5: Data received from Supabase:", {
          assignments,
          notes,
          dayEvents,
          resources,
          workItems,
        });

        // --- Check 3: Is the state being set? ---
        console.log(
          "Debug Step 6: Setting component state with the fetched data..."
        );
        setAllResources(resources);
        setAllWorkItems(workItems);
        setAssignments(assignments);
        setNotes(notes);
        setDayEvents(dayEvents);
        console.log("Debug Step 7: State has been set.");
      } catch (error) {
        console.error(
          "DEBUG FAIL: An error occurred inside the useEffect data loading process:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []); // This hook still only runs once on page load
  // --- STATE DECLARATIONS ---
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ResourceType>("personnel");
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
  const [timeView, setTimeView] = useState<TimeView>("week");

  // --- HANDLER FUNCTIONS ---
  const handleAddDayEvent = async (
    date: string,
    text: string,
    type: DayEvent["type"]
  ) => {
    if (!teamId) return toast.error("Cannot add event: Team not found.");

    // Create a temporary event for the optimistic update
    const tempId = `temp-${Date.now()}`;
    const color =
      type === "holiday"
        ? "bg-green-100 text-green-800"
        : type === "blocker"
          ? "bg-red-100 text-red-800"
          : "bg-blue-100 text-blue-800";
    const newEvent: DayEvent = { id: tempId, date, text, type, color };

    // 1. Update the UI immediately
    setDayEvents((prev) => [...prev, newEvent]);

    // 2. Call the database
    try {
      await createDayEvent(newEvent, teamId);
      toast.success("Event added.");
      router.refresh(); // Refresh to sync data with the server
    } catch (error) {
      toast.error("Failed to add event.");
      // 3. Revert the UI change on failure
      setDayEvents((prev) => prev.filter((e) => e.id !== tempId));
    }
  };

  const handleDeleteDayEvent = async (eventId: string) => {
    const previousEvents = dayEvents;
    // 1. Optimistic update
    setDayEvents((prev) => prev.filter((e) => e.id !== eventId));

    // 2. Call the database
    try {
      await deleteDayEvent(eventId);
      toast.success("Event deleted.");
    } catch (error) {
      toast.error("Failed to delete event.");
      // 3. Revert on failure
      setDayEvents(previousEvents);
    }
  };

  const navigateTime = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const amount = direction === "next" ? 1 : -1;
    switch (timeView) {
      case "day":
        newDate.setDate(newDate.getDate() + amount);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      default:
        newDate.setDate(newDate.getDate() + 7 * amount);
        break;
    }
    setCurrentDate(newDate);
  };
  // In app/scheduler/page.tsx

  // This handler just creates the note in the UI
  const handleAddNote = (
    resourceId: string,
    date: string,
    shift: ShiftType
  ) => {
    const newNote: SchedulerNote = {
      id: `temp-${Date.now()}`, // Give it a temporary ID
      resourceId,
      date,
      shift,
      text: "",
    };
    setNotes((prev) => [...prev, newNote]);
  };

  // This new handler handles both creating and updating
  const handleSaveNote = async (noteId: string, newText: string) => {
    const isNewNote = noteId.startsWith("temp-");
    const noteToSave = notes.find((n) => n.id === noteId);

    if (!noteToSave) return;

    // Logic for CREATING a new note
    if (isNewNote) {
      try {
        if (!teamId) throw new Error("Team ID not found");
        const { id, ...noteData } = noteToSave;
        const savedNote = await createNote(
          { ...noteData, text: newText },
          teamId
        );

        // --- THIS IS THE NEW DEBUG LOG ---
        console.log("--- DEBUG: Note returned from database after CREATE ---");
        console.log(savedNote);
        // ------------------------------------

        setNotes((prev) => prev.map((n) => (n.id === noteId ? savedNote : n)));
        toast.success("Note saved.");
        router.refresh();
      } catch (error) {
        console.error("Failed to save note:", error); // Log the actual error
        toast.error("Failed to save note.");
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } else {
      // Logic for UPDATING an existing note
      const previousNotes = notes;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
      );
      try {
        const updatedNote = await updateNote(noteId, newText);

        // --- THIS IS THE NEW DEBUG LOG ---
        console.log("--- DEBUG: Note returned from database after UPDATE ---");
        console.log(updatedNote);
        // ------------------------------------
      } catch (error) {
        toast.error("Failed to update note.");
        setNotes(previousNotes);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const previousNotes = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await deleteNote(noteId);
    } catch (error) {
      toast.error("Failed to delete note.");
      setNotes(previousNotes);
    }
  };

  const handleItemDrop = async (
    item: WorkItem | Assignment,
    type: string | symbol | null,
    targetResourceId: string,
    targetDate: string,
    targetShift: ShiftType
  ) => {
    // Case 1: An EXISTING assignment card from the grid was moved
    if (type === "ASSIGNMENT_CARD") {
      const movedAssignment = item as Assignment;

      // Here you would add the database call to UPDATE the assignment
      // For now, we just update the local state:
      setAssignments((prevAssignments) =>
        prevAssignments.map((a) =>
          a.id === movedAssignment.id
            ? {
                ...a,
                resourceId: targetResourceId,
                date: targetDate,
                shift: targetShift,
              }
            : a
        )
      );
      // Example of a future database call: await updateAssignmentInDb(movedAssignment.id, { ... });
      return;
    }

    // Case 2: A NEW item from the toolbox was dropped
    if (type === "WORK_ITEM") {
      const workItem = item as WorkItem;

      // --- Step 1: Perform all synchronous checks and data preparation first ---
      let assignmentType: "project" | "equipment" | "vehicle" | "absence";
      // ... (Determine assignmentType based on workItem.type)
      if (workItem.type === "project") {
        assignmentType = "project";
      } else if (workItem.type === "equipment") {
        assignmentType = "equipment";
      } else if (workItem.type === "vehicle") {
        assignmentType = "vehicle";
      } else if (workItem.type === "personnel") {
        const targetResource = allResources.find(
          (r) => r.id === targetResourceId
        );
        if (targetResource?.type === "equipment") {
          assignmentType = "equipment";
        } else if (targetResource?.type === "vehicles") {
          assignmentType = "vehicle";
        } else {
          console.warn("🛑 EXIT: Invalid assignment target.");
          return;
        }
      } else if (workItem.type === "absence") {
        assignmentType = "absence";
      } else {
        console.warn("🛑 EXIT: Unknown item type.", item);
        return;
      }

      // --- Business Rule Checks (using the current `assignments` state) ---
      if (viewType === "personnel" || viewType === "all") {
        if (assignmentType === "equipment" || assignmentType === "vehicle") {
          if (
            assignments.some(
              (a) =>
                a.workItemId === workItem.id &&
                a.date === targetDate &&
                a.shift === targetShift
            )
          ) {
            toast.error(
              `${workItem.name} is already assigned elsewhere in this shift.`
            );
            return;
          }
        }
      } else {
        if (
          assignments.some(
            (a) =>
              a.workItemId === targetResourceId &&
              a.date === targetDate &&
              a.shift === targetShift
          )
        ) {
          toast.error(`This resource already has an assignment in this shift.`);
          return;
        }
        if (
          assignments.some(
            (a) =>
              a.resourceId === workItem.id &&
              a.date === targetDate &&
              a.shift === targetShift &&
              a.assignmentType === assignmentType
          )
        ) {
          toast.error(
            `${workItem.name} is already assigned elsewhere in this shift.`
          );
          return;
        }
      }

      const finalWorkItemId =
        viewType === "personnel" || viewType === "all"
          ? workItem.id
          : targetResourceId;
      const finalResourceId =
        viewType === "personnel" || viewType === "all"
          ? targetResourceId
          : workItem.id;

      const newAssignmentData = {
        workItemId: finalWorkItemId,
        resourceId: finalResourceId,
        date: targetDate,
        shift: targetShift,
        assignmentType,
        duration: workItem.duration || 1,
      };

      // --- Step 2: Perform the optimistic update and DB call ---
      const tempId = `temp-${Date.now()}`;
      const optimisticAssignment: Assignment = {
        ...newAssignmentData,
        id: tempId,
      };

      // 1. Update the UI immediately with a temporary assignment
      setAssignments((prev) => [...prev, optimisticAssignment]);

      // 2. Call the database in the background
      try {
        if (!teamId) throw new Error("Team ID not found");
        await createAssignment(optimisticAssignment, teamId);
        toast.success("Assignment created.");

        // 3. Refresh server data to get the real ID and sync state
        router.refresh();
      } catch (error) {
        console.error("Failed to create assignment:", error);
        toast.error("Failed to save assignment.");
        // 4. If the database call fails, revert the UI change
        setAssignments((prev) => prev.filter((a) => a.id !== tempId));
      }
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    const previousAssignments = assignments;

    // Step 1: Optimistically remove the assignment from the UI
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));

    // Step 2: Call the database to delete the record
    try {
      await deleteAssignment(assignmentId);
      toast.success("Assignment removed.");
    } catch (error) {
      console.error("Failed to delete assignment:", error);
      toast.error("Failed to remove assignment.");
      // Step 3: If the database call fails, revert the UI to its previous state
      setAssignments(previousAssignments);
    }
  };

  const [teamId, setTeamId] = useState<string | null>(null);

  // --- MEMOIZED CALCULATIONS ---
  const visibleDates = useMemo(() => {
    const start = new Date(currentDate);
    const dates: Date[] = [];
    switch (timeView) {
      case "day":
        dates.push(start);
        break;
      case "month":
        const year = start.getFullYear();
        const month = start.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        let current = new Date(firstDayOfMonth);
        current.setDate(current.getDate() - (current.getDay() || 7) + 1);
        while (current <= lastDayOfMonth || current.getDay() !== 1) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
          if (dates.length >= 42) break;
        }
        break;
      default:
        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - (start.getDay() || 7) + 1);
        for (let i = 0; i < 14; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          dates.push(date);
        }
        break;
    }
    return dates;
  }, [currentDate, timeView]);

  const draggableItems = useMemo((): WorkItem[] => {
    switch (viewType) {
      case "equipment":
      case "vehicles":
        return allResources
          .filter((resource) => resource.type === "personnel")
          .map(
            (resource): WorkItem => ({
              id: resource.id,
              name: resource.name,
              type: "personnel",
              color: "bg-blue-500", // Ensure color is always added
            })
          );
      case "personnel":
        return [
          ...allResources
            .filter((resource) => resource.type === "equipment")
            .map(
              (resource): WorkItem => ({
                id: resource.id,
                name: resource.name,
                type: "equipment",
                color: "bg-purple-500", // Ensure color is always added
              })
            ),
          ...allResources
            .filter((resource) => resource.type === "vehicles")
            .map(
              (resource): WorkItem => ({
                id: resource.id,
                name: resource.name,
                type: "vehicle",
                color: "bg-green-500", // Ensure color is always added
              })
            ),
          // Use allWorkItems here to get projects and absences
          ...allWorkItems.filter(
            (item) => item.type === "project" || item.type === "absence"
          ),
        ];
      default:
        // Default to showing projects from allWorkItems
        return allWorkItems.filter((item) => item.type === "project");
    }
  }, [viewType, allResources, allWorkItems]);

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

  const isReadOnly = currentUserRole !== "team_admin";

  const filteredResources =
    viewType === "all"
      ? allResources
      : allResources.filter((resource) => resource.type === viewType);

  // --- JSX RETURN ---

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer />
      <div className="p-8">
        {/* Main Page Container */}
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Work Scheduler</h1>
              <ToggleGroup
                type="single"
                value={timeView}
                onValueChange={(value: TimeView) => {
                  if (value) setTimeView(value);
                }}
              >
                <ToggleGroupItem value="day" aria-label="Toggle day">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Toggle week">
                  Week
                </ToggleGroupItem>
                <ToggleGroupItem value="month" aria-label="Toggle month">
                  Month
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTime("prev")}
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
                onClick={() => navigateTime("next")}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Controls & Toolbox */}
          <div className="mb-4 p-4 bg-white rounded-lg shadow border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="lg:col-span-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    Drag to schedule:
                  </span>
                  {!isReadOnly &&
                    Object.entries(groupedItems).map(
                      (
                        [type, items] // <-- Add !isReadOnly check
                      ) => (
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
                      )
                    )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
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
              <div>
                <label
                  htmlFor="viewType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Resource Type
                </label>
                <Select
                  value={viewType}
                  onValueChange={(value: ResourceType) => setViewType(value)}
                >
                  <SelectTrigger id="viewType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    <SelectItem value="personnel">Personnel</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="shiftView"
                  className="block text-sm font-medium text-gray-700"
                >
                  Shift View
                </label>
                <Select
                  value={shiftView}
                  onValueChange={(value: ShiftView) => setShiftView(value)}
                >
                  <SelectTrigger id="shiftView" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="day">Day Only</SelectItem>
                    <SelectItem value="night">Night Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Scheduler Grid */}
          {/* This wrapper div now has the consistent styling */}
          {/* Main Scheduler Grid */}
          <div className="bg-white rounded-lg shadow">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading Scheduler...
              </div>
            ) : (
              <SchedulerGrid
                dates={visibleDates}
                resources={filteredResources}
                assignments={assignments}
                notes={notes}
                dayEvents={dayEvents}
                workItems={[
                  ...allWorkItems,
                  ...allResources.map((r) => ({
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
                onDrop={handleItemDrop}
                onRemoveAssignment={removeAssignment}
                onAddNote={handleAddNote}
                onUpdateNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                onAddDayEvent={handleAddDayEvent}
                onDeleteDayEvent={handleDeleteDayEvent}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
