"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Assignment, WorkItem } from "@/lib/types";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, isBefore } from "date-fns";
import { DateRange, DayPicker } from "react-day-picker";

export type BulkAssignFormData = {
  startDate: Date | undefined;
  endDate: Date | undefined;
  shift: "day" | "night" | "both";
  includeWeekends: boolean;
};

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  workItems: WorkItem[];
  onSave: (formData: BulkAssignFormData) => void;
}

export function BulkAssignModal({
  isOpen,
  onClose,
  assignment,
  workItems,
  onSave,
}: BulkAssignModalProps) {
  // --- STATE CHANGE: Use a single state for the date range ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [shift, setShift] = useState<"day" | "night" | "both">("both");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [month, setMonth] = useState<Date | undefined>();

  // --- NEW: State to track if we're using the initial default date ---
  const [isInitialDate, setIsInitialDate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        const initialDate = new Date(assignment.date);
        // Set the range to a single day, and flag it as the initial default
        setDateRange({ from: initialDate, to: initialDate });
        setMonth(initialDate);
        setIsInitialDate(true); // This is the key to our new logic
      } else {
        // Reset if there's no assignment
        setDateRange(undefined);
        setMonth(new Date());
        setIsInitialDate(false);
      }
      // Reset other form fields
      setShift("both");
      setIncludeWeekends(false);
    }
  }, [isOpen, assignment]);

  if (!assignment) return null;

  const itemDetails = workItems.find(
    (item) =>
      item.id === assignment.workItemId || item.id === assignment.resourceId
  );

  const handleSave = () => {
    // Deconstruct the range for the onSave callback
    onSave({
      startDate: dateRange?.from,
      endDate: dateRange?.to,
      shift,
      includeWeekends,
    });
    onClose();
  };

  // --- REBUILT: The core logic for intuitive date selection ---
  const handleDateSelect = (
    range: DateRange | undefined,
    selectedDay: Date
  ) => {
    // Turn off the special initial date behavior after the first interaction
    setIsInitialDate(false);

    // If this is the first click after the default was set...
    if (isInitialDate && dateRange?.from) {
      // ...treat this click as setting the end date.
      const startDate = dateRange.from;
      // Ensure "from" is always before "to"
      if (isBefore(selectedDay, startDate)) {
        setDateRange({ from: selectedDay, to: startDate });
      } else {
        setDateRange({ from: startDate, to: selectedDay });
      }
      return;
    }

    // For all other cases, use the standard, intuitive "reset and restart" logic
    // This is the default behavior of the library when a range is already complete.
    if (dateRange?.from && dateRange?.to) {
      setDateRange({ from: selectedDay, to: undefined });
      setMonth(selectedDay);
    } else {
      setDateRange(range);
      // When a start date is picked, jump the calendar view to that month
      if (range?.from) {
        setMonth(range.from);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {/* ... DialogHeader ... */}
        <DialogHeader>
          <DialogTitle>Bulk Assign: {itemDetails?.name}</DialogTitle>
          <DialogDescription>
            Select a date range and options to create multiple assignments.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="dateRange" className="text-right">
              Date Range
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="col-span-3 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    // Display single date differently from a range
                    dateRange.to && dateRange.to !== dateRange.from ? (
                      <>
                        {format(dateRange.from, "LLL d, y")} -{" "}
                        {format(dateRange.to, "LLL d, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL d, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect} // The new logic is here
                  numberOfMonths={2}
                  // --- NEW: Control the calendar's month view ---
                  month={month}
                  onMonthChange={setMonth}
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Other form fields remain the same */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="shift" className="text-right">
              Shift
            </label>
            <Select
              value={shift}
              onValueChange={(value: "day" | "night" | "both") =>
                setShift(value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Day & Night</SelectItem>
                <SelectItem value="day">Day Only</SelectItem>
                <SelectItem value="night">Night Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox
                id="includeWeekends"
                checked={includeWeekends}
                onCheckedChange={(checked) => setIncludeWeekends(!!checked)}
              />
              <label htmlFor="includeWeekends" className="text-sm font-medium">
                Include weekends
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Assignments</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
