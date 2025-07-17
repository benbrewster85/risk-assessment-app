"use client";

import { EventLog } from "@/lib/types";
import Modal from "./Modal";

type ShiftReportDetailModalProps = {
  report: EventLog | null;
  onClose: () => void;
};

const LinkedItem = ({ name }: { name: string | null }) => (
  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
    {name}
  </span>
);

export default function ShiftReportDetailModal({
  report,
  onClose,
}: ShiftReportDetailModalProps) {
  if (!report) return null;

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Safely access the nested data
  const personnel = (report as any).personnel || [];
  const assets = (report as any).assets || [];
  const vehicles = (report as any).vehicles || [];

  return (
    <Modal
      title={`Report for ${report.project?.name || ""}`}
      isOpen={true}
      onClose={onClose}
    >
      <div className="text-sm">
        <p className="text-gray-500 mb-4">
          Logged as: <span className="font-semibold">{report.log_type}</span> by{" "}
          {`${report.created_by?.first_name || ""} ${report.created_by?.last_name || ""}`.trim()}
        </p>
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Project</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {report.project?.name}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Submitted By</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {`${report.created_by?.first_name || ""} ${report.created_by?.last_name || ""}`.trim()}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Start Time</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDateTime(report.start_time)}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">End Time</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDateTime(report.end_time)}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Personnel on Site</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {personnel.map((p: any) => (
                <LinkedItem
                  key={p.profiles.id}
                  name={`${p.profiles.first_name} ${p.profiles.last_name}`}
                />
              )) || "N/A"}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Work Completed</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
              {report.work_completed || "No details provided."}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Equipment Used</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {assets.length > 0
                ? assets.map((a: any) => (
                    <LinkedItem
                      key={a.assets.id}
                      name={`${a.assets.system_id} (${a.assets.model})`}
                    />
                  ))
                : "None"}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Vehicles Used</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
              {vehicles.length > 0
                ? vehicles.map((v: any) => (
                    <LinkedItem
                      key={v.vehicles.id}
                      name={`${v.vehicles.registration_number}`}
                    />
                  ))
                : "None"}
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
              {report.notes || "No notes."}
            </dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 text-right">
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 border rounded-md"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
