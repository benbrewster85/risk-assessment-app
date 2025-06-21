"use client";

import { Asset, AssetIssue } from "@/lib/types";
import Link from "next/link";
import { AlertTriangle, CheckCircle, MessageSquare } from "react-feather";
import type { Icon as IconType } from "react-feather";

const getCalibrationStatus = (asset: Asset) => {
  if (!asset.last_calibrated_date || !asset.calibration_cycle_months) {
    return { status: "n/a" };
  }
  const lastCalib = new Date(asset.last_calibrated_date);
  const nextDueDate = new Date(
    new Date(lastCalib).setMonth(
      lastCalib.getMonth() + asset.calibration_cycle_months
    )
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (nextDueDate < today) {
    return {
      status: "Overdue",
      date: nextDueDate,
      color: "text-red-600",
      Icon: AlertTriangle,
    };
  }
  if (nextDueDate < thirtyDaysFromNow) {
    return {
      status: "Due Soon",
      date: nextDueDate,
      color: "text-amber-600",
      Icon: AlertTriangle,
    };
  }
  return {
    status: "ok",
    date: nextDueDate,
    color: "text-green-600",
    Icon: CheckCircle,
  };
};

export default function ActionItems({
  assets,
  openIssues,
}: {
  assets: Asset[];
  openIssues: AssetIssue[];
}) {
  const calibrationAlerts = assets
    .map((asset) => ({ asset, ...getCalibrationStatus(asset) }))
    .filter((item) => item.status === "Overdue" || item.status === "Due Soon");

  if (calibrationAlerts.length === 0 && openIssues.length === 0) {
    return null; // Don't render if there are no action items
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Action Items</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Section for Open Issues */}
        {openIssues.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">New Issues Reported</h3>
            <div className="space-y-4">
              {openIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border-t pt-4 first:pt-0 first:border-t-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-3 text-orange-600" />
                      <div>
                        <p className="font-semibold">
                          {(issue.asset as any)?.system_id || "Unknown Asset"}
                        </p>
                        <p className="text-sm text-orange-600 font-bold">
                          New Issue
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/assets/${issue.asset_id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section for Calibration Alerts */}
        {calibrationAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Calibration Due</h3>
            <div className="space-y-4">
              {calibrationAlerts.map(({ asset, status, date, color, Icon }) => {
                if (!Icon) return null;
                return (
                  <div
                    key={asset.id}
                    className="border-t pt-4 first:pt-0 first:border-t-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 mr-3 ${color}`} />
                        <div>
                          <p className="font-semibold">
                            {asset.system_id}: {asset.manufacturer}{" "}
                            {asset.model}
                          </p>
                          <p className={`text-sm font-bold ${color}`}>
                            {status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          Due:{" "}
                          {date?.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <Link
                          href={`/dashboard/assets/${asset.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Asset &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
