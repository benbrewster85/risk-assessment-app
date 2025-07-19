"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventLog, TeamMember, Asset, Vehicle } from "@/lib/types";
import Modal from "./Modal";
import LostShiftReportDetails from "./LostShiftReportDetails";
import ShiftReportDetails from "./ShiftReportDetails";
import IncidentReportDetails from "./IncidentReportDetails";

type ViewReportModalProps = {
  reportId: string | null;
  onClose: () => void;
};

// This is the full, enriched report type that includes all the linked data
type FullEventLog = EventLog & {
  personnel: TeamMember[];
  assets: Asset[];
  vehicles: Vehicle[];
};

export default function ViewReportModal({
  reportId,
  onClose,
}: ViewReportModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<FullEventLog | null>(null);

  useEffect(() => {
    const fetchFullReportDetails = async () => {
      if (!reportId) {
        setReport(null);
        return;
      }
      setLoading(true);

      try {
        // Step 1: Fetch the main report details
        const { data: reportData, error: reportError } = await supabase
          .from("event_logs")
          .select(
            "*, project:projects(name), created_by:profiles(first_name, last_name)"
          )
          .eq("id", reportId)
          .single();

        if (reportError) throw reportError;

        // Step 2: Fetch all linked data in parallel
        const [personnelResult, assetsResult, vehiclesResult] =
          await Promise.all([
            supabase
              .from("event_log_personnel")
              .select("user:profiles(id, first_name, last_name, role)")
              .eq("log_id", reportId),
            supabase
              .from("event_log_assets")
              .select("asset:assets(id, system_id, model)")
              .eq("log_id", reportId),
            supabase
              .from("event_log_vehicles")
              .select("vehicle:vehicles(id, registration_number, model)")
              .eq("log_id", reportId),
          ]);

        // Step 3: Combine all the data into a single object
        const fullReport: FullEventLog = {
          ...(reportData as EventLog),
          personnel:
            personnelResult.data?.map((p: any) => p.user).filter(Boolean) || [],
          assets:
            assetsResult.data?.map((a: any) => a.asset).filter(Boolean) || [],
          vehicles:
            vehiclesResult.data?.map((v: any) => v.vehicle).filter(Boolean) ||
            [],
        };

        setReport(fullReport);
      } catch (error) {
        console.error("Failed to fetch full report details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullReportDetails();
  }, [reportId, supabase]);

  const renderReportDetails = () => {
    if (!report) return null;

    switch (report.log_type) {
      case "Shift Report":
        return <ShiftReportDetails log={report} />;
      case "Lost Shift Report":
        return <LostShiftReportDetails log={report} />;
      case "Incident Report": // Add this case
        return <IncidentReportDetails log={report} />;
      default:
        return (
          <p>This report type ({report.log_type}) cannot be displayed yet.</p>
        );
    }
  };

  return (
    <Modal title="Report Details" isOpen={reportId !== null} onClose={onClose}>
      {loading && <p className="text-center p-8">Loading details...</p>}
      {!loading && report && (
        <div>
          {renderReportDetails()}
          <div className="mt-6 text-right">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
