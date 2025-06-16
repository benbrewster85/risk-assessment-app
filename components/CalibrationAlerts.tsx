"use client";

import { Asset } from "@/lib/types";
import Link from "next/link";
import { AlertTriangle, CheckCircle } from "react-feather";
import type { Icon as IconType } from "react-feather";

type CalibrationStatus = {
  status: "ok" | "due" | "overdue" | "n/a";
  date?: Date;
  color?: string;
  Icon?: IconType;
};

const getCalibrationStatus = (asset: Asset): CalibrationStatus => {
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
      status: "overdue",
      date: nextDueDate,
      color: "text-red-600",
      Icon: AlertTriangle,
    };
  }
  if (nextDueDate < thirtyDaysFromNow) {
    return {
      status: "due",
      date: nextDueDate,
      color: "text-amber-600",
      Icon: AlertTriangle,
    };
  }
  // CORRECTED: This now returns an Icon property for the 'ok' status
  return {
    status: "ok",
    date: nextDueDate,
    color: "text-green-600",
    Icon: CheckCircle,
  };
};

export default function CalibrationAlerts({ assets }: { assets: Asset[] }) {
  const alerts = assets
    .map((asset) => ({ asset, ...getCalibrationStatus(asset) }))
    .filter((item) => item.status === "overdue" || item.status === "due");

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Action Items</h2>
      <div className="bg-white rounded-lg shadow">
        <ul className="divide-y divide-gray-200">
          {alerts.map(({ asset, status, date, color, Icon }) => {
            // This guard makes sure we don't try to render a missing icon
            if (!Icon) return null;

            return (
              <li key={asset.id} className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Icon className={`h-6 w-6 mr-4 flex-shrink-0 ${color}`} />
                    <div>
                      <p className="font-semibold">
                        {asset.system_id}: {asset.manufacturer} {asset.model}
                      </p>
                      <p className={`text-sm font-bold ${color}`}>
                        {status === "due" ? "Due Soon" : "Overdue"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
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
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
