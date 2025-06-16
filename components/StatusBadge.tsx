"use client";

type StatusBadgeProps = {
  status: string | null;
};

const statusColors: { [key: string]: string } = {
  // Asset Statuses
  "In Stores": "bg-blue-100 text-blue-800",
  "On Site": "bg-green-100 text-green-800",
  "In Repair": "bg-yellow-100 text-yellow-800",
  // Calibration Statuses
  Overdue: "bg-red-100 text-red-800",
  "Due Soon": "bg-amber-100 text-amber-800",
  OK: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {status}
    </span>
  );
}
