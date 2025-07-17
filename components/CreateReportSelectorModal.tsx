"use client";

import Modal from "./Modal";
import { FileText, AlertTriangle, UserCheck, X } from "react-feather";

export type ReportType =
  | "Shift Report"
  | "Lost Shift Report"
  | "Incident Report"
  | "Site Briefing";

type CreateReportSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reportType: ReportType) => void;
};

const reportTypes = [
  {
    name: "Shift Report",
    icon: FileText,
    description: "Standard end-of-day summary of work.",
  },
  {
    name: "Lost Shift Report",
    icon: X,
    description: "Log a shift that was missed or cancelled.",
  },
  {
    name: "Incident Report",
    icon: AlertTriangle,
    description: "Log an accident, near-miss, or safety concern.",
  },
  {
    name: "Site Briefing",
    icon: UserCheck,
    description: "Record a toolbox talk or safety briefing.",
    disabled: true,
  },
];

export default function CreateReportSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: CreateReportSelectorModalProps) {
  return (
    <Modal title="Create New Log or Report" isOpen={isOpen} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.name}
            onClick={() => onSelect(type.name as ReportType)}
            disabled={type.disabled}
            className="p-4 border rounded-lg text-left hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
          >
            <div className="flex items-center">
              <type.icon className="h-6 w-6 mr-3 text-blue-600" />
              <span className="font-bold text-lg">{type.name}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{type.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}
