"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeamMember, Vehicle, ScheduleEvent } from "@/lib/types";
import { ChevronLeft, ChevronRight, Plus } from "react-feather";
import { format, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";

type SchedulerClientPageProps = {
  initialEvents: ScheduleEvent[];
  staff: TeamMember[];
  vehicles: Vehicle[];
  initialWeek: Date;
};

export default function SchedulerClientPage({
  initialEvents,
  staff,
  vehicles,
  initialWeek,
}: SchedulerClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentWeek, setCurrentWeek] = useState(initialWeek);

  const handleDateChange = (newDate: Date) => {
    setCurrentWeek(newDate);
    const newDateString = format(newDate, "yyyy-MM-dd");
    router.push(`/dashboard/scheduler?week=${newDateString}`);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Scheduler</h1>
          <button className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Event</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow">
          <button
            onClick={() => handleDateChange(subDays(currentWeek, 7))}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft />
          </button>
          <h2 className="text-xl font-semibold">
            {format(weekStart, "d MMMM")} - {format(weekEnd, "d MMMM yyyy")}
          </h2>
          <button
            onClick={() => handleDateChange(addDays(currentWeek, 7))}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {/* The actual timeline grid will be built here in our next step */}
          <p className="p-8 text-center text-gray-500">
            Scheduler timeline view will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
