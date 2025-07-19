"use client";

import { EventLog } from "@/lib/types";

// A small helper component to format the linked items cleanly
const LinkedItem = ({ name }: { name: string | null }) => (
  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
    {name}
  </span>
);

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{children}</dd>
  </div>
);

type LogDetailsProps = {
  log: EventLog;
};

export default function ShiftReportDetails({ log }: LogDetailsProps) {
  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // This component now directly uses the rich data passed into it from the parent modal
  const personnel = (log as any).personnel || [];
  const assets = (log as any).assets || [];
  const vehicles = (log as any).vehicles || [];

  return (
    <dl className="sm:divide-y sm:divide-gray-200 text-sm">
      <DetailRow label="Project">{log.project?.name}</DetailRow>
      <DetailRow label="Start Time">{formatDateTime(log.start_time)}</DetailRow>
      <DetailRow label="End Time">{formatDateTime(log.end_time)}</DetailRow>
      <DetailRow label="Work Completed">
        <p className="whitespace-pre-wrap">
          {log.work_completed || "No details provided."}
        </p>
      </DetailRow>
      <DetailRow label="Personnel on Site">
        {personnel.length > 0
          ? personnel.map((p: any) => (
              <LinkedItem key={p.id} name={`${p.first_name} ${p.last_name}`} />
            ))
          : "N/A"}
      </DetailRow>
      <DetailRow label="Equipment Used">
        {assets.length > 0
          ? assets.map((a: any) => (
              <LinkedItem key={a.id} name={`${a.system_id} (${a.model})`} />
            ))
          : "None"}
      </DetailRow>
      <DetailRow label="Vehicles Used">
        {vehicles.length > 0
          ? vehicles.map((v: any) => (
              <LinkedItem key={v.id} name={`${v.registration_number}`} />
            ))
          : "None"}
      </DetailRow>
      <DetailRow label="Notes">
        <p className="whitespace-pre-wrap">{log.notes || "No notes."}</p>
      </DetailRow>
      <DetailRow label="Submitted By">
        {`${log.created_by?.first_name || ""} ${log.created_by?.last_name || ""}`.trim()}
      </DetailRow>
    </dl>
  );
}
