"use client";

import { Asset, AssetIssue, Vehicle, VehicleEvent } from "@/lib/types";
import Link from "next/link";
import { AlertTriangle, CheckCircle, MessageSquare, Tool } from "react-feather"; // FIXED: Wrench is now Tool
import type { Icon as IconType } from "react-feather";

// This function remains the same
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

// NEW: Helper function for MOT status
const getMotStatus = (vehicle: Vehicle) => {
  if (!vehicle.mot_due_date) {
    return { status: "n/a" };
  }
  const motDueDate = new Date(vehicle.mot_due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (motDueDate < today) {
    return {
      status: "Overdue",
      date: motDueDate,
      color: "text-red-600",
      Icon: AlertTriangle,
    };
  }
  if (motDueDate < thirtyDaysFromNow) {
    return {
      status: "Due Soon",
      date: motDueDate,
      color: "text-amber-600",
      Icon: AlertTriangle,
    };
  }
  return {
    status: "ok",
    date: motDueDate,
    color: "text-green-600",
    Icon: CheckCircle,
  };
};

export default function ActionItems({
  assetIssues,
  vehicleIssues,
  assetsForCalibration,
  vehiclesForMot,
}: {
  assetIssues: AssetIssue[];
  vehicleIssues: VehicleEvent[];
  assetsForCalibration: Asset[];
  vehiclesForMot: Vehicle[];
}) {
  // Process the pre-filtered arrays
  const calibrationAlerts = assetsForCalibration.map((asset) => ({
    asset,
    ...getCalibrationStatus(asset),
  }));

  const motAlerts = vehiclesForMot.map((vehicle) => ({
    vehicle,
    ...getMotStatus(vehicle),
  }));

  // CHANGED: Update the check to include all action item types
  if (
    assetIssues.length === 0 &&
    vehicleIssues.length === 0 &&
    calibrationAlerts.filter(
      (a) => a.status === "Overdue" || a.status === "Due Soon"
    ).length === 0 &&
    motAlerts.filter((m) => m.status === "Overdue" || m.status === "Due Soon")
      .length === 0
  ) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow p-6 text-center text-gray-500">
        <p>You have no pending action items. Great job!</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Action Items</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* CHANGED: This section now combines both asset and vehicle issues */}
        {(assetIssues.length > 0 || vehicleIssues.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Open Issues Reported</h3>
            <div className="space-y-4">
              {assetIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border-t pt-4 first:pt-0 first:border-t-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Tool className="h-5 w-5 mr-3 text-orange-600" />{" "}
                      {/* FIXED: Icon is Tool */}
                      <div>
                        <p className="font-semibold">
                          Asset: {(issue as any)?.system_id || "Unknown"}
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
              {vehicleIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border-t pt-4 first:pt-0 first:border-t-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-3 text-orange-600" />
                      <div>
                        <p className="font-semibold">
                          Vehicle:{" "}
                          {(issue as any)?.registration_number || "Unknown"}{" "}
                          {/* FIXED: Use registration_number */}
                        </p>
                        <p className="text-sm text-orange-600 font-bold">
                          New Issue
                        </p>
                      </div>
                    </div>
                    {/* FIXED: Use (issue as any).vehicle_id to bypass type error */}
                    <Link
                      href={`/dashboard/vehicles/${(issue as any).vehicle_id}`}
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

        {/* This section for Calibration Alerts remains mostly the same */}
        {calibrationAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Calibration Due</h3>
            <div className="space-y-4">
              {calibrationAlerts.map(({ asset, status, date, color, Icon }) => {
                if (!Icon || status === "ok" || status === "n/a") return null;
                return (
                  <div
                    key={asset.id}
                    className="border-t pt-4 first:pt-0 first:border-t-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 mr-3 ${color}`} />
                        <div>
                          <p className="font-semibold">{asset.system_id}</p>
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

        {/* NEW: Section for MOT Alerts */}
        {motAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">MOT Due</h3>
            <div className="space-y-4">
              {motAlerts.map(({ vehicle, status, date, color, Icon }) => {
                if (!Icon || status === "ok" || status === "n/a") return null;
                return (
                  <div
                    key={vehicle.id}
                    className="border-t pt-4 first:pt-0 first:border-t-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 mr-3 ${color}`} />
                        <div>
                          <p className="font-semibold">
                            {vehicle.registration_number}
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
                          href={`/dashboard/vehicles/${vehicle.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Vehicle &rarr;
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
