import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { Asset } from "@/lib/types"; // Assuming your types are here

export const getCalibrationStatus = (asset: Asset) => {
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
    return { status: "Overdue" };
  }
  if (nextDueDate < thirtyDaysFromNow) {
    return { status: "Due Soon" };
  }
  return { status: "ok" };
};