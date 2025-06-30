"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Vehicle, TeamMember, VehicleEvent } from "@/lib/types";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Tool,
  FileText,
} from "react-feather";
import { useRouter } from "next/navigation";
import LogVehicleIssueModal from "./LogVehicleIssueModal";
import LogVehicleServiceModal from "./LogVehicleServiceModal";
import StorageImage from "./StorageImage";

type VehicleDetailPageProps = {
  initialVehicle: Vehicle;
  teamMembers: TeamMember[];
  initialEvents: VehicleEvent[];
  isCurrentUserAdmin: boolean;
  currentUserId: string;
};

const getStatus = (dueDate: string | null) => {
  if (!dueDate) return { text: "N/A", Icon: Calendar, color: "text-gray-500" };
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  if (due < today)
    return { text: "Overdue", Icon: AlertTriangle, color: "text-red-600" };
  if (due < thirtyDaysFromNow)
    return { text: "Due Soon", Icon: AlertTriangle, color: "text-amber-600" };
  return { text: "OK", Icon: CheckCircle, color: "text-green-600" };
};

export default function VehicleDetailPage({
  initialVehicle,
  teamMembers,
  initialEvents,
  isCurrentUserAdmin,
  currentUserId,
}: VehicleDetailPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [events, setEvents] = useState(initialEvents);
  const [selectedAssignee, setSelectedAssignee] = useState(
    initialVehicle.current_assignee_id || ""
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  useEffect(() => {
    setVehicle(initialVehicle);
    setEvents(initialEvents);
    setSelectedAssignee(initialVehicle.current_assignee_id || "");
  }, [initialVehicle, initialEvents]);

  const handleAssign = async () => {
    setIsAssigning(true);
    const { error } = await supabase
      .from("vehicles")
      .update({ current_assignee_id: selectedAssignee || null })
      .eq("id", vehicle.id);
    if (error) {
      toast.error(`Failed to assign vehicle: ${error.message}`);
    } else {
      toast.success("Vehicle assigned successfully!");
      router.refresh();
    }
    setIsAssigning(false);
  };

  const handleLogSuccess = (newEvent: VehicleEvent) => {
    setEvents((prev) =>
      [newEvent, ...prev].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
    if (newEvent.log_type === "Service" || newEvent.log_type === "MOT") {
      router.refresh();
    }
  };

  const assigneeName =
    `${(vehicle as any).assignee_first_name || ""} ${(vehicle as any).assignee_last_name || ""}`.trim();
  const serviceDueDate = vehicle.last_serviced_date
    ? new Date(
        new Date(vehicle.last_serviced_date).setMonth(
          new Date(vehicle.last_serviced_date).getMonth() +
            vehicle.service_cycle_months
        )
      )
    : null;
  const serviceStatus = getStatus(serviceDueDate?.toISOString() || null);
  const motStatus = getStatus(vehicle.mot_due_date);

  return (
    <>
      <LogVehicleIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleLogSuccess}
        vehicle={vehicle}
        userId={currentUserId}
      />
      <LogVehicleServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSuccess={handleLogSuccess}
        vehicle={vehicle}
        userId={currentUserId}
      />
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-sm">
            <Link
              href="/dashboard/vehicles"
              className="text-blue-600 hover:underline"
            >
              Vehicle Management
            </Link>
            <span className="mx-2 text-gray-500">&gt;</span>
            <span className="text-gray-700">{vehicle.registration_number}</span>
          </div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">
                    {vehicle.manufacturer} {vehicle.model}
                  </h1>
                  <p className="text-lg font-mono text-gray-500">
                    {vehicle.registration_number}
                  </p>
                </div>
              </div>
              <div className="md:col-span-1 space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium">Currently Assigned To</p>
                  <p className="text-xl font-bold mt-1">
                    {assigneeName || "--"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium">Service Status</p>
                  <div
                    className={`mt-1 flex items-center font-bold text-xl ${serviceStatus.color}`}
                  >
                    <serviceStatus.Icon className="h-5 w-5 mr-2" />
                    <span>{serviceStatus.text}</span>
                  </div>
                  {serviceDueDate && (
                    <p className="text-xs mt-1">
                      Next due: {serviceDueDate.toLocaleDateString("en-GB")}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium">MOT Status</p>
                  <div
                    className={`mt-1 flex items-center font-bold text-xl ${motStatus.color}`}
                  >
                    <motStatus.Icon className="h-5 w-5 mr-2" />
                    <span>{motStatus.text}</span>
                  </div>
                  {vehicle.mot_due_date && (
                    <p className="text-xs mt-1">
                      Due:{" "}
                      {new Date(vehicle.mot_due_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </p>
                  )}
                </div>
                {isCurrentUserAdmin && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <label htmlFor="assignee" className="text-sm font-medium">
                      Re-assign To
                    </label>
                    <div className="flex items-center space-x-2 mt-2">
                      <select
                        id="assignee"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="">(Un-assign)</option>
                        {teamMembers.map((member) => (
                          <option
                            key={member.id}
                            value={member.id}
                          >{`${member.first_name} ${member.last_name}`}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={isAssigning}
                        className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex-shrink-0"
                      >
                        {isAssigning ? "..." : "Assign"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Issue & Service Log</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700"
                >
                  + Log Service/Repair
                </button>
                <button
                  onClick={() => setIsIssueModalOpen(true)}
                  className="bg-orange-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-orange-700"
                >
                  + Log Issue
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {events.length > 0 ? (
                events.map((event) => {
                  const reporterName =
                    `${event.reporter?.first_name || ""} ${event.reporter?.last_name || ""}`.trim() ||
                    "System";
                  const resolverName =
                    `${event.resolver?.first_name || ""} ${event.resolver?.last_name || ""}`.trim();
                  return (
                    <div
                      key={event.id}
                      className="border-t pt-4 first:pt-0 first:border-t-0"
                    >
                      <div className="flex justify-between items-start text-sm">
                        <div>
                          <p className="font-semibold">
                            {event.log_type} logged by {reporterName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleString("en-GB")}
                          </p>
                        </div>
                        {/* UPDATED: Only show the status badge if the log type is 'Issue' */}
                        {event.log_type === "Issue" && (
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${event.status === "Open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                          >
                            {event.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">
                        {event.log_notes}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.attachments.map((p) => {
                          const isPdf = p.file_path
                            .toLowerCase()
                            .endsWith(".pdf");
                          return (
                            <a
                              key={p.id}
                              href={p.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <StorageImage
                                filePath={p.file_path}
                                bucket="vehicle-event-attachments"
                                alt="Event attachment"
                                className="h-24 w-24 object-cover rounded-md border hover:opacity-80"
                              />
                            </a>
                          );
                        })}
                      </div>
                      {event.status === "Resolved" && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                          <p className="text-xs font-semibold text-green-800">
                            Resolution by {resolverName} on{" "}
                            {new Date(event.resolved_at!).toLocaleDateString(
                              "en-GB"
                            )}
                            :
                          </p>
                          <p className="text-sm text-green-900 whitespace-pre-wrap">
                            {event.resolution_notes}
                          </p>
                        </div>
                      )}
                      {isCurrentUserAdmin &&
                        event.status === "Open" &&
                        event.log_type === "Issue" && (
                          <div className="mt-3 text-right">
                            <button className="flex items-center text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md ml-auto">
                              <Tool className="h-3 w-3 mr-1" />
                              Resolve Issue
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No issues or service events have been logged.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
