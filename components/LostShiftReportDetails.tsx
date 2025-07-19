"use client";

import { EventLog, TeamMember } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// This is a helper component, you can keep it in this file
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

export default function LostShiftReportDetails({ log }: LogDetailsProps) {
  const supabase = createClient();
  const [personnel, setPersonnel] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchPersonnel = async () => {
      const userIds = log.log_data?.personnel_ids || [];
      if (userIds.length === 0) return;

      // UPDATED: This query now correctly fetches the 'role' as required by the TeamMember type
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", userIds);

      if (data) {
        setPersonnel(data as TeamMember[]);
      }
    };
    fetchPersonnel();
  }, [log, supabase]);

  return (
    <dl className="sm:divide-y sm:divide-gray-200">
      <DetailRow label="Project">{log.project?.name}</DetailRow>
      <DetailRow label="Date of Lost Shift">
        {new Date(log.start_time).toLocaleDateString("en-GB")}
      </DetailRow>
      <DetailRow label="Reason for Loss">
        <p className="whitespace-pre-wrap">
          {log.log_data?.reason_for_loss || "No reason provided."}
        </p>
      </DetailRow>
      <DetailRow label="Personnel Involved">
        {personnel.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}
      </DetailRow>
      <DetailRow label="Submitted By">
        {`${log.created_by?.first_name || ""} ${log.created_by?.last_name || ""}`.trim()}
      </DetailRow>
    </dl>
  );
}
