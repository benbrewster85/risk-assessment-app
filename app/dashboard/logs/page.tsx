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

  // Fetch all the data needed for the "Create" modal dropdowns
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
        "*, project:projects(id, name), created_by:profiles(first_name, last_name)"
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("team_id", teamId),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("team_id", teamId),
    supabase
      .from("assets")
      .select("id, system_id, model")
      .eq("team_id", teamId),
    supabase
      .from("vehicles")
      .select("id, registration_number, model")
      .eq("team_id", teamId),
  ]);

  return (
    <LogsListPage
      initialReports={(reportsResult.data as EventLog[]) || []}
      projects={(projectsResult.data as ProjectListItem[]) || []}
      teamMembers={(membersResult.data as TeamMember[]) || []}
      assets={(assetsResult.data as Asset[]) || []}
      vehicles={(vehiclesResult.data as Vehicle[]) || []}
      teamId={teamId}
      userId={user.id}
    />
  );
}
