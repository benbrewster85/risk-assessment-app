import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShiftReport, TeamMember, Asset, Vehicle } from "@/lib/types";
import ShiftReportDetailPage from "@/components/ShiftReportDetailPage";

export const dynamic = "force-dynamic";

type ReportPageProps = {
  params: { reportId: string };
};

export default async function ReportPage({ params }: ReportPageProps) {
  const supabase = createClient();
  const { reportId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) notFound();

  // Fetch the main report and all its linked data
  const { data: report, error } = await supabase
    .from("shift_reports")
    .select(
      `
            *,
            project:projects(name),
            created_by:profiles(first_name, last_name),
            personnel:shift_report_personnel(profiles(id, first_name, last_name)),
            assets:shift_report_assets(assets(id, system_id, model)),
            vehicles:shift_report_vehicles(vehicles(id, registration_number, model))
        `
    )
    .eq("id", reportId)
    .eq("team_id", profile.team_id)
    .single();

  if (error || !report) {
    console.error("Error fetching shift report:", error);
    notFound();
  }

  return (
    <ShiftReportDetailPage initialReport={report as unknown as ShiftReport} />
  );
}
