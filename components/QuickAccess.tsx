// components/QuickAccess.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, Truck, BookOpen, Calendar } from "lucide-react";
import LogShiftReportModal from "./LogShiftReportModal";
import LogMileageModal from "./LogMileageModal"; // Assuming this is the correct path
import { ProjectListItem, TeamMember, Asset, Vehicle } from "@/lib/types";

type QuickAccessProps = {
  projects: ProjectListItem[];
  teamMembers: TeamMember[];
  assets: Asset[];
  vehicles: Vehicle[];
  teamId: string;
  userId: string;
};

export default function QuickAccess({
  projects,
  teamMembers,
  assets,
  vehicles,
  teamId,
  userId,
}: QuickAccessProps) {
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);

  const quickAccessItems = [
    {
      type: "modal",
      title: "Log Shift Report",
      onClick: () => setIsShiftModalOpen(true),
      icon: <PlusCircle size={20} />,
    },
    {
      type: "modal",
      title: "Log Vehicle Mileage",
      onClick: () => setIsMileageModalOpen(true),
      icon: <Truck size={20} />,
    },
    {
      type: "placeholder",
      title: "View Current Project",
      icon: <BookOpen size={20} />,
    },
    {
      type: "link",
      title: "View Schedule",
      href: "/dashboard/scheduler",
      icon: <Calendar size={20} />,
    },
  ];

  return (
    <>
      <LogShiftReportModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        projects={projects}
        teamMembers={teamMembers}
        assets={assets}
        vehicles={vehicles}
        teamId={teamId}
        userId={userId}
        onSuccess={() => {}}
      />

      {/* ADDED MISSING PROPS TO THE MILEAGE MODAL */}
      <LogMileageModal
        isOpen={isMileageModalOpen}
        onClose={() => setIsMileageModalOpen(false)}
        onSuccess={() => {}} // Add a placeholder onSuccess
        vehicles={vehicles} // Pass down vehicles
        teamId={teamId} // Pass down teamId
        userId={userId} // Pass down userId
      />

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickAccessItems.map((item) => {
            const className =
              "flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors";
            if (item.type === "link") {
              return (
                <Link
                  key={item.title}
                  href={item.href || "#"}
                  className={className}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.title}</span>
                </Link>
              );
            }
            if (item.type === "placeholder") {
              return (
                <button
                  key={item.title}
                  className={`${className} cursor-not-allowed opacity-50`}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.title}</span>
                </button>
              );
            }
            return (
              <button
                key={item.title}
                onClick={item.onClick}
                className={className}
              >
                {item.icon}
                <span className="ml-3 font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
