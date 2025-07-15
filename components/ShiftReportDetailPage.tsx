"use client";

import { useState, useEffect } from "react";
import { ShiftReport } from "@/lib/types";
import Link from "next/link";

type ShiftReportDetailPageProps = {
  initialReport: ShiftReport;
  fromProjectId?: string; // Optional prop to handle the back link
};

// A small helper component to format the linked items cleanly
const LinkedItem = ({
  item,
  type,
}: {
  item: { id: string; name: string | null };
  type: "asset" | "vehicle" | "user";
}) => {
  // We can add specific links here in the future if needed
  // For now, it just displays a consistent badge.
  return (
    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
      {item.name}
    </span>
  );
};

export default function ShiftReportDetailPage({
  initialReport,
  fromProjectId,
}: ShiftReportDetailPageProps) {
  const [report, setReport] = useState(initialReport);

  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Determine the correct "back" link based on whether we came from a project page
  const backLink = fromProjectId
    ? {
        href: `/dashboard/project/${fromProjectId}`,
        text: `Project: ${report.project?.name || "..."}`,
      }
    : { href: "/dashboard/logs", text: "All Logs & Records" };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-sm">
          <Link href={backLink.href} className="text-blue-600 hover:underline">
            &larr; Back to {backLink.text}
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-xl leading-6 font-bold text-gray-900">
              Shift Report for {report.project?.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Submitted by{" "}
              {`${report.created_by?.first_name || ""} ${report.created_by?.last_name || ""}`.trim()}{" "}
              on {new Date(report.created_at).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Start Time
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDateTime(report.start_time)}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">End Time</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDateTime(report.end_time)}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Personnel on Site
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {(report as any).personnel?.map((p: any) => (
                    <LinkedItem
                      key={p.profiles.id}
                      item={{
                        id: p.profiles.id,
                        name: `${p.profiles.first_name} ${p.profiles.last_name}`,
                      }}
                      type="user"
                    />
                  )) || "N/A"}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Work Completed
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                  {report.work_completed || "No details provided."}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Equipment Used
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {(report as any).assets?.length > 0
                    ? (report as any).assets.map((a: any) => (
                        <LinkedItem
                          key={a.assets.id}
                          item={{
                            id: a.assets.id,
                            name: `${a.assets.system_id} (${a.assets.model})`,
                          }}
                          type="asset"
                        />
                      ))
                    : "None"}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Vehicles Used
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {(report as any).vehicles?.length > 0
                    ? (report as any).vehicles.map((v: any) => (
                        <LinkedItem
                          key={v.vehicles.id}
                          item={{
                            id: v.vehicles.id,
                            name: `${v.vehicles.registration_number}`,
                          }}
                          type="vehicle"
                        />
                      ))
                    : "None"}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                  {report.notes || "No notes."}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
