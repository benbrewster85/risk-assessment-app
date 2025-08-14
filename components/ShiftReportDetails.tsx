"use client";

import { EventLog, EventLogTask } from "@/lib/types";

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

  const personnel = (log as any).personnel || [];
  const assets = (log as any).assets || [];
  const vehicles = (log as any).vehicles || [];
  const tasks: EventLogTask[] = log.tasks || [];

  return (
    <dl className="sm:divide-y sm:divide-gray-200 text-sm">
      <DetailRow label="Project">{log.project?.name}</DetailRow>
      <DetailRow label="Start Time">{formatDateTime(log.start_time)}</DetailRow>
      <DetailRow label="End Time">{formatDateTime(log.end_time)}</DetailRow>

      {tasks.length > 0 && (
        <DetailRow label="Task Progress">
          <div className="space-y-4">
            {tasks
              .filter((t: any) => t.task)
              .map((t: any) => (
                <div key={t.task_id} className="p-3 bg-slate-50 rounded-md">
                  <p className="font-semibold text-gray-800">{t.task.title}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Progress during this shift:</span>
                      <span>
                        {t.progress_at_shift_start}% &rarr;{" "}
                        {t.progress_on_report}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{
                          width: `${t.progress_on_report}%`,
                          backgroundImage: `linear-gradient(to right, #d1d5db ${t.progress_at_shift_start}%, #16a34a ${t.progress_at_shift_start}%)`,
                        }}
                      ></div>
                    </div>
                  </div>
                  {t.notes && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-500">
                        Notes for this task:
                      </p>
                      <p className="text-xs text-gray-700 p-2 bg-white border rounded-md mt-1 whitespace-pre-wrap">
                        {t.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </DetailRow>
      )}

      <DetailRow label="Work Completed">
        <p className="whitespace-pre-wrap">
          {log.work_completed || "No details provided."}
        </p>
      </DetailRow>
      <DetailRow label="Personnel on Site">
        {personnel.map((p: any) => (
          <LinkedItem key={p.id} name={`${p.first_name} ${p.last_name}`} />
        ))}
      </DetailRow>
      <DetailRow label="Equipment Used">
        {assets.map((a: any) => (
          <LinkedItem key={a.id} name={`${a.system_id} (${a.model})`} />
        ))}
      </DetailRow>
      <DetailRow label="Vehicles Used">
        {vehicles.map((v: any) => (
          <LinkedItem key={v.id} name={`${v.registration_number}`} />
        ))}
      </DetailRow>
      <DetailRow label="Notes">
        <p className="whitespace-pre-wrap">{log.notes || "No notes."}</p>
      </DetailRow>
    </dl>
  );
}
