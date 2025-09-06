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
import { format } from "date-fns";

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
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [shift, setShift] = useState<"day" | "night" | "both">("both");
  const [includeWeekends, setIncludeWeekends] = useState(false);

  useEffect(() => {
    if (assignment) {
      const initialDate = new Date(assignment.date);
      setStartDate(initialDate);
      setEndDate(initialDate);
      setShift("both");
      setIncludeWeekends(false);
    }
  }, [assignment]);

  if (!assignment) return null;

  const itemDetails = workItems.find(
    (item) =>
      item.id === assignment.workItemId || item.id === assignment.resourceId
  );

  const handleSave = () => {
    onSave({ startDate, endDate, shift, includeWeekends });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Assign: {itemDetails?.name}</DialogTitle>
          <DialogDescription>
            Select a date range and options to create multiple assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="startDate" className="text-right">
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="col-span-3">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="endDate" className="text-right">
              End Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="col-span-3">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
