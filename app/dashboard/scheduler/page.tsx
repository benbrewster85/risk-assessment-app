"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Filter as FilterIcon } from "lucide-react";
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
  updateAssignment,
  createBulkAssignments,
  getCachedWeatherForDates,
} from "@/lib/supabase/scheduler";
import { getUserProfile } from "@/lib/supabase/profiles";
import {
  BulkAssignModal,
  BulkAssignFormData,
} from "@/components/BulkAssignModal";

import { DailyForecast } from "@/lib/supabase/weather";
import { createClient } from "@/lib/supabase/client"; // Added

const supabase = createClient(); // Added

type TimeView = "day" | "week" | "month";

type ActiveFilters = {
  jobRoleIds: string[];
  subTeamIds: string[];
  lineManagerIds: string[];
  assetCategoryIds: string[];
};

export default function SchedulerPage() {
  // --- HOOKS ---
  const router = useRouter();

  // --- STATE DECLARATIONS ---
  const [forecasts, setForecasts] = useState<DailyForecast[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ResourceType>("personnel");
  const [shiftView, setShiftView] = useState<ShiftView>("all");
  const [timeView, setTimeView] = useState<TimeView>("week");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<SchedulerNote[]>([]);
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([]);

  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [allWorkItems, setAllWorkItems] = useState<WorkItem[]>([]);

  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<{
    jobRoles: { id: string; name: string }[];
    subTeams: { id: string; name: string }[];
    lineManagers: { id: string; name: string }[];
    assetCategories: { id: string; name: string }[];
  }>({ jobRoles: [], subTeams: [], lineManagers: [], assetCategories: [] });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    jobRoleIds: [],
    subTeamIds: [],
    lineManagerIds: [],
    assetCategoryIds: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

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
        current.setDate(current.getDate() - current.getDay());
        while (current <= lastDayOfMonth || current.getDay() !== 0) {
          // Changed for Sunday start
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
          if (dates.length >= 42) break;
        }
        break;
      default:
        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - start.getDay());
        for (let i = 0; i < 14; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          dates.push(date);
        }
        break;
    }
    return dates;
  }, [currentDate, timeView]);

  const fetchAndDisplayWeather = useCallback(
    async (teamId: string) => {
      const weatherData = await getCachedWeatherForDates(teamId, visibleDates);
      setForecasts(weatherData);
    },
    [visibleDates]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setForecasts([]); // Clear old forecast data

    try {
      const profile = await getUserProfile();
      if (!profile || !profile.team_id) {
        setIsLoading(false);
        return;
      }
      const currentTeamId = profile.team_id;
      if (!teamId) setTeamId(currentTeamId);
      if (!currentUserRole) setCurrentUserRole(profile.role);

      // --- START: On-Demand Weather Logic ---
      const { data: teamData } = await supabase
        .from("teams")
        .select("weather_last_updated_at")
        .eq("id", currentTeamId)
        .single();
      const lastUpdated = teamData?.weather_last_updated_at
        ? new Date(teamData.weather_last_updated_at)
        : null;
      const todayString = new Date().toISOString().split("T")[0];
      const lastUpdatedString = lastUpdated
        ? lastUpdated.toISOString().split("T")[0]
        : null;

      const isStale = !lastUpdated || todayString !== lastUpdatedString;

      if (isStale) {
        toast.success("Fetching latest weather forecast...");
        await fetch("/api/cron/update-weather", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET!}`,
          },
          body: JSON.stringify({ teamId: currentTeamId }),
        });
      }
      // --- END: On-Demand Weather Logic ---

      const [resourceData, workItems, schedulerData] = await Promise.all([
        getSchedulableResources(currentTeamId),
        getSchedulableWorkItems(currentTeamId),
        getSchedulerData(currentTeamId),
      ]);

      setAllResources(resourceData.resources);
      setFilterOptions(resourceData.filterOptions);
      setAllWorkItems(workItems);
      setAssignments(schedulerData.assignments);
      setNotes(schedulerData.notes);
      setDayEvents(schedulerData.dayEvents);

      await fetchAndDisplayWeather(currentTeamId); // Fetch and display the (now fresh) weather
    } catch (error) {
      console.error("Failed to load scheduler data:", error);
      toast.error("Failed to load scheduler data.");
    } finally {
      setIsLoading(false);
    }
  }, [teamId, currentUserRole, visibleDates, fetchAndDisplayWeather]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // --- HANDLER FUNCTIONS ---
  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleBulkAssign = async (formData: BulkAssignFormData) => {
    if (!selectedAssignment || !teamId)
      return toast.error("Required data is missing.");
    const originalResource = allResources.find(
      (r) =>
        r.id === selectedAssignment.resourceId ||
        r.id === selectedAssignment.workItemId
    );
    if (!originalResource)
      return toast.error("Could not find the original resource.");

    setIsLoading(true);
    try {
      await createBulkAssignments(
        formData,
        selectedAssignment,
        originalResource.type,
        teamId
      );
      toast.success("Assignments updated successfully!");
    } catch (error) {
      console.error("Bulk assignment failed:", error);
      toast.error("Failed to update assignments.");
    } finally {
      setIsModalOpen(false);
      await fetchData();
    }
  };

  const handleFilterChange = (filterKey: keyof ActiveFilters, id: string) => {
    setActiveFilters((prev) => {
      const currentValues = prev[filterKey];
      const newValues = currentValues.includes(id)
        ? currentValues.filter((val) => val !== id)
        : [...currentValues, id];
      return { ...prev, [filterKey]: newValues };
    });
  };

  const handleAddDayEvent = async (
    date: string,
    text: string,
    type: DayEvent["type"]
  ) => {
    if (!teamId) return toast.error("Cannot add event: Team not found.");
    const tempId = `temp-${Date.now()}`;
    const color =
      type === "holiday"
        ? "bg-green-100 text-green-800"
        : type === "blocker"
          ? "bg-red-100 text-red-800"
          : "bg-blue-100 text-blue-800";
    const newEvent: DayEvent = { id: tempId, date, text, type, color };
    setDayEvents((prev) => [...prev, newEvent]);
    try {
      await createDayEvent(newEvent, teamId);
      await fetchData();
    } catch (error) {
      toast.error("Failed to add event.");
      setDayEvents((prev) => prev.filter((e) => e.id !== tempId));
    }
  };

  const handleDeleteDayEvent = async (eventId: string) => {
    const previousEvents = dayEvents;
    setDayEvents((prev) => prev.filter((e) => e.id !== eventId));
    try {
      await deleteDayEvent(eventId);
    } catch (error) {
      toast.error("Failed to delete event.");
      setDayEvents(previousEvents);
    }
  };

  const handleAddNote = (
    resourceId: string,
    date: string,
    shift: ShiftType
  ) => {
    const newNote: SchedulerNote = {
      id: `temp-${Date.now()}`,
      resourceId,
      date,
      shift,
      text: "",
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const handleSaveNote = async (noteId: string, newText: string) => {
    const isNewNote = noteId.startsWith("temp-");
    const noteToSave = notes.find((n) => n.id === noteId);
    if (!noteToSave) return;
    if (isNewNote) {
      try {
        if (!teamId) throw new Error("Team ID not found");
        const { id, ...noteData } = noteToSave;
        await createNote({ ...noteData, text: newText }, teamId);
        await fetchData();
      } catch (error) {
        toast.error("Failed to save note.");
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } else {
      const previousNotes = notes;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
      );
      try {
        await updateNote(noteId, newText);
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

  const removeAssignment = async (assignmentId: string) => {
    const previousAssignments = assignments;
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    try {
      await deleteAssignment(assignmentId);
    } catch (error) {
      toast.error("Failed to remove assignment.");
      setAssignments(previousAssignments);
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

  const handleItemDrop = async (
    item: WorkItem | Assignment,
    type: string | symbol | null,
    targetResourceId: string,
    targetDate: string,
    targetShift: ShiftType
  ) => {
    if (type === "ASSIGNMENT_CARD") {
      const movedAssignment = item as Assignment;
      const previousAssignments = assignments;
      setAssignments((prev) =>
        prev.map((a) =>
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
      try {
        await updateAssignment(movedAssignment.id, {
          resourceId: targetResourceId,
          date: targetDate,
          shift: targetShift,
        });
      } catch (error) {
        toast.error("Failed to move assignment.");
        setAssignments(previousAssignments);
      }
      return;
    }

    if (type === "WORK_ITEM") {
      const workItem = item as WorkItem;
      let assignmentType: "project" | "equipment" | "vehicle" | "absence";
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
          return;
        }
      } else if (workItem.type === "absence") {
        assignmentType = "absence";
      } else {
        return;
      }

      let finalWorkItemId = workItem.id;
      let finalResourceId = targetResourceId;

      if (
        workItem.type === "personnel" &&
        (viewType === "equipment" || viewType === "vehicles")
      ) {
        finalWorkItemId = targetResourceId;
        finalResourceId = workItem.id;
      }

      const tempId = `temp-${Date.now()}`;
      const newAssignment: Assignment = {
        id: tempId,
        workItemId: workItem.id,
        resourceId: targetResourceId,
        date: targetDate,
        shift: targetShift,
        assignmentType,
        duration: workItem.duration || 1,
      };

      setAssignments((prev) => [...prev, newAssignment]);

      try {
        if (!teamId) throw new Error("Team ID not found");
        const targetResource = allResources.find(
          (r) => r.id === targetResourceId
        );
        if (!targetResource) throw new Error("Target resource not found");

        // Pass the correctly defined newAssignment
        const savedAssignment = await createAssignment(
          newAssignment,
          teamId,
          targetResource.type
        );

        setAssignments((prev) =>
          prev.map((a) => (a.id === tempId ? savedAssignment : a))
        );
      } catch (error) {
        console.error("Failed to save assignment:", error);
        toast.error("Failed to save assignment.");
        setAssignments((prev) => prev.filter((a) => a.id !== tempId));
      }
    }
  };

  // --- MEMOIZED CALCULATIONS & DERIVED STATE ---
  const filteredResources = useMemo(() => {
    let resources =
      viewType === "all"
        ? allResources
        : allResources.filter((r) => r.type === viewType);
    if (viewType === "personnel") {
      const { jobRoleIds, subTeamIds, lineManagerIds } = activeFilters;
      if (jobRoleIds.length > 0)
        resources = resources.filter(
          (r) => r.job_role_id && jobRoleIds.includes(r.job_role_id)
        );
      if (subTeamIds.length > 0)
        resources = resources.filter(
          (r) => r.sub_team_id && subTeamIds.includes(r.sub_team_id)
        );
      if (lineManagerIds.length > 0)
        resources = resources.filter(
          (r) => r.line_manager_id && lineManagerIds.includes(r.line_manager_id)
        );
    }
    if (viewType === "equipment") {
      const { assetCategoryIds } = activeFilters;
      if (assetCategoryIds.length > 0)
        resources = resources.filter(
          (r) => r.category_id && assetCategoryIds.includes(r.category_id)
        );
    }
    return resources;
  }, [viewType, allResources, activeFilters]);

  const activeFilterCount = useMemo(() => {
    if (viewType === "personnel") {
      return (
        activeFilters.jobRoleIds.length +
        activeFilters.subTeamIds.length +
        activeFilters.lineManagerIds.length
      );
    }
    if (viewType === "equipment") {
      return activeFilters.assetCategoryIds.length;
    }
    return 0;
  }, [viewType, activeFilters]);

  const draggableItems = useMemo((): WorkItem[] => {
    const getAbsencesForView = (currentView: ResourceType) => {
      const categoryForView =
        currentView === "vehicles" ? "vehicle" : currentView;
      return allWorkItems.filter(
        (item) => item.type === "absence" && item.category === categoryForView
      );
    };

    switch (viewType) {
      case "equipment":
      case "vehicles":
        const personnelAsWorkItems = allResources
          .filter((r) => r.type === "personnel")
          .map(
            (r): WorkItem => ({
              id: r.id,
              name: r.name,
              type: "personnel",
              color: r.color,
            })
          );
        const relevantAbsences = getAbsencesForView(viewType);
        return [...personnelAsWorkItems, ...relevantAbsences];
      case "personnel":
        const equipmentAsWorkItems = allResources
          .filter((r) => r.type === "equipment")
          .map(
            (r): WorkItem => ({
              id: r.id,
              name: r.name,
              type: "equipment",
              color: r.color,
            })
          );
        const vehiclesAsWorkItems = allResources
          .filter((r) => r.type === "vehicles")
          .map(
            (r): WorkItem => ({
              id: r.id,
              name: r.name,
              type: "vehicle",
              color: r.color,
            })
          );
        const projectItems = allWorkItems.filter(
          (item) => item.type === "project"
        );
        const personnelAbsences = getAbsencesForView("personnel");
        return [
          ...equipmentAsWorkItems,
          ...vehiclesAsWorkItems,
          ...projectItems,
          ...personnelAbsences,
        ];
      default:
        return allWorkItems.filter(
          (item) => item.type === "project" || item.type === "absence"
        );
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

  // --- JSX RETURN ---
  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer />
      <div className="p-8">
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
                <ToggleGroupItem value="day">Day</ToggleGroupItem>
                <ToggleGroupItem value="week">Week</ToggleGroupItem>
                <ToggleGroupItem value="month">Month</ToggleGroupItem>
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

          <div className="mb-4 p-4 bg-white rounded-lg shadow border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drag to Schedule
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {!isReadOnly &&
                    Object.entries(groupedItems).map(([type, items]) => (
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
                <label className="block text-sm font-medium text-gray-700">
                  Filters
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-1"
                      disabled={
                        viewType !== "personnel" && viewType !== "equipment"
                      }
                    >
                      <FilterIcon className="w-4 h-4 mr-2" />
                      Filter Resources
                      {activeFilterCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    {viewType === "personnel" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Job Role</h4>
                          <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                            {filterOptions.jobRoles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center space-x-2 mb-1"
                              >
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={activeFilters.jobRoleIds.includes(
                                    role.id
                                  )}
                                  onCheckedChange={() =>
                                    handleFilterChange("jobRoleIds", role.id)
                                  }
                                />
                                <label
                                  htmlFor={`role-${role.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {role.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Sub-Team</h4>
                          <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                            {filterOptions.subTeams.map((team) => (
                              <div
                                key={team.id}
                                className="flex items-center space-x-2 mb-1"
                              >
                                <Checkbox
                                  id={`team-${team.id}`}
                                  checked={activeFilters.subTeamIds.includes(
                                    team.id
                                  )}
                                  onCheckedChange={() =>
                                    handleFilterChange("subTeamIds", team.id)
                                  }
                                />
                                <label
                                  htmlFor={`team-${team.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {team.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Line Manager</h4>
                          <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                            {filterOptions.lineManagers.map((manager) => (
                              <div
                                key={manager.id}
                                className="flex items-center space-x-2 mb-1"
                              >
                                <Checkbox
                                  id={`manager-${manager.id}`}
                                  checked={activeFilters.lineManagerIds.includes(
                                    manager.id
                                  )}
                                  onCheckedChange={() =>
                                    handleFilterChange(
                                      "lineManagerIds",
                                      manager.id
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`manager-${manager.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {manager.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {viewType === "equipment" && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Equipment Type</h4>
                        <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                          {filterOptions.assetCategories.map((cat) => (
                            <div
                              key={cat.id}
                              className="flex items-center space-x-2 mb-1"
                            >
                              <Checkbox
                                id={`cat-${cat.id}`}
                                checked={activeFilters.assetCategoryIds.includes(
                                  cat.id
                                )}
                                onCheckedChange={() =>
                                  handleFilterChange("assetCategoryIds", cat.id)
                                }
                              />
                              <label
                                htmlFor={`cat-${cat.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {cat.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
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
                    color: r.color,
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
                onAssignmentClick={handleAssignmentClick}
                forecasts={forecasts}
              />
            )}
          </div>
        </div>
      </div>

      <BulkAssignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        workItems={[
          ...allWorkItems,
          ...allResources.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type as any,
            color: r.color,
          })),
        ]}
        onSave={handleBulkAssign}
      />
    </DndProvider>
  );
}
