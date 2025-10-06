import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  EventLog,
  ProjectListItem,
  TeamMember,
  Asset,
  Vehicle,
} from "@/lib/types";
import LogsListPage from "@/components/LogsListPage";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) {
    return <p className="p-8">You must be part of a team to view this page.</p>;
  }
  const teamId = profile.team_id;

  const [
    reportsResult,
    projectsResult,
    membersResult,
    assetsResult,
    vehiclesResult,
  ] = await Promise.all([
    supabase
      .from("event_logs")
      .select(
        "*, project:projects(id, name), created_by:profiles(id, first_name, last_name)"
      )
      .eq("team_id", teamId)
      .order("start_time", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("team_id", teamId)
      .neq("document_status", "Completed")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("team_id", teamId),
    supabase
      .from("assets")
      .select("*, category:asset_categories(asset_category_class)")
      .eq("team_id", teamId),
    supabase
      .from("vehicles")
      .select("id, registration_number, model")
      .eq("team_id", teamId),
  ]);

  // This new block of code processes the raw data from Supabase
  const initialReports = (reportsResult.data || []).map((report) => ({
    ...report,
    project: Array.isArray(report.project) ? report.project[0] : report.project,
    created_by: Array.isArray(report.created_by)
      ? report.created_by[0]
      : report.created_by,
  }));

  return (
    <LogsListPage
      initialReports={initialReports as EventLog[]}
      projects={(projectsResult.data as ProjectListItem[]) || []}
      teamMembers={(membersResult.data as TeamMember[]) || []}
      assets={(assetsResult.data as Asset[]) || []}
      vehicles={(vehiclesResult.data as Vehicle[]) || []}
      teamId={teamId}
      userId={user.id}
    />
  );
}
