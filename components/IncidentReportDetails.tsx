"use client";

import { EventLog } from "@/lib/types";

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

export default function IncidentReportDetails({ log }: LogDetailsProps) {
  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const logData = log.log_data || {};

  return (
    <dl className="sm:divide-y sm:divide-gray-200 text-sm">
      <DetailRow label="Project">{log.project?.name}</DetailRow>
      <DetailRow label="Time of Incident">
        {formatDateTime(log.start_time)}
      </DetailRow>
      <DetailRow label="Severity Level">{logData.severity || "N/A"}</DetailRow>
      <DetailRow label="People Involved">
        {logData.people_involved || "N/A"}
      </DetailRow>
      <DetailRow label="Description of Incident">
        <p className="whitespace-pre-wrap">
          {logData.description || "No details provided."}
        </p>
      </DetailRow>
      <DetailRow label="Immediate Action Taken">
        <p className="whitespace-pre-wrap">
          {logData.action_taken || "No action recorded."}
        </p>
      </DetailRow>
      <DetailRow label="Submitted By">
        {`${log.created_by?.first_name || ""} ${log.created_by?.last_name || ""}`.trim()}
      </DetailRow>
    </dl>
  );
}
